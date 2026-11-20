import { createHash, randomUUID } from 'node:crypto';
import { cache } from '../../services/cacheService.js';

const namespace = 'verse-explanation-lists';
const revisionKey = 'revision';
const ttlSeconds = 60;
const maxLocalPages = 100;
const pages = new Map();
const pending = new Map();
let offlineRevision = randomUUID();

export async function invalidateVerseExplanationLists() {
  offlineRevision = randomUUID();
  pages.clear();
  await cache.set(namespace, revisionKey, offlineRevision, 86400);
}

export async function cachedVerseExplanationList(options, load) {
  const redis = cache.isReady?.();
  const revision = redis ? (await cache.get(namespace, revisionKey)) ?? 'initial' : offlineRevision;
  const localRevision = offlineRevision;
  const digest = createHash('sha256').update(JSON.stringify(options)).digest('hex');
  const key = `v1:${revision}:${digest}`;
  const hit = pages.get(key);
  if (hit?.expiresAt > Date.now()) return hit.value;
  if (pending.has(key)) return pending.get(key);

  // Free text is cached only in bounded process memory, not as unbounded Redis keys.
  const sharePage = redis && !options.search && !options.creatorName;
  const task = (async () => {
    const shared = sharePage ? await cache.get(namespace, key) : null;
    if (shared) return shared;
    const result = await load(options);
    if (result.status !== 200 || offlineRevision !== localRevision) return result;
    pages.delete(key);
    pages.set(key, { value: result, expiresAt: Date.now() + ttlSeconds * 1000 });
    if (pages.size > maxLocalPages) pages.delete(pages.keys().next().value);
    if (sharePage) await cache.set(namespace, key, result, ttlSeconds);
    return result;
  })();
  pending.set(key, task);
  try {
    return await task;
  } finally {
    pending.delete(key);
  }
}
