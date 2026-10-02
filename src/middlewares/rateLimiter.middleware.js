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

export { authLimiter, registerLimiter };