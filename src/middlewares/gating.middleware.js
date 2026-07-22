import { prisma } from "../config/db.js";

const TIER_ORDER = { free: 0, legacy_sower: 1, legacy_sower_monthly: 1, covenant_sower: 2, covenant_sower_monthly: 2 };

export const requireTier = (minimumTier) => {
  return async (req, res, next) => {
    try {
      // Admin users bypass subscription checks entirely
      if (Number(req.user?.userRole) === 1) return next();

      const user = await prisma.systemUser.findUnique({
        where: { id: req.user.id },
        select: { subscriptionTier: true, accessExpiresAt: true },
      });

      if (!user) {
        return res.status(401).json({ returnCode: 401, returnMessage: "User not found" });
      }

      if (TIER_ORDER[user.subscriptionTier] < TIER_ORDER[minimumTier]) {
        return res.status(403).json({
          returnCode: 403,
          returnMessage: "Subscription required",
          requiredTier: minimumTier,
          currentTier: user.subscriptionTier,
        });
      }

      // Only check expiry if accessExpiresAt is explicitly set.
      // null means the subscription has no expiry (e.g. lifetime or untracked).
      if (user.accessExpiresAt !== null && new Date() > new Date(user.accessExpiresAt)) {
        return res.status(403).json({
          returnCode: 403,
          returnMessage: "Subscription expired",
          currentTier: user.subscriptionTier,
          expiresAt: user.accessExpiresAt,
        });
      }

      next();
    } catch (error) {
      console.error("[GatingMiddleware] requireTier error:", error);
      return res.status(500).json({ returnCode: 500, returnMessage: "Internal server error" });
    }
  };
};

export const checkTier = (minimumTier) => {
  return async (req, res, next) => {
    try {
      // Admin users bypass subscription checks entirely
      if (Number(req.user?.userRole) === 1) {
        req.hasSubscriptionAccess = true;
        return next();
      }

      const user = await prisma.systemUser.findUnique({
        where: { id: req.user.id },
        select: { subscriptionTier: true, accessExpiresAt: true },
      });

      // accessExpiresAt null = no expiry (always valid)
      const notExpired = user?.accessExpiresAt === null ||
        !user?.accessExpiresAt ||
        new Date() <= new Date(user.accessExpiresAt);

      const hasAccess = user &&
        TIER_ORDER[user.subscriptionTier] >= TIER_ORDER[minimumTier] &&
        notExpired;

      req.hasSubscriptionAccess = !!hasAccess;
    } catch {
      req.hasSubscriptionAccess = false;
    }
    next();
  };
};
