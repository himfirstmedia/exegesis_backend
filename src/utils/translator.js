import { cache } from "../services/cacheService.js";
import { splitText } from "../modules/text-to-text-translation/helper.js";
import { translateText as translateWithLibre } from "../modules/text-to-text-translation/service.js";

const CACHE_TTL = 7 * 24 * 60 * 60;
const CACHE_MAX = 500;
const BATCH_SIZE = 10;
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
  return `v4:libretranslate:${model}:en:${lang}:${hashText(text)}`;
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
  console.warn(`[translator] LibreTranslate temporarily failed for ${lang}:`, message);
};

const translateChunk = async (text, lang) => {
  const cacheKey = getCacheKey(text, lang);
  if (memoryCache.has(cacheKey)) return memoryCache.get(cacheKey);
  if (inFlight.has(cacheKey)) return inFlight.get(cacheKey);

  const promise = (async () => {
    try {
      const cached = await cache.get("translations", cacheKey);
      if (typeof cached === "string") {
        setMemoryCache(cacheKey, cached);
        return cached;
      }

      const result = await translateWithLibre({
        q: text,
        source: "en",
        target: lang,
      });
      const translated = result.translatedText || text;
      setMemoryCache(cacheKey, translated);
      void cache.set("translations", cacheKey, translated, CACHE_TTL);
      return translated;
    } catch (error) {
      warnProviderFailure(lang, error.message);
      return text;
    }
  })().finally(() => inFlight.delete(cacheKey));

  inFlight.set(cacheKey, promise);
  return promise;
};

export const translateText = async (text, lang = "en") => {
  const target = normalizeLanguage(lang);
  if (!text || target.toLowerCase() === "en") return text;
  if (text.length > getMaxTextLength()) return translateLongText(text, target);
  return translateChunk(text, target);
};

export const translateMany = async (texts = [], lang = "en") => {
  const target = normalizeLanguage(lang);
  if (target.toLowerCase() === "en") return texts;

  const results = [];
  for (let index = 0; index < texts.length; index += BATCH_SIZE) {
    const batch = texts.slice(index, index + BATCH_SIZE);
    results.push(...(await Promise.all(batch.map((text) => translateText(text, target)))));
  }
  return results;
};

export const translateLongText = async (text, lang = "en") => {
  const target = normalizeLanguage(lang);
  if (!text || target.toLowerCase() === "en") return text;
  const chunks = splitText(text, getMaxTextLength());
  const translated = [];
  for (let index = 0; index < chunks.length; index += BATCH_SIZE) {
    const batch = chunks.slice(index, index + BATCH_SIZE);
    translated.push(...(await Promise.all(batch.map((chunk) => translateChunk(chunk, target)))));
  }
  return translated.join("");
};

export const translateResult = async (result, lang = "en") => {
  const target = normalizeLanguage(lang);
  if (target.toLowerCase() === "en" || !result?.message) return result;
  return { ...result, message: await translateText(result.message, target) };
};
