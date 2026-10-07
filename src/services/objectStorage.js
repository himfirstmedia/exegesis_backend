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
};

export const contentTypeForExtension = (extension) =>
  CONTENT_TYPES[String(extension || "").toLowerCase()] || "application/octet-stream";

const MEDIA_KEY_PATTERN =
  /^(?:covers|profile-photos)\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpe?g|png|webp)$/i;

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
