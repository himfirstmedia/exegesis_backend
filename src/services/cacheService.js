import Redis from 'ioredis';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT) || 6379;
const DEFAULT_TTL = parseInt(process.env.REDIS_CACHE_TTL) || 86400; // 24 hours default

let client = null;
let ready = false;
let loggedError = false;

const getClient = () => {
  if (!client) {
    try {
      client = new Redis({
        host: REDIS_HOST,
        port: REDIS_PORT,
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          if (times > 2) {
            if (!loggedError) {
              console.log('Redis retry limit exceeded, disabling cache');
              loggedError = true;
            }
            return null;
          }
          return Math.min(times * 200, 2000);
        },
        connectTimeout: 5000,
      });

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
 * Get a value from the cache.
 * @param {string} namespace - A prefix for the cache key (e.g. 'translations', 'reading-plans')
 * @param {string} key - The unique key within the namespace
 * @returns {Promise<*>} Parsed cached data or null if miss/error
 */
const get = async (namespace, key) => {
  if (!ready) return null;
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
  if (!ready) return;
  try {
    const c = getClient();
    if (!c) return;
    await c.setex(`${namespace}:${key}`, ttl, jsonSerialize(data));
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

export const cache = { get, set, getOrSet };

// Eagerly connect at module load. Without this the client is never created:
// get/set short-circuit on `ready` before getClient() is ever called, so Redis
// would stay permanently disabled.
getClient();
