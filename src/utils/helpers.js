import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../config/db.js";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return secret;
};
// Access tokens expire. Previously the expiry was opt-in (`JWT_EXPIRES_IN`
// defaulted to empty), so a leaked token granted API access forever. The
// default is now a bounded 7-day window; a deployment can shorten or extend
// it, but it can no longer be switched off by omission.
const DEFAULT_JWT_EXPIRES_IN = "7d";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || DEFAULT_JWT_EXPIRES_IN;

export const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    userRole: Number(user.userRole),
  };
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (error) {
    return null;
  }
};

const getGoogleRegistrationProofSecret = () =>
  crypto
    .createHmac("sha256", getJwtSecret())
    .update("exegesis-google-registration-proof-v1")
    .digest();

export const generateGoogleRegistrationProof = (identity) =>
  jwt.sign(
    { ...identity, purpose: "google-registration" },
    getGoogleRegistrationProofSecret(),
    {
      algorithm: "HS256",
      audience: "google-registration",
      issuer: "exegesis-api",
      expiresIn: "10m",
    },
  );

export const verifyGoogleRegistrationProof = (token) => {
  try {
    const decoded = jwt.verify(token, getGoogleRegistrationProofSecret(), {
      algorithms: ["HS256"],
      audience: "google-registration",
      issuer: "exegesis-api",
    });
    return decoded?.purpose === "google-registration" ? decoded : null;
  } catch {
    return null;
  }
};

const getPasswordSetProofSecret = () =>
  crypto
    .createHmac("sha256", getJwtSecret())
    .update("exegesis-password-set-proof-v1")
    .digest();

/**
 * Short-lived proof that the caller proved control of an email inbox.
 * Issued by `verify-code` and required by `set-password`, so that setting a
 * password can never be done on the strength of an email address alone.
 */
export const generatePasswordSetProof = (identity) =>
  jwt.sign({ ...identity, purpose: "password-set" }, getPasswordSetProofSecret(), {
    algorithm: "HS256",
    audience: "password-set",
    issuer: "exegesis-api",
    expiresIn: "15m",
  });

export const verifyPasswordSetProof = (token) => {
  try {
    const decoded = jwt.verify(token, getPasswordSetProofSecret(), {
      algorithms: ["HS256"],
      audience: "password-set",
      issuer: "exegesis-api",
    });
    return decoded?.purpose === "password-set" ? decoded : null;
  } catch {
    return null;
  }
};

export const extractToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
};

export const generateSixDigitCode = () => {
  // crypto.randomInt (not Math.random) so verification codes cannot be
  // predicted from observed outputs.
  return crypto.randomInt(100000, 1000000).toString();
};

export const generatePlanId = () => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `PLAN-${datePart}-${randomPart}`;
};

export const formatResponse = (status, message, data = null) => {
  const response = { status, message };
  if (data !== null) {
    response.data = data;
  }
  return response;
};

/**
 * Recursively serialize Prisma result objects for JSON responses.
 * - BigInt → Number
 * - Date → ISO string
 * - null/undefined pass through
 * - Arrays and Objects recurse
 */
export const serializeBigInt = (val) => {
  if (val === null || val === undefined) return val;
  if (typeof val === "bigint") return Number(val);
  if (val instanceof Date) return val.toISOString();
  if (Array.isArray(val)) return val.map(serializeBigInt);
  if (typeof val === "object") {
    return Object.fromEntries(
      Object.entries(val).map(([k, v]) => [k, serializeBigInt(v)])
    );
  }
  return val;
};

const serializeValue = (val) => {
  if (val === null || val === undefined) return val;
  if (typeof val === "bigint") return Number(val);
  if (val instanceof Date) return val.toISOString();
  if (Array.isArray(val)) return val.map(serializeValue);
  if (typeof val === "object") {
    const result = {};
    for (const key of Object.keys(val)) {
      result[key] = serializeValue(val[key]);
    }
    return result;
  }
  return val;
};

export const formatApiResponse = (serviceResponse) => {
  const { status, message, data } = serviceResponse;
  const response = {
    returnCode: status,
    returnMessage: message,
  };
  if (data !== undefined && data !== null) {
    response.returnData = serializeValue(data);
  }
  return response;
};

/**
 * Decode the current user from the JWT in the request header.
 * No DB query — uses the JWT payload directly.
 */
export const getCurrentUser = (req) => {
  const token = extractToken(req.headers.authorization);
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  return decoded;
};

export const isAdmin = (req) => {
  const user = getCurrentUser(req);
  return user && Number(user.userRole) === 1;
};

export const isAuthenticated = (req) => {
  const user = getCurrentUser(req);
  return !!user;
};


export const generateRandomPassword = (length = 8) => {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
  // crypto.randomInt so generated passwords are not derived from a
  // predictable PRNG state.
  const picks = Array.from({ length }, () =>
    charset.charAt(crypto.randomInt(0, charset.length)),
  );
  return picks.join("");
};
