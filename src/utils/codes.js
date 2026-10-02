import crypto from "crypto";

// Keyed hash (HMAC-SHA256) for short-lived verification/reset codes.
// A plain hash is brute-forceable for a 6-digit code, so the secret key
// is required to recompute it. Deterministic, so we can still look a row
// up by the hashed value instead of scanning by email.
const getSecret = () =>
  process.env.VERIFICATION_CODE_SECRET ||
  process.env.JWT_SECRET ||
  "";

export const hashCode = (code) => {
  const secret = getSecret();
  if (!secret) {
    throw new Error("VERIFICATION_CODE_SECRET (or JWT_SECRET) must be set");
  }
  return crypto
    .createHmac("sha256", secret)
    .update(String(code))
    .digest("hex");
};

/**
 * Constant-time comparison of a submitted code against a stored value.
 * Supports legacy plaintext rows so existing un-verified users can still
 * complete verification after the hashing change is deployed.
 */
export const codeMatches = (submitted, stored) => {
  if (submitted == null || stored == null) return false;
  const submittedHash = hashCode(submitted);
  const a = Buffer.from(submittedHash);
  const b = Buffer.from(String(stored));
  if (a.length !== b.length) {
    // Legacy plaintext stored value — compare supplied vs stored directly.
    return String(submitted) === String(stored);
  }
  return crypto.timingSafeEqual(a, b);
};