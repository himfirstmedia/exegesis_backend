import { extractToken, verifyToken, formatApiResponse } from "../utils/helpers.js";
import { prisma } from "../config/db.js";
import { withDbRetry, isTransientDbError } from "../utils/dbRetry.js";

export const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json(formatApiResponse({ status: 401, message: "No token provided" }));
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json(formatApiResponse({ status: 401, message: "Invalid or expired token" }));
    }

    // Lightweight status check — single field, primary key lookup. Retried on
    // transient DB blips (Railway proxy drops connections under load, which
    // previously failed every app-load request with a 500 "Authentication
    // error").
    const userStatus = await withDbRetry(() =>
      prisma.systemUser.findUnique({
        where: { id: decoded.id },
        select: { status: true },
      }),
    );

    if (!userStatus) {
      return res.status(401).json(formatApiResponse({ status: 401, message: "User not found" }));
    }

    if (!userStatus.status) {
      return res.status(403).json(formatApiResponse({ status: 403, message: "Account is disabled" }));
    }

    req.user = decoded;
    next();
  } catch (error) {
    // DB unreachable: the token itself was valid, so this is not an auth
    // failure. Return 503 (retryable) instead of a misleading 500, and fail
    // CLOSED — never unlock protected routes just because the DB blinked.
    if (isTransientDbError(error)) {
      console.error("[auth] Database temporarily unreachable:", error.message);
      return res.status(503).json(
        formatApiResponse({
          status: 503,
          message: "Service temporarily unavailable, please retry",
        }),
      );
    }
    console.error("Auth middleware error:", error);
    return res.status(500).json(formatApiResponse({ status: 500, message: "Authentication error" }));
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
    return res.status(403).json(formatApiResponse({ status: 403, message: "Admin access required" }));
  }
  next();
};
