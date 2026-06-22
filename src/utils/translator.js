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

const decodeHtml = (text) =>
  text
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'");

// ── MyMemory fallback ──────────────────────────────────────────────────────

const translateMyMemory = async (text, lang) => {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${lang}`;

  // Timeout after 5s — prevents hanging forever
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`);

  const data = await res.json();
  if (data.responseStatus !== 200 || !data.responseData?.translatedText)
    throw new Error(data.responseDetails || 'MyMemory: empty response');

  return decodeHtml(data.responseData.translatedText);
};

// ── In-memory LRU cache ────────────────────────────────────────────────────

const memCache = new Map();
const MEM_CACHE_MAX = 500; // increased from 200

const memGet = (key) => memCache.get(key) ?? null;
const memSet = (key, value) => {
  if (memCache.size >= MEM_CACHE_MAX)
    memCache.delete(memCache.keys().next().value);
  memCache.set(key, value);
};

// ── In-flight deduplication ────────────────────────────────────────────────
// If the same text+lang is already being fetched, reuse that promise instead
// of making a second identical API call.

const inFlight = new Map();

// ── Concurrency limiter ────────────────────────────────────────────────────
// MAX_CONCURRENT simultaneous API calls with MIN_DELAY_MS spacing between
// each slot to prevent IP rate limiting.

const MAX_CONCURRENT = 2;
const MIN_DELAY_MS   = 600;
let activeCount = 0;
let lastCallTime = 0;

const withRateLimit = async (fn) => {
  while (activeCount >= MAX_CONCURRENT)
    await new Promise((r) => setTimeout(r, 50));

  const wait = MIN_DELAY_MS - (Date.now() - lastCallTime);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));

  activeCount++;
  lastCallTime = Date.now();
  try {
    return await fn();
  } finally {
    activeCount--;
  }
};

// Retry once with a short backoff for rate limits, then fall through
const RETRYABLE_ERRORS = ['Too Many Requests', 'ETIMEDOUT', 'ECONNRESET', 'socket hang up', 'timeout'];

const shouldRetry = (err) =>
  RETRYABLE_ERRORS.some((keyword) => err.message?.includes(keyword));

const withRetry = async (fn) => {
  try {
    return await fn();
  } catch (err) {
    if (shouldRetry(err)) {
      console.warn(`[translator] Retry after 2s — ${err.message.slice(0, 80)}`);
      await new Promise((r) => setTimeout(r, 2000));
      return await fn();
    }
    throw err;
  }
};

// ── Core fetch (with both providers) ──────────────────────────────────────

const CACHE_TTL = 7 * 24 * 60 * 60; // 7 days

const fetchTranslation = (text, lang, cacheKey) => {
  // Return existing promise if already in-flight for same text+lang
  if (inFlight.has(cacheKey)) return inFlight.get(cacheKey);

  const promise = withRateLimit(async () => {
    // Double-check Redis after waiting (another request may have cached it)
    try {
      const cached = await cache.get('translations', cacheKey);
      if (cached !== null) {
        memSet(cacheKey, cached);
        return cached;
      }
    } catch (_) {} // Redis down — just proceed to translate

    // Provider 1: Google Translate (with retry for rate limits)
    try {
      const { text: translated } = await withRetry(() => translate(text, { to: lang }));
      memSet(cacheKey, translated);
      cache.set('translations', cacheKey, translated, CACHE_TTL).catch(() => {});
      return translated;
    } catch (googleErr) {

      // Provider 2: MyMemory fallback
      try {
        const translated = await translateMyMemory(text, lang);
        memSet(cacheKey, translated);
        cache.set('translations', cacheKey, translated, CACHE_TTL).catch(() => {});
        return translated;
      } catch (myMemErr) {
        console.warn(
          `[translator] Both providers failed "${text.slice(0, 40)}" → ${lang} | ` +
          `Google: ${googleErr.message} | MyMemory: ${myMemErr.message}`
        );
        return text; // fallback to original
      }
    }
  }).finally(() => inFlight.delete(cacheKey)); // clean up after done

  inFlight.set(cacheKey, promise);
  return promise;
};

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Translate a single string
 * @param {string} text
 * @param {string} lang - e.g. 'fr', 'es'
 */
export const translateText = async (text, lang = 'en') => {
  if (!text || !lang || lang === 'en') return text;

  // Route long texts through translateLongText to avoid MyMemory's 500-char limit
  if (text.length > 500) {
    return translateLongText(text, lang);
  }

  const cacheKey = `${hashStr(text)}:${lang}`;

  // Layer 1: memory cache — returns instantly, no async
  const memResult = memGet(cacheKey);
  if (memResult !== null) return memResult;

  // Layer 2: Redis cache — fast, no API call
  try {
    const cached = await cache.get('translations', cacheKey);
    if (cached !== null) {
      memSet(cacheKey, cached);
      return cached;
    }
  } catch (err) {
    console.warn('[translator] Redis error:', err.message);
    // Redis down — still works, just skips cache
  }

  // Layer 3: API call with rate limit + dedup
  return fetchTranslation(text, lang, cacheKey);
};

/**
 * Translate multiple strings in parallel (one API call per string,
 * all fire concurrently up to MAX_CONCURRENT)
 * @param {string[]} texts
 * @param {string} lang
 */
const BATCH_SIZE = 10;

export const translateMany = async (texts = [], lang = 'en') => {
  if (!lang || lang === 'en') return texts;

  const results = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map((text) => translateText(text, lang)));
    results.push(...batchResults);
  }
  return results;
};

/**
 * Translate a long string by splitting into chunks (max 500 chars per chunk,
 * splitting on sentence boundaries) so that MyMemory's limit is respected.
 * Each chunk is translated independently and re-joined.
 */
export const translateLongText = async (text, lang = 'en') => {
  if (!text || !lang || lang === 'en' || text.length <= 500)
    return translateText(text, lang);

  // Split on sentence boundaries near 500 chars
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + 500, text.length);
    // Try to break at a sentence boundary
    if (end < text.length) {
      const boundary = text.lastIndexOf('. ', end);
      if (boundary > start + 100) {
        end = boundary + 1; // include the period
      } else {
        // Fallback: break at last space
        const space = text.lastIndexOf(' ', end);
        if (space > start + 100) end = space;
      }
    }
    chunks.push(text.slice(start, end).trim());
    start = end;
  }

  const translated = await Promise.all(
    chunks.map((chunk) => translateText(chunk, lang)),
  );
  return translated.join(' ');
};

/**
 * Translate the message field of a service result object
 * @param {{ status: number, message: string, data?: any }} result
 * @param {string} lang
 */
export const translateResult = async (result, lang = 'en') => {
  if (!lang || lang === 'en') return result;
  const message = await translateText(result.message, lang);
  return { ...result, message };
};