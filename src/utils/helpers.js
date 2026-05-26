import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    userRole: Number(user.userRole),
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
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
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generatePlanId = () => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
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