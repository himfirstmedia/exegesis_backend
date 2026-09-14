// Shared DB resilience helpers — transient-error detection + retry with
// backoff for the Railway-managed Postgres proxy, which occasionally drops
// connections under load (P1001 "can't reach database", P2024 pool timeout,
// P1017 server closed the connection, ECONNRESET…).
//
// Usage:
//   import { withDbRetry, isTransientDbError } from "../utils/dbRetry.js";
//   const user = await withDbRetry(() =>
//     prisma.systemUser.findUnique({ where: { id } })
//   );

const TRANSIENT_PATTERNS = [
  /reach database/i,
  /connection (pool|timeout|closed|refused|reset)/i,
  /timed out fetching/i,
  /ECONNRESET/i,
  /ECONNREFUSED/i,
  /ETIMEDOUT/i,
  /EPIPE/i,
  /server closed the connection/i,
  /terminating connection/i,
  /connection terminated/i,
  /socket hang up/i,
];

/**
 * True when a Prisma error looks transient (worth retrying).
 * Matches Prisma error codes first, then message patterns.
 */
export const isTransientDbError = (error) => {
  if (!error) return false;
  const code = error.code || error?.meta?.code;
  if (
    code === "P1001" || // can't reach database server
    code === "P1008" || // operations timed out
    code === "P1017" || // server closed the connection
    code === "P2024" || // timed out fetching a connection from the pool
    code === "P2028" // transaction API timeout
  ) {
    return true;
  }
  const message = `${error.message || ""}`;
  return TRANSIENT_PATTERNS.some((pattern) => pattern.test(message));
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Runs an async DB operation, retrying transient failures.
 *
 * @param {() => Promise<any>} fn        Operation to run.
 * @param {object} [options]
 * @param {number} [options.retries=2]   Extra attempts after the first try.
 * @param {number} [options.baseDelay=200] Base backoff delay in ms (linear: base × attempt).
 * @returns {Promise<any>} The operation's result.
 * @throws The last (non-transient or exhausted) error.
 */
export const withDbRetry = async (fn, { retries = 2, baseDelay = 200 } = {}) => {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === retries || !isTransientDbError(error)) {
        throw error;
      }
      await sleep(baseDelay * (attempt + 1));
    }
  }
  throw lastError;
};
