// translator.js
// Multi-provider translation service with Redis caching + rate-limited queue.
//
// Providers in order (first success wins):
//   1. @vitalets/google-translate-api (free, no key)
//   2. MyMemory API                  (free, no key, fallback)
//
// A serial queue ensures only ONE request is in-flight at any time with
// a generous minimum delay between them, preventing IP-based rate limiting.
import { translate } from '@vitalets/google-translate-api';
import { cache } from '../services/cacheService.js';

// ── Helpers ────────────────────────────────────────────────────────────────

const hashStr = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
};

// ── MyMemory API fallback ─────────────────────────────────────────────────
// Free translation memory API (no key needed). ~5000 chars/day without key.
// With Redis caching (7-day TTL), repeated texts don't count against the limit.
const decodeHtml = (text) =>
  text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'");

const translateMyMemory = async (text, lang) => {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${lang}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`MyMemory HTTP ${response.status}`);
  }

  const data = await response.json();
  if (data.responseStatus !== 200 || !data.responseData?.translatedText) {
    throw new Error(data.responseDetails || 'MyMemory: empty response');
  }
  return decodeHtml(data.responseData.translatedText);
};

// ── In-memory LRU cache (first-level, before Redis) ───────────────────────
// Avoids re-translating the same text within a single request cycle.
// Redis is the persistent cache; this is a per-process hot cache.
const memCache = new Map();
const MEM_CACHE_MAX = 200;

const memGet = (key) => memCache.get(key) ?? null;
const memSet = (key, value) => {
  if (memCache.size >= MEM_CACHE_MAX) {
    // Evict the oldest entry (Map preserves insertion order)
    const firstKey = memCache.keys().next().value;
    memCache.delete(firstKey);
  }
  memCache.set(key, value);
};

// ── Serial request queue ───────────────────────────────────────────────────
// Ensures requests are processed one-at-a-time with MIN_INTERVAL_MS gap.
// 1000ms gap (~1 req/sec) is well under Google's free-tier rate limits.
const MIN_INTERVAL_MS = 1000;
let queue = Promise.resolve();

const enqueue = (fn) => {
  const result = queue.then(async () => {
    await new Promise((r) => setTimeout(r, MIN_INTERVAL_MS));
    return fn();
  });
  queue = result.catch(() => {});
  return result;
};

const CACHE_TTL = 7 * 24 * 60 * 60; // 7 days

// ── Public API ─────────────────────────────────────────────────────────────

export const translateText = async (text, lang = 'en') => {
  if (!text || !lang || lang === 'en') return text;

  const cacheKey = `${hashStr(text)}:${lang}`;

  // 1. Try in-memory cache first (fastest, no network call)
  const memResult = memGet(cacheKey);
  if (memResult !== null) return memResult;

  // 2. Try Redis cache second
  const cached = await cache.get('translations', cacheKey);
  if (cached !== null) {
    memSet(cacheKey, cached);
    return cached;
  }

  // 3. Queue and try providers in order (only 1 request in-flight at a time)
  return enqueue(async () => {
    // Double-check cache (a previous queued item may have fetched this)
    const doubleCheck = await cache.get('translations', cacheKey);
    if (doubleCheck !== null) {
      memSet(cacheKey, doubleCheck);
      return doubleCheck;
    }

    let lastError = null;

    // Provider 1: Google Translate
    try {
      const { text: translated } = await translate(text, { to: lang });
      memSet(cacheKey, translated);
      cache.set('translations', cacheKey, translated, CACHE_TTL).catch(() => {});
      return translated;
    } catch (err) {
      lastError = err;
    }

    // Provider 2: MyMemory API (fallback)
    try {
      const translated = await translateMyMemory(text, lang);
      memSet(cacheKey, translated);
      cache.set('translations', cacheKey, translated, CACHE_TTL).catch(() => {});
      return translated;
    } catch (err) {
      // Both providers failed — silently fall back to original text.
      // The original text is better than an error — the UI still works.
      console.warn(
        `[translator] Failed for "${text.slice(0, 40)}..." to ${lang}. ` +
        `Google: ${lastError?.message}. MyMemory: ${err.message}`,
      );
    }

    memSet(cacheKey, text);
    return text;
  });
};
