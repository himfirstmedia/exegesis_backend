import { cache } from "../services/cacheService.js";
import { splitText } from "../modules/text-to-text-translation/helper.js";
import {
  translateBatch as translateBatchWithLibre,
  translateText as translateWithLibre,
} from "../modules/text-to-text-translation/service.js";

const CACHE_TTL = 7 * 24 * 60 * 60;
const CACHE_MAX = 500;
const BATCH_SIZE = 100;
const memoryCache = new Map();
const inFlight = new Map();
const warningTimes = new Map();

export const normalizeLanguage = (lang, fallback = "en") => {
  if (typeof lang !== "string") return fallback;
  const normalized = lang.trim();
  return /^[a-z]{2,3}(?:-[A-Za-z]{2,4})?$/.test(normalized)
    ? normalized
    : fallback;
};

const hashText = (text) => {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
};

const getMaxTextLength = () => {
  const value = Number.parseInt(process.env.TRANSLATION_MAX_TEXT_LENGTH, 10);
  return Number.isInteger(value) && value > 0 ? value : 20000;
};

const getCacheKey = (text, lang) => {
  const model = process.env.LIBRETRANSLATE_MODEL_VERSION || "1.9.6";
  // v6 drops English echoes that older runs accepted as translations.
  return `v6:libretranslate:${model}:en:${lang}:${hashText(text)}`;
};

const setMemoryCache = (key, value) => {
  if (memoryCache.size >= CACHE_MAX) {
    memoryCache.delete(memoryCache.keys().next().value);
  }
  memoryCache.set(key, value);
};

const warnProviderFailure = (lang, message) => {
  const now = Date.now();
  if (now - (warningTimes.get(lang) || 0) < 30000) return;
  warningTimes.set(lang, now);
  console.warn(`[translator] Translation providers failed for ${lang}:`, message);
};

/**
 * A provider can report success while echoing a whole sentence back in the
 * source language. Short labels and proper nouns legitimately survive, but a
 * multi-word sentence should be retried through the fallback chain instead of
 * being cached as a valid translation.
 */
const isLikelyUntranslated = (source, translated) =>
  typeof source === "string" &&
  typeof translated === "string" &&
  source.trim() === translated.trim() &&
  source.length >= 24 &&
  source.trim().split(/\s+/).length >= 4;

const resolveProviderPromise = async (
  promise,
  sourceText,
  lang,
  throwOnFailure,
) => {
  try {
    return await promise;
  } catch (error) {
    warnProviderFailure(lang, error.message);
    if (throwOnFailure) throw error;
    return sourceText;
  }
};

const translateChunk = async (text, lang, { throwOnFailure = false, requireChanged = false } = {}) => {
  const cacheKey = getCacheKey(text, lang);
  if (memoryCache.has(cacheKey)) return memoryCache.get(cacheKey);
  if (inFlight.has(cacheKey)) {
    return resolveProviderPromise(
      inFlight.get(cacheKey),
      text,
      lang,
      throwOnFailure,
    );
  }

  const promise = (async () => {
    const cached = await cache.get("translations", cacheKey);
    if (typeof cached === "string") {
      setMemoryCache(cacheKey, cached);
      return cached;
    }

    const result = await translateWithLibre({
      q: text,
      source: "en",
      target: lang,
      ...(requireChanged ? { requireChanged: true } : {}),
    });
    const translated = result.translatedText || text;
    setMemoryCache(cacheKey, translated);
    void cache.set("translations", cacheKey, translated, CACHE_TTL);
    return translated;
  })().finally(() => inFlight.delete(cacheKey));

  inFlight.set(cacheKey, promise);
  return resolveProviderPromise(promise, text, lang, throwOnFailure);
};

export const translateText = async (text, lang = "en", options = {}) => {
  const target = normalizeLanguage(lang);
  if (!text || target.toLowerCase() === "en") return text;
  if (text.length > getMaxTextLength()) return translateLongText(text, target, options);
  return translateChunk(text, target, options);
};

export const translateMany = async (texts = [], lang = "en", options = {}) => {
  const target = normalizeLanguage(lang);
  if (target.toLowerCase() === "en") return texts;

  const results = [];
  for (let index = 0; index < texts.length; index += BATCH_SIZE) {
    const batch = texts.slice(index, index + BATCH_SIZE);
    const batchCharacters = batch.reduce(
      (total, text) => total + (typeof text === "string" ? text.length : 0),
      0,
    );
    if (
      batchCharacters > getMaxTextLength() ||
      batch.some((text) => typeof text === "string" && text.length > getMaxTextLength())
    ) {
      results.push(
        ...(await Promise.all(
          batch.map((text) => translateText(text, target, options)),
        )),
      );
      continue;
    }

    const translated = new Array(batch.length);
    const missing = [];
    await Promise.all(
      batch.map(async (text, batchIndex) => {
        if (!text) {
          translated[batchIndex] = text;
          return;
        }
        const cacheKey = getCacheKey(text, target);
        if (memoryCache.has(cacheKey)) {
          translated[batchIndex] = memoryCache.get(cacheKey);
          return;
        }
        if (inFlight.has(cacheKey)) {
          translated[batchIndex] = await resolveProviderPromise(
            inFlight.get(cacheKey),
            text,
            target,
            options.throwOnFailure,
          );
          return;
        }
        const cached = await cache.get("translations", cacheKey);
        if (typeof cached === "string") {
          setMemoryCache(cacheKey, cached);
          translated[batchIndex] = cached;
          return;
        }
        missing.push({ text, batchIndex, cacheKey });
      }),
    );

    if (missing.length > 0) {
      const providerPromise = translateBatchWithLibre({
        q: missing.map((item) => item.text),
        source: "en",
        target,
        format: "text",
      }).then((response) =>
        response.translations.map(
          (item, itemIndex) =>
            item.translatedText || missing[itemIndex].text,
        ),
      );

      const itemPromises = missing.map((item, itemIndex) => {
        const itemPromise = providerPromise
          .then((values) => values[itemIndex])
          .finally(() => inFlight.delete(item.cacheKey));
        inFlight.set(item.cacheKey, itemPromise);
        return itemPromise;
      });

      let values;
      let success = true;
      try {
        values = await Promise.all(itemPromises);
      } catch (error) {
        warnProviderFailure(target, error.message);
        if (options.throwOnFailure) throw error;
        success = false;
        values = missing.map((item) => item.text);
      }
      missing.forEach((item, itemIndex) => {
        const value = values[itemIndex];
        translated[item.batchIndex] = value;
        if (success) {
          // Do not persist an English sentence as a successful translation;
          // that would make the gap permanent for the cache TTL.
          if (!isLikelyUntranslated(item.text, value)) {
            setMemoryCache(item.cacheKey, value);
            void cache.set("translations", item.cacheKey, value, CACHE_TTL);
          }
        }
      });

      if (success && options.retryUnchanged) {
        const unchanged = missing.filter((item, itemIndex) =>
          isLikelyUntranslated(item.text, values[itemIndex]),
        );
        await Promise.all(
          unchanged.map(async (item) => {
            try {
              // Bypass the translator cache: the echoed English value may
              // already be cached from the batch above.
              const result = await translateWithLibre({
                q: item.text,
                source: "en",
                target,
                requireChanged: true,
              });
              const retried = result?.translatedText;
              if (retried && retried !== item.text) {
                translated[item.batchIndex] = retried;
                setMemoryCache(item.cacheKey, retried);
                void cache.set("translations", item.cacheKey, retried, CACHE_TTL);
              }
            } catch {
              // Keep the provider's original value when every provider echoes.
            }
          }),
        );
      }
    }

    results.push(...translated);
  }
  return results;
};

export const translateLongText = async (text, lang = "en", options = {}) => {
  const target = normalizeLanguage(lang);
  if (!text || target.toLowerCase() === "en") return text;
  const chunks = splitText(text, getMaxTextLength());
  const translated = [];
  for (let index = 0; index < chunks.length; index += BATCH_SIZE) {
    const batch = chunks.slice(index, index + BATCH_SIZE);
    translated.push(
      ...(await Promise.all(
        batch.map((chunk) => translateChunk(chunk, target, options)),
      )),
    );
  }
  return translated.join("");
};

export const translateResult = async (result, lang = "en") => {
  const target = normalizeLanguage(lang);
  if (target.toLowerCase() === "en" || !result?.message) return result;
  return { ...result, message: await translateText(result.message, target) };
};
