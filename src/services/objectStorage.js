// Object storage - Cloudflare R2 (S3-compatible) with a development fallback.
//
// Files are uploaded by the backend, validated in imageUpload.js, then handed
// here as a Buffer. When R2 credentials are missing (local development, tests),
// the object is written under backend/uploads and served by the existing
// express.static mount, so every environment works without code changes.
//
// URL resolution order for an R2 object:
//   1. R2_PUBLIC_BASE_URL  — custom domain or r2.dev public bucket URL
//   2. /media/<key>        — backend proxy route (private bucket, presigned-free
//                            GetObject stream scoped to the server)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { gzipSync, gunzipSync } from 'zlib';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

// Resolve the module directory under both real ESM (production) and the
// babel-jest CommonJS transform, where `import.meta.url` is shimmed to
// `__filename` and fileURLToPath would reject it.
const moduleDir = (() => {
  try {
    return path.dirname(fileURLToPath(import.meta.url));
  } catch {
    return __dirname;
  }
})();
const UPLOADS_ROOT = path.join(moduleDir, "../../uploads");

const CONTENT_TYPES = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
};

export const contentTypeForExtension = (extension) =>
  CONTENT_TYPES[String(extension || "").toLowerCase()] || "application/octet-stream";

// Folders that may hold stored media. `support` carries attachments sent with
// support conversations (screenshots and PDFs).
const MEDIA_KEY_PATTERN =
  /^(?:covers|profile-photos|support)\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpe?g|png|webp|pdf)$/i;

export const isMediaObjectKey = (key) => MEDIA_KEY_PATTERN.test(String(key || ""));

const assertMediaObjectKey = (key) => {
  if (!isMediaObjectKey(key)) throw new Error("Invalid media object key");
};

const readR2Config = () => {
  const accountId = process.env.R2_ACCOUNT_ID || "";
  const endpoint =
    process.env.R2_ENDPOINT ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");
  return {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    bucket: process.env.R2_BUCKET || "",
    endpoint,
    publicBaseUrl: (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/+$/, ""),
  };
};

export const isObjectStorageConfigured = () => {
  const config = readR2Config();
  return Boolean(
    config.accessKeyId &&
      config.secretAccessKey &&
      config.bucket &&
      config.endpoint,
  );
};

const hasAnyObjectStorageConfig = () => {
  const config = readR2Config();
  return Boolean(
    config.accessKeyId ||
      config.secretAccessKey ||
      config.bucket ||
      process.env.R2_ENDPOINT ||
      process.env.R2_ACCOUNT_ID ||
      config.publicBaseUrl,
  );
};

export const validateObjectStorageConfig = () => {
  if (isObjectStorageConfigured()) return;
  if (hasAnyObjectStorageConfig()) {
    throw new Error("R2 configuration is incomplete");
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("R2 configuration is required in production");
  }
};

let client = null;
const getClient = () => {
  if (client) return client;
  const config = readR2Config();
  client = new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  return client;
};

// Heading pack keys are separate from user-uploaded media. Only completed
// packs are advertised through the public CDN; checkpoints are never linked.
const assertHeadingPackKey = (key) => {
  if (/^number-packs\/(?:manifests\/[a-z]{2,3}|[a-f0-9]{12}\/[a-z]{2,3})\.json$/.test(key)) return;
  if (!/^(?:(?:heading-packs\/bsb-|ui-packs\/app-)[a-f0-9]{12}\/[a-z]{2,3}(?:-[A-Za-z]{2,4})?(?:-(?:partial|manifest))?\.json|book-packs\/(?:manifest\.json|[a-f0-9]{12}\/catalog\.json)|book-overview-packs\/(?:manifests\/[a-z]{2,3}|[a-f0-9]{12}\/[a-z]{2,3}|books\/[a-f0-9]{12}\/[a-z]{2,3}(?:-partial)?)\.json)$/.test(key)) {
    throw new Error("Invalid heading pack key");
  }
};

export const readHeadingPackObject = async (key) => {
  assertHeadingPackKey(key);
  if (!isObjectStorageConfigured()) {
    validateObjectStorageConfig();
    try {
      return JSON.parse(await fs.promises.readFile(path.join(UPLOADS_ROOT, key), "utf8"));
    } catch (error) {
      if (error.code === "ENOENT") return null;
      throw error;
    }
  }
  try {
    const result = await getClient().send(new GetObjectCommand({ Bucket: readR2Config().bucket, Key: key }));
    if (result.ContentEncoding === 'gzip') {
      return JSON.parse(gunzipSync(await result.Body.transformToByteArray()).toString('utf8'));
    }
    return JSON.parse(await result.Body.transformToString());
  } catch (error) {
    if (error.name === "NoSuchKey" || error.$metadata?.httpStatusCode === 404) return null;
    throw error;
  }
};

export const writeHeadingPackObject = async (key, value, options = {}) => {
  assertHeadingPackKey(key);
  const buffer = Buffer.from(JSON.stringify(value));
  if (isObjectStorageConfigured()) {
    await getClient().send(new PutObjectCommand({
      Bucket: readR2Config().bucket, Key: key, Body: options.compress ? gzipSync(buffer) : buffer,
      ContentType: "application/json",
      ...(options.compress ? { ContentEncoding: 'gzip' } : {}),
      CacheControl: options.cacheControl || 'no-store',
    }));
    return;
  }
  validateObjectStorageConfig();
  const target = path.join(UPLOADS_ROOT, key);
  await fs.promises.mkdir(path.dirname(target), { recursive: true });
  // Atomic replacement: readers never observe a partially written checkpoint.
  const temporary = `${target}.${process.pid}.tmp`;
  await fs.promises.writeFile(temporary, buffer);
  await fs.promises.rename(temporary, target);
};

export const resolveHeadingPackUrl = (key, language, revision) => {
  assertHeadingPackKey(key);
  if (isObjectStorageConfigured() && readR2Config().publicBaseUrl) {
    return `${readR2Config().publicBaseUrl}/${key}`;
  }
  // Revision stays in the URL so private-bucket/local downloads are immutable
  // too, including when the backend later deploys a new source revision.
  if (key.startsWith('book-packs/')) return `/translations/book-packs/file?revision=${revision}`;
  if (key.startsWith('book-overview-packs/')) return `/book-prologues/packs/${language}/file?revision=${revision}`;
  if (key.startsWith('number-packs/')) return `/translation/number-packs/${language}/file?revision=${revision}`;
  return `/translations/heading-packs/${language}/file?revision=${revision}`;
};

// Same compressed/atomic storage path as heading packs; a separate namespace.
export const readUiPackObject = readHeadingPackObject;
export const writeUiPackObject = writeHeadingPackObject;
export const resolveUiPackUrl = (key, language, revision) => {
  assertHeadingPackKey(key);
  if (isObjectStorageConfigured() && readR2Config().publicBaseUrl) return `${readR2Config().publicBaseUrl}/${key}`;
  return `/translation/ui-packs/${language}/file?revision=${revision}`;
};

export const getHeadingPackObjectStream = async (key) => {
  assertHeadingPackKey(key);
  if (!isObjectStorageConfigured()) {
    validateObjectStorageConfig();
    const target = path.join(UPLOADS_ROOT, key);
    try {
      const stat = await fs.promises.stat(target);
      return { body: fs.createReadStream(target), contentLength: stat.size };
    } catch (error) {
      if (error.code === 'ENOENT') return null;
      throw error;
    }
  }
  try {
    const result = await getClient().send(new GetObjectCommand({ Bucket: readR2Config().bucket, Key: key }));
    return { body: result.Body, contentEncoding: result.ContentEncoding, contentLength: result.ContentLength };
  } catch (error) {
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) return null;
    throw error;
  }
};

/** Build the client-facing URL for a stored object. */
export const resolveObjectUrl = (key, storage = "r2") => {
  if (storage === "local") return `/uploads/${key}`;
  const { publicBaseUrl } = readR2Config();
  return publicBaseUrl ? `${publicBaseUrl}/${key}` : `/media/${key}`;
};

const writeLocal = (key, buffer) => {
  const target = path.join(UPLOADS_ROOT, key);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, buffer);
  return target;
};

/**
 * Store a Buffer directly in R2. Unlike uploadObject this never falls back to
 * local disk — it throws when R2 is unconfigured or the upload fails, so
 * migration tooling can surface problems instead of silently writing locally.
 */
export const putObject = async (key, buffer, contentType) => {
  assertMediaObjectKey(key);
  if (!isObjectStorageConfigured()) {
    throw new Error(
      "R2 is not configured (credentials, bucket, and endpoint or account ID are required)",
    );
  }
  const { bucket } = readR2Config();
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType || "application/octet-stream",
    }),
  );
  return { key, url: resolveObjectUrl(key, "r2") };
};

/**
 * Store a Buffer. Local storage is only used when R2 is entirely unconfigured
 * outside production. Configured R2 failures are surfaced so callers never
 * persist URLs backed by ephemeral container storage.
 *
 * @returns {Promise<{ storage: "r2"|"local", key: string, url: string }>}
 */
export const uploadObject = async ({ key, buffer, contentType }) => {
  assertMediaObjectKey(key);
  if (isObjectStorageConfigured()) {
    const result = await putObject(key, buffer, contentType);
    return { storage: "r2", ...result };
  }

  validateObjectStorageConfig();
  writeLocal(key, buffer);
  return { storage: "local", key, url: resolveObjectUrl(key, "local") };
};

/** Remove an object from whichever backend holds it. */
export const deleteObject = async (key, storage = "r2") => {
  if (!key) return;
  assertMediaObjectKey(key);
  if (storage === "r2") {
    if (!isObjectStorageConfigured()) {
      throw new Error("Cannot delete R2 object: R2 is not configured");
    }
    const { bucket } = readR2Config();
    await getClient().send(
      new DeleteObjectCommand({ Bucket: bucket, Key: key }),
    );
    return;
  }
  if (storage !== "local") throw new Error("Unknown object storage backend");
  await fs.promises.rm(path.join(UPLOADS_ROOT, key), { force: true });
};

export const storedMediaLocation = (url) => {
  if (typeof url !== "string" || !url) return null;
  const { publicBaseUrl } = readR2Config();
  const prefixes = [
    { prefix: "/media/", storage: "r2" },
    { prefix: "/uploads/", storage: "local" },
    ...(publicBaseUrl
      ? [{ prefix: `${publicBaseUrl}/`, storage: "r2" }]
      : []),
  ];
  for (const { prefix, storage } of prefixes) {
    if (!url.startsWith(prefix)) continue;
    const key = url.slice(prefix.length);
    return isMediaObjectKey(key) ? { key, storage } : null;
  }
  return null;
};

export const deleteStoredMedia = async (url) => {
  const location = storedMediaLocation(url);
  if (location) await deleteObject(location.key, location.storage);
};

/**
 * Stream an R2 object for the /media proxy route. Returns null when storage is
 * unconfigured so the route can 404 instead of throwing.
 */
export const getObjectStream = async (key) => {
  assertMediaObjectKey(key);
  if (!isObjectStorageConfigured()) return null;
  const { bucket } = readR2Config();
  const result = await getClient().send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );
  return {
    body: result.Body,
    contentType: result.ContentType,
    contentLength: result.ContentLength,
  };
};
