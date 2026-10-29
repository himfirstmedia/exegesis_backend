import rateLimit from "express-rate-limit";

const rateLimitResponse = {
  returnCode: 429,
  returnMessage: "Too many attempts, please try again later",
};

// Login / verification / password-reset: strictest (brute-force targets).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse,
});

// Account creation: slightly looser, still bounded (shared/NAT IPs).
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse,
});

export const bibleSearchLimiter = rateLimit({
  windowMs: 60_000, max: 60, standardHeaders: true, legacyHeaders: false, message: rateLimitResponse,
});

const readPositiveInt = (name, fallback) => {
  const value = Number.parseInt(process.env[name], 10);
  return Number.isInteger(value) && value > 0 ? value : fallback;
};

const translationLimiter = rateLimit({
  windowMs: readPositiveInt("TRANSLATION_RATE_LIMIT_WINDOW_MS", 60_000),
  max: readPositiveInt("TRANSLATION_RATE_LIMIT_REQUESTS", 60),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    returnCode: 429,
    returnMessage: "Translation request limit exceeded, please try again later",
  },
});

const translationCharacterUsage = new Map();
const translationCharacterLimiter = (req, res, next) => {
  const now = Date.now();
  const windowMs = readPositiveInt("TRANSLATION_RATE_LIMIT_WINDOW_MS", 60_000);
  const limit = readPositiveInt("TRANSLATION_RATE_LIMIT_CHARACTERS", 100_000);
  const key = req.user?.id ? `user:${req.user.id}` : `ip:${req.ip}`;
  // Reader streams compute their source cost on the server, not in a client q.
  const cost = Number.isSafeInteger(req.translationCharacterCost) && req.translationCharacterCost >= 0
    ? req.translationCharacterCost
    : Array.isArray(req.body?.q)
    ? req.body.q.reduce((sum, text) => sum + text.length, 0)
    : req.body?.q?.length || 0;
  const current = translationCharacterUsage.get(key);
  const usage = !current || current.resetAt <= now
    ? { characters: 0, resetAt: now + windowMs }
    : current;

  if (usage.characters + cost > limit) {
    res.setHeader("Retry-After", Math.max(1, Math.ceil((usage.resetAt - now) / 1000)));
    return res.status(429).json({
      returnCode: 429,
      returnMessage: "Translation character limit exceeded, please try again later",
    });
  }
  usage.characters += cost;
  translationCharacterUsage.set(key, usage);
  if (translationCharacterUsage.size > 10_000) {
    for (const [usageKey, value] of translationCharacterUsage) {
      if (value.resetAt <= now) translationCharacterUsage.delete(usageKey);
    }
    while (translationCharacterUsage.size > 10_000) {
      translationCharacterUsage.delete(translationCharacterUsage.keys().next().value);
    }
  }
  return next();
};

export {
  authLimiter,
  registerLimiter,
  translationCharacterLimiter,
  translationLimiter,
};
