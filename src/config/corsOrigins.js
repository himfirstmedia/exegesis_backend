/**
 * Shared CORS allow-list.
 *
 * The HTTP middleware and the Socket.IO server must agree on which browser
 * origins may talk to the API — otherwise one of them silently allows
 * everything while the other restricts. A missing `Origin` header is
 * allowed because native mobile clients (React Native) do not send one.
 */

// Origins that are always permitted: local development servers plus the
// production web and app deployments.
const STATIC_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:4173",
  "http://localhost:3000",
  "http://localhost:8080",
  "http://localhost:5001",
  "https://app.exegesisproject.org",
  "https://exegesisproject.org",
  "https://www.exegesisproject.org",
];

const envOrigins = [
  process.env.CLIENT_URL,
  process.env.SITEGROUND_URL,
  process.env.FRONTEND_URL,
  process.env.WEB_URL,
  // Comma-separated lists let one variable hold several origins.
  ...(process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((value) => value.trim()),
];

/**
 * The full allow-list, with any trailing slashes removed so that a
 * configured "https://example.com/" still matches "https://example.com".
 */
export const ALLOWED_ORIGINS = [
  ...new Set(
    [...STATIC_ALLOWED_ORIGINS, ...envOrigins]
      .filter(Boolean)
      .map((origin) => String(origin).trim().replace(/\/+$/, "")),
  ),
];

/**
 * Whether a browser origin may call the API.
 * `null`/undefined origin (native app, curl, server-to-server) is allowed.
 */
export const isOriginAllowed = (origin) => {
  if (!origin) return true;
  return ALLOWED_ORIGINS.includes(String(origin).trim().replace(/\/+$/, ""));
};

/**
 * CORS `origin` callback for the `cors` package.
 */
export const corsOriginDelegate = (origin, callback) => {
  if (isOriginAllowed(origin)) {
    callback(null, true);
    return;
  }
  callback(null, false);
};
