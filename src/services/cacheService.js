import Redis from 'ioredis';
import { randomUUID } from 'node:crypto';

const REDIS_URL = (process.env.REDIS_URL || '').trim();
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT) || 6379;
const DEFAULT_TTL = parseInt(process.env.REDIS_CACHE_TTL) || 86400; // 24 hours default

let client = null;
let ready = false;
let loggedError = false;
let warnedUnavailable = false;

const getClient = () => {
  if (!client) {
    try {
      // REDIS_URL wins when present (Railway/Heroku provision it as a single
      // connection string). Otherwise fall back to host/port.
      const options = {
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          if (times > 2) {
            if (!loggedError) {
              warnIfUnavailable();
              loggedError = true;
            }
            return null;
          }
          return Math.min(times * 200, 2000);
        },
        connectTimeout: 5000,
      };
      client = REDIS_URL
        ? new Redis(REDIS_URL, options)
        : new Redis({ host: REDIS_HOST, port: REDIS_PORT, ...options });

      client.on('error', () => { ready = false; });
      client.on('ready', () => {
        ready = true;
        console.log('Redis connected');
      });
      client.on('close', () => { ready = false; });
    } catch (err) {
      ready = false;
      client = null;
      return null;
    }
  }
  return client;
};

/**
 * The cache is load-bearing for the translation path, not merely an
 * optimisation: without it every request re-translates the same content.
 * Warn loudly once at boot so a missing REDIS_URL is not mistaken for
 * "no cache configured" when it actually means "cache silently disabled".
 */
const warnIfUnavailable = () => {
  if (warnedUnavailable) return;
  warnedUnavailable = true;
  console.warn(
    '[cache] Redis is unavailable — the translation cache is disabled. ' +
      'Set REDIS_URL (or REDIS_HOST/REDIS_PORT) to avoid re-translating the ' +
      'same content on every request.',
  );
};

/**
 * Get a value from the cache.
 * @param {string} namespace - A prefix for the cache key (e.g. 'translations', 'reading-plans')
 * @param {string} key - The unique key within the namespace
 * @returns {Promise<*>} Parsed cached data or null if miss/error
 */
const get = async (namespace, key) => {
  if (!ready) {
    return null;
  }
  try {
    const c = getClient();
    if (!c) return null;
    const data = await c.get(`${namespace}:${key}`);
    if (data) return JSON.parse(data);
  } catch {
    ready = false;
  }
  return null;
};

/**
 * Set a value in the cache.
 * @param {string} namespace - A prefix for the cache key (e.g. 'translations', 'reading-plans')
 * @param {string} key - The unique key within the namespace
 * @param {*} data - The data to cache (will be JSON.stringify'd)
 * @param {number} [ttl=DEFAULT_TTL] - Time-to-live in seconds
 */
// JSON replacer that safely converts BigInt to string (Prisma returns BigInt for numeric IDs)
const jsonSerialize = (data) => {
  return JSON.stringify(data, (_, value) =>
    typeof value === 'bigint' ? Number(value) : value
  );
};

const set = async (namespace, key, data, ttl = DEFAULT_TTL) => {
  if (!ready) {
    return;
  }
  try {
    const c = getClient();
    if (!c) return;
    await c.setex(`${namespace}:${key}`, ttl, jsonSerialize(data));
  } catch {
    ready = false;
  }
};

/**
 * Remove a single key from the cache.
 * @param {string} namespace - The cache namespace (e.g. 'bible')
 * @param {string} key - The key within the namespace
 */
const del = async (namespace, key) => {
  if (!ready) return;
  try {
    const c = getClient();
    if (!c) return;
    await c.del(`${namespace}:${key}`);
  } catch {
    ready = false;
  }
};

/**
 * Cache-aside pattern: check cache first; on miss, run fetchFn, cache the result, and return it.
 * @param {string} namespace - A prefix for the cache key
 * @param {string} key - The unique key within the namespace
 * @param {Function} fetchFn - Async function that returns the data to cache on a miss
 * @param {number} [ttl=DEFAULT_TTL] - Time-to-live in seconds
 * @returns {Promise<*>} The cached or freshly-fetched data
 */
const getOrSet = async (namespace, key, fetchFn, ttl = DEFAULT_TTL) => {
  const cached = await get(namespace, key);
  if (cached !== null) return cached;

  const data = await fetchFn();
  await set(namespace, key, data, ttl);
  return data;
};

/**
 * Release a lock only if we still own it. A plain DEL would let a slow worker
 * delete a lock that a second instance has already taken over after the TTL.
 */
const RELEASE_LOCK_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end`;

/**
 * Take a short-lived distributed lock (Redis `SET NX EX`).
 *
 * Cron jobs run in every process, so a multi-instance deployment would send
 * every reminder/email twice without a shared lock. The returned `acquired`
 * flag tells the caller whether it owns the run.
 *
 * When Redis is unavailable the lock degrades to "acquired" so a
 * single-instance deployment keeps working; callers must keep their own
 * in-process guard (`isRunning`) to avoid overlapping local runs.
 *
 * @param {string} name - Lock name (without the `lock:` prefix).
 * @param {number} [ttlSeconds=60] - Automatic expiry if the holder crashes.
 * @returns {Promise<{acquired: boolean, degraded: boolean, release: () => Promise<void>}>}
 */
const acquireLock = async (name, ttlSeconds = 60) => {
  const noop = async () => {};
  if (!ready) return { acquired: true, degraded: true, release: noop };

  try {
    const c = getClient();
    if (!c) return { acquired: true, degraded: true, release: noop };

    const key = `lock:${name}`;
    const token = randomUUID();
    const result = await c.set(key, token, 'EX', ttlSeconds, 'NX');
    if (result !== 'OK') {
      return { acquired: false, degraded: false, release: noop };
    }

    return {
      acquired: true,
      degraded: false,
      release: async () => {
        try {
          await c.eval(RELEASE_LOCK_SCRIPT, 1, key, token);
        } catch {
          // The lock expires on its own; never fail the job over cleanup.
        }
      },
    };
  } catch {
    ready = false;
    warnIfUnavailable();
    return { acquired: true, degraded: true, release: noop };
  }
};

export const cache = { get, set, getOrSet, del, acquireLock, isReady: () => ready };

// Eagerly connect at module load. Without this the client is never created:
// get/set short-circuit on `ready` before getClient() is ever called, so Redis
// would stay permanently disabled.
getClient();
