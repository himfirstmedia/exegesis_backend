// Preview: node scripts/migrate-r2-account.js
// Copy and verify: node scripts/migrate-r2-account.js --apply
// Also migrate stored media URLs: add --rewrite-urls.
// Destination: R2_* in .env. Source: R2_SOURCE_* or the commented
// "OLD EMAIL CONFIGURATION" R2 block in .env. No source files are deleted.
import fs from "node:fs";
import { createHash } from "node:crypto";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import {
  S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand,
} from "@aws-sdk/client-s3";

const text = fs.readFileSync(new URL("../.env", import.meta.url), "utf8");
const env = { ...dotenv.parse(text), ...process.env };
const oldBlock = text.split("# OLD EMAIL CONFIGURATION")[1] || "";
const source = dotenv.parse(oldBlock.split("\n")
  .filter((line) => /^# R2_/.test(line)).map((line) => line.slice(2)).join("\n"));
for (const name of ["ACCOUNT_ID", "ACCESS_KEY_ID", "SECRET_ACCESS_KEY", "BUCKET", "ENDPOINT", "PUBLIC_BASE_URL"]) {
  if (env[`R2_SOURCE_${name}`]) source[`R2_${name}`] = env[`R2_SOURCE_${name}`];
}
const apply = process.argv.includes("--apply");
const rewriteUrls = process.argv.includes("--rewrite-urls");
const clients = [];
const makeClient = (config) => {
  for (const name of ["ACCESS_KEY_ID", "SECRET_ACCESS_KEY", "BUCKET", "ENDPOINT"]) {
    if (!config[`R2_${name}`]) throw new Error(`Missing R2 ${name} for source or destination`);
  }
  const client = new S3Client({
    region: "auto", endpoint: config.R2_ENDPOINT,
    credentials: { accessKeyId: config.R2_ACCESS_KEY_ID, secretAccessKey: config.R2_SECRET_ACCESS_KEY },
    requestHandler: { connectionTimeout: 10000, requestTimeout: 120000 },
  });
  clients.push(client);
  return client;
};
const inventory = async (client, bucket) => {
  const objects = new Map();
  let token;
  do {
    const page = await client.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token }));
    for (const object of page.Contents || []) objects.set(object.Key, object);
    token = page.NextContinuationToken;
  } while (token);
  return objects;
};
const hash = (body) => createHash("sha256").update(body).digest("hex");
const get = async (client, bucket, key) => {
  const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  return { result, body: await result.Body.transformToByteArray() };
};
const metadataFields = ["ContentType", "CacheControl", "ContentDisposition", "ContentEncoding", "ContentLanguage", "Expires", "Metadata"];
const metadata = (object) => Object.fromEntries(metadataFields
  .filter((field) => object[field] !== undefined).map((field) => [field, object[field]]));

const run = async () => {
  if (source.R2_ENDPOINT === env.R2_ENDPOINT && source.R2_BUCKET === env.R2_BUCKET) {
    throw new Error("Source and destination must be different buckets/accounts");
  }
  const oldClient = makeClient(source);
  const newClient = makeClient(env);
  const before = await inventory(oldClient, source.R2_BUCKET);
  const destination = await inventory(newClient, env.R2_BUCKET);
  const bytes = [...before.values()].reduce((sum, object) => sum + object.Size, 0);
  console.log(JSON.stringify({ mode: apply ? "apply" : "preview", sourceObjects: before.size, sourceBytes: bytes, destinationObjects: destination.size }));
  if (!apply) return;
  let copied = 0;
  for (const [key, object] of before) {
    // Bound memory use; refuse large objects rather than partially buffering them.
    if (object.Size > 256 * 1024 * 1024) throw new Error(`Object requires multipart migration: ${key}`);
    const original = await get(oldClient, source.R2_BUCKET, key);
    if (original.result.ETag !== object.ETag || original.body.length !== object.Size) {
      throw new Error(`Source changed while reading: ${key}; rerun migration`);
    }
    const expected = hash(original.body);
    let target = destination.has(key) ? await get(newClient, env.R2_BUCKET, key) : null;
    if (!target || hash(target.body) !== expected || JSON.stringify(metadata(target.result)) !== JSON.stringify(metadata(original.result))) {
      await newClient.send(new PutObjectCommand({
        Bucket: env.R2_BUCKET, Key: key, Body: original.body,
        ContentLength: original.body.length, ...metadata(original.result),
      }));
      copied += 1;
      target = await get(newClient, env.R2_BUCKET, key);
    }
    if (hash(target.body) !== expected || JSON.stringify(metadata(target.result)) !== JSON.stringify(metadata(original.result))) {
      throw new Error(`Content/metadata verification failed: ${key}`);
    }
    console.log(`Verified ${key} (${object.Size} bytes)`);
  }
  const after = await inventory(newClient, env.R2_BUCKET);
  const sourceAfter = await inventory(oldClient, source.R2_BUCKET);
  if (sourceAfter.size !== before.size || [...before].some(([key, object]) =>
    sourceAfter.get(key)?.ETag !== object.ETag || sourceAfter.get(key)?.Size !== object.Size)) {
    throw new Error("Source inventory changed during migration; rerun to catch new uploads");
  }
  for (const [key, object] of before) {
    if (after.get(key)?.Size !== object.Size) throw new Error(`Missing or incorrect destination object: ${key}`);
  }
  console.log(JSON.stringify({ copied, verified: before.size, verifiedBytes: bytes, destinationObjects: after.size, prefixes: [...new Set([...after.keys()].map((key) => key.split("/")[0]))] }));
  if (rewriteUrls) {
    const oldBase = source.R2_PUBLIC_BASE_URL?.replace(/\/+$/, "");
    const newBase = env.R2_PUBLIC_BASE_URL?.replace(/\/+$/, "");
    if (!oldBase || !newBase || oldBase === newBase) throw new Error("Distinct source and destination public URLs required");
    process.env.DATABASE_URL = env.DATABASE_URL;
    const prisma = new PrismaClient();
    const fields = [["systemUser", "profilePhotoUrl"], ["systemUser", "coverPhotoUrl"], ["supportMessage", "attachment"], ["message", "attachment"], ["message", "attachmentTwo"]];
    try {
      await prisma.$transaction(async (tx) => {
        for (const [model, field] of fields) {
          const rows = await tx[model].findMany({ where: { [field]: { startsWith: `${oldBase}/` } }, select: { id: true, [field]: true } });
          for (const row of rows) {
            const key = row[field].slice(oldBase.length + 1);
            if (!after.has(key)) throw new Error(`Cannot rewrite URL for missing object: ${key}`);
            const updated = await tx[model].updateMany({
              where: { id: row.id, [field]: row[field] }, data: { [field]: `${newBase}/${key}` },
            });
            if (updated.count !== 1) throw new Error(`Concurrent URL update in ${model}.${field}; retry`);
          }
          const remaining = await tx[model].count({ where: { [field]: { startsWith: `${oldBase}/` } } });
          if (remaining) throw new Error(`Old URLs remain in ${model}.${field}`);
          console.log(JSON.stringify({ model, field, urlsRewritten: rows.length, oldUrlsRemaining: remaining }));
        }
      }, { timeout: 60000 });
    } finally {
      await prisma.$disconnect();
    }
  }
};
run().catch((error) => {
  console.error(`R2 migration failed: ${error.name}: ${error.message}`);
  process.exitCode = 1;
}).finally(() => clients.forEach((client) => client.destroy()));
