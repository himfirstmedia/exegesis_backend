import { extractToken, verifyToken } from "../utils/helpers.js";
import { prisma } from "../config/db.js";

export const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ status: 401, message: "No token provided" });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ status: 401, message: "Invalid or expired token" });
    }

    // Lightweight status check — single field, primary key lookup
    const userStatus = await prisma.systemUser.findUnique({
      where: { id: decoded.id },
      select: { status: true },
    });

    if (!userStatus) {
      return res.status(401).json({ status: 401, message: "User not found" });
    }

    if (!userStatus.status) {
      return res.status(403).json({ status: 403, message: "Account is disabled" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({ status: 500, message: "Authentication error" });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req.headers.authorization);
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        // Optional auth trusts the JWT — no DB query
        req.user = decoded;
      }
    }
    next();
  } catch (error) {
    next();
  }
};

export const requireAdmin = async (req, res, next) => {
  if (!req.user || Number(req.user.userRole) !== 1) {
    return res.status(403).json({ status: 403, message: "Admin access required" });
  }
  next();
};