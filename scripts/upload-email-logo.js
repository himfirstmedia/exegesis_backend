// Run from backend: node scripts/upload-email-logo.js /path/to/new-logo.png
// Prints the public URL to use as LOGO_URL after verifying the uploaded image.
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const base = process.env.R2_PUBLIC_BASE_URL?.replace(/\/+$/, '');
const endpoint = process.env.R2_ENDPOINT ||
  (process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : '');
if (!base || !endpoint || !process.env.R2_BUCKET ||
    !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
  throw new Error('R2 credentials, bucket, endpoint/account ID and public base URL are required');
}
if (!process.argv[2]) throw new Error('Provide the path to the new logo PNG');
const body = await readFile(process.argv[2]);
const digest = createHash('sha256').update(body).digest('hex');
const key = `branding/email-logo-${digest.slice(0, 12)}.png`;
const client = new S3Client({
  region: 'auto', endpoint,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
try {
  await client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET, Key: key, Body: body,
    ContentType: 'image/png',
    CacheControl: 'public, max-age=31536000, immutable',
  }));
  const url = `${base}/${key}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Public logo verification failed: HTTP ${response.status}`);
  const downloaded = Buffer.from(await response.arrayBuffer());
  if (createHash('sha256').update(downloaded).digest('hex') !== digest) {
    throw new Error('Public logo does not match the uploaded file');
  }
  console.log(`Verified logo uploaded. Set LOGO_URL=${url}`);
} finally {
  client.destroy();
}
