import crypto from "crypto";

/**
 * Short-lived signatures for private media URLs.
 *
 * Support attachments (screenshots, PDFs) are uploaded by a reader and read
 * back by that reader and by support staff. Serving them from a bare
 * `/media/<key>` proxy would make them readable by anyone who guessed or
 * captured the key, so those URLs are signed and expire.
 *
 * Profile photos and cover images stay on the public path: they are already
 * displayed to other users inside the app.
 */

const getSigningSecret = () => {
  const secret =
    process.env.MEDIA_SIGNING_SECRET ||
    process.env.JWT_SECRET ||
    "exegesis-media-signing-fallback";
  return secret;
};

const DEFAULT_TTL_SECONDS = 60 * 60; // 1 hour

const baseSignature = (key, expiresAt) =>
  crypto
    .createHmac("sha256", getSigningSecret())
    .update(`${key}:${expiresAt}`)
    .digest("base64url");

/**
 * Extract the storage key from a media path or URL.
 * `/media/support/<key>` and `<publicBase>/support/<key>` both yield `<key>`.
 */
const mediaKeyFromPath = (mediaPath) => {
  const path = String(mediaPath).split("?")[0];
  const marker = "/media/";
  const index = path.indexOf(marker);
  if (index !== -1) return path.slice(index + marker.length);
  return path.replace(/^https?:\/\/[^/]+\//, "");
};

/**
 * Append an expiry + signature to a media path so it can be fetched once
 * without an Authorization header.
 */
export const signMediaPath = (mediaPath, ttlSeconds = DEFAULT_TTL_SECONDS) => {
  if (!mediaPath) return mediaPath;
  const path = String(mediaPath);
  // Already signed — leave it alone.
  if (path.includes("sig=")) return path;

  const separator = path.includes("?") ? "&" : "?";
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const signature = baseSignature(mediaKeyFromPath(path), expiresAt);
  return `${path}${separator}exp=${expiresAt}&sig=${signature}`;
};

/**
 * Whether a signed media request is still valid.
 */
export const verifyMediaSignature = (key, expiresAt, signature) => {
  if (!key || !expiresAt || !signature) return false;

  const expiry = Number(expiresAt);
  if (!Number.isFinite(expiry)) return false;
  if (expiry * 1000 < Date.now()) return false;

  const expected = baseSignature(key, expiry);
  const provided = Buffer.from(String(signature));
  const computed = Buffer.from(expected);
  if (provided.length !== computed.length) return false;
  return crypto.timingSafeEqual(provided, computed);
};

/**
 * Media under these prefixes is private and needs a valid signature.
 */
const PRIVATE_MEDIA_PREFIXES = ["support/"];

export const isPrivateMediaKey = (key) =>
  PRIVATE_MEDIA_PREFIXES.some((prefix) => String(key || "").startsWith(prefix));
