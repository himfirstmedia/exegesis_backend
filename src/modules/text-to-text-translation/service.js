import { createHash } from "crypto";
import { AppError, ValidationError } from "../../utils/AppError.js";
import { cache } from "../../services/cacheService.js";
import { translateLordsbookText } from "../../services/lordsbookGateway.js";
import {
  mapWithConcurrency,
  normalizeTranslationText,
  preserveOuterWhitespace,
  splitText,
  toLibreLanguageCode,
} from "./helper.js";

const DEFAULT_LIBRETRANSLATE_URL =
  "https://exegesis-libretranslate-production.up.railway.app";
const TRANSLATION_CACHE_NAMESPACE = "text-translations";
const RESULT_PROVIDER = Symbol("translationProvider");
const translationMemoryCache = new Map();
const translationInFlight = new Map();

const readPositiveInt = (name, fallback) => {
  const value = Number.parseInt(process.env[name], 10);
  return Number.isInteger(value) && value > 0 ? value : fallback;
};

const getConfig = () => ({
  baseUrl: (process.env.LIBRETRANSLATE_URL || DEFAULT_LIBRETRANSLATE_URL).replace(/\/$/, ""),
  apiKey: process.env.LIBRETRANSLATE_API_KEY || "",
  timeoutMs: readPositiveInt("LIBRETRANSLATE_TIMEOUT_MS", 15000),
  maxConcurrency: readPositiveInt("LIBRETRANSLATE_MAX_CONCURRENCY", 2),
  minDelayMs: readPositiveInt("LIBRETRANSLATE_MIN_DELAY_MS", 300),
  retryAttempts: readPositiveInt("LIBRETRANSLATE_RETRY_ATTEMPTS", 3),
  retryDelayMs: readPositiveInt("LIBRETRANSLATE_RETRY_DELAY_MS", 500),
  maxTextLength: readPositiveInt("TRANSLATION_MAX_TEXT_LENGTH", 20000),
  chunkSize: readPositiveInt("TRANSLATION_CHUNK_SIZE", 1000),
  maxBatchItems: readPositiveInt("TRANSLATION_MAX_BATCH_ITEMS", 100),
  providerQueueMax: readPositiveInt("TRANSLATION_PROVIDER_QUEUE_MAX", 100),
  providerQueueWaitMs: readPositiveInt("TRANSLATION_PROVIDER_QUEUE_WAIT_MS", 2000),
  cacheTtl: readPositiveInt("TRANSLATION_CACHE_TTL_SECONDS", 7 * 24 * 60 * 60),
  fallbackCacheTtl: readPositiveInt(
    "TRANSLATION_LORDSBOOK_FALLBACK_CACHE_TTL_SECONDS",
    60,
  ),
  memoryCacheMax: readPositiveInt("TRANSLATION_MEMORY_CACHE_MAX", 1000),
});

const isLordsbookTextEnabled = () =>
  (process.env.LORDSBOOK_TEXT_ENABLE || "").trim().toLowerCase() === "true";

const getTranslationCacheKey = ({ q, source = "auto", target, format = "text", alternatives }) => {
  const provider = isLordsbookTextEnabled() ? "lordsbook+libre" : "libre";
  const versions = {
    libre: process.env.LIBRETRANSLATE_MODEL_VERSION || "default",
    ...(isLordsbookTextEnabled()
      ? { lordsbook: process.env.LORDSBOOK_TEXT_MODEL_VERSION || "default" }
      : {}),
  };
  const digest = createHash("sha256")
    .update(JSON.stringify({ source, target, format, alternatives: alternatives || 0, provider, versions, text: q }))
    .digest("hex");
  return `v2:${digest}`;
};

const markProvider = (result, provider) => {
  Object.defineProperty(result, RESULT_PROVIDER, { value: provider, configurable: true });
  return result;
};

const getMemoryCache = (key) => {
  const cached = translationMemoryCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    translationMemoryCache.delete(key);
    return null;
  }
  return cached.result;
};

const setMemoryCache = (key, result, provider, ttl) => {
  const { memoryCacheMax } = getConfig();
  if (translationMemoryCache.has(key)) translationMemoryCache.delete(key);
  while (translationMemoryCache.size >= memoryCacheMax) {
    translationMemoryCache.delete(translationMemoryCache.keys().next().value);
  }
  translationMemoryCache.set(key, {
    result: markProvider(result, provider),
    expiresAt: Date.now() + ttl * 1000,
  });
};

const getCachedTranslation = async (key) => {
  const memoryCached = getMemoryCache(key);
  if (memoryCached) return memoryCached;
  const cached = await cache.get(TRANSLATION_CACHE_NAMESPACE, key);
  if (
    cached?.version === 2 &&
    cached.result?.translatedText &&
    typeof cached.result.translatedText === "string" &&
    ["lordsbook", "libre"].includes(cached.provider)
  ) {
    const config = getConfig();
    const ttl = isLordsbookTextEnabled() && cached.provider === "libre"
      ? config.fallbackCacheTtl
      : config.cacheTtl;
    setMemoryCache(key, cached.result, cached.provider, ttl);
    return cached.result;
  }
  return null;
};

const cacheTranslation = (key, result) => {
  const config = getConfig();
  const provider = result[RESULT_PROVIDER] || "libre";
  const ttl = isLordsbookTextEnabled() && provider === "libre"
    ? config.fallbackCacheTtl
    : config.cacheTtl;
  setMemoryCache(key, result, provider, ttl);
  void cache.set(
    TRANSLATION_CACHE_NAMESPACE,
    key,
    { version: 2, provider, result },
    ttl,
  );
};

const assertTextLimit = (text, maxTextLength, field = "q") => {
  const length = typeof text === "number" ? text : text.length;
  if (length > maxTextLength) {
    throw new ValidationError(
      `${field} exceeds the ${maxTextLength} character limit`,
    );
  }
};

// ── Provider capability awareness ───────────────────────────────────────────
// A LibreTranslate deployment does not always ship every Argos model (e.g. some
// Indian languages are missing). Instead of letting every chunk/batch hit the
// provider and spam logs with repeated "not supported" failures, cache the
// provider's `/languages` list and reject unsupported targets up front with a
// clear, non-retryable 400. Controlled by TRANSLATION_ENFORCE_SUPPORTED_LANGS
// (defaults to on).
const SUPPORTED_LANG_TTL_MS = 10 * 60 * 1000;
const SUPPORTED_LANG_NEGATIVE_TTL_MS = 60 * 1000;
const supportedLanguagesCache = { at: 0, codes: null, errorUntil: 0 };

const enforceSupportedLanguages = () =>
  (process.env.TRANSLATION_ENFORCE_SUPPORTED_LANGS ?? "true")
    .trim()
    .toLowerCase() !== "false";

const getSupportedLanguageCodes = async () => {
  const now = Date.now();
  if (
    supportedLanguagesCache.codes &&
    now - supportedLanguagesCache.at < SUPPORTED_LANG_TTL_MS
  ) {
    return supportedLanguagesCache.codes;
  }
  const languages = await getLanguages();
  const codes = new Set(
    languages
      .map((language) =>
        typeof language === "string"
          ? language.toLowerCase()
          : String(language?.code || "").toLowerCase(),
      )
      .filter(Boolean),
  );
  supportedLanguagesCache.codes = codes;
  supportedLanguagesCache.at = now;
  return codes;
};

const assertSupportedTarget = async (target) => {
  const language = toLibreLanguageCode(String(target || "").toLowerCase());
  if (!language || language === "en" || !enforceSupportedLanguages()) return;

  const now = Date.now();
  if (now < supportedLanguagesCache.errorUntil) return;

  try {
    const codes = await getSupportedLanguageCodes();
    if (!codes.has(language)) {
      throw new ValidationError(
        `Translation to '${target}' is not supported by the configured translation provider (libretranslate); install the missing model or choose a supported language`,
      );
    }
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    // Provider unreachable — never block on the capability probe. Skip the
    // pre-check for a short window so a down provider isn't probed per call.
    supportedLanguagesCache.errorUntil = now + SUPPORTED_LANG_NEGATIVE_TTL_MS;
  }
};

export const __resetTranslationProviderCache = () => {
  supportedLanguagesCache.at = 0;
  supportedLanguagesCache.codes = null;
  supportedLanguagesCache.errorUntil = 0;
  translationMemoryCache.clear();
  translationInFlight.clear();
  lordsbookTextBreaker = { failures: [], cooldownUntil: 0 };
  providerStartGate = Promise.resolve();
  lastProviderStart = 0;
};

// ── Lordsbook text-provider circuit breaker ────────────────────────────────
// Lordsbook text translation and TTS share the same upstream. When it is down,
// trying it first for every chunk adds ~10s+ of connect timeouts before the
// LibreTranslate fallback runs. Repeated failures open a breaker so the text
// path goes straight to LibreTranslate until the upstream recovers.
const LB_TEXT_WINDOW_MS = 60_000;
let lordsbookTextBreaker = { failures: [], cooldownUntil: 0 };

const lordsbookTextBreakerOpen = () =>
  Date.now() < lordsbookTextBreaker.cooldownUntil;

const recordLordsbookTextSuccess = () => {
  lordsbookTextBreaker.failures = [];
};

const recordLordsbookTextFailure = () => {
  const now = Date.now();
  const threshold = readPositiveInt("LORDSBOOK_TEXT_BREAKER_THRESHOLD", 3);
  const cooldownMs = readPositiveInt(
    "LORDSBOOK_TEXT_BREAKER_COOLDOWN_MS",
    5 * 60_000,
  );
  lordsbookTextBreaker.failures = [
    ...lordsbookTextBreaker.failures.filter(
      (t) => now - t < LB_TEXT_WINDOW_MS,
    ),
    now,
  ];
  if (lordsbookTextBreaker.failures.length >= threshold) {
    lordsbookTextBreaker.cooldownUntil = now + cooldownMs;
    console.warn(
      `[Translation] Lordsbook text provider unhealthy after ${threshold} failures; skipping it for ${cooldownMs / 1000}s`,
    );
  }
};

const isLordsbookBreakerFailure = (error) =>
  error?.retryable === true &&
  !error.providerQueueOverload &&
  (!error.status || error.status >= 500);

let activeProviderRequests = 0;
const providerQueue = [];
let providerStartGate = Promise.resolve();
let lastProviderStart = 0;

const providerQueueError = (message) => {
  const error = new AppError(503, message);
  error.providerQueueOverload = true;
  return error;
};

const waitForProviderStart = (entry) => {
  const scheduled = providerStartGate.then(async () => {
    if (entry.expired || Date.now() >= entry.deadline) return;
    const wait = getConfig().minDelayMs - (Date.now() - lastProviderStart);
    if (wait > 0) {
      await new Promise((resolve) =>
        setTimeout(resolve, Math.min(wait, Math.max(0, entry.deadline - Date.now()))));
    }
    if (entry.expired || Date.now() >= entry.deadline) return;
    lastProviderStart = Date.now();
  });
  providerStartGate = scheduled.catch(() => {});
  return scheduled;
};

const runNextProviderRequest = () => {
  const maxConcurrency = getConfig().maxConcurrency;
  while (activeProviderRequests < maxConcurrency && providerQueue.length) {
    const entry = providerQueue.shift();
    const { job, resolve, reject } = entry;
    entry.queued = false;
    activeProviderRequests += 1;
    void waitForProviderStart(entry)
      .then(() => {
        if (entry.expired || Date.now() >= entry.deadline) return undefined;
        clearTimeout(entry.timer);
        return job();
      })
      .then(resolve, reject)
      .finally(() => {
        activeProviderRequests -= 1;
        runNextProviderRequest();
      });
  }
};

const withProviderLimit = (job) =>
  new Promise((resolve, reject) => {
    const config = getConfig();
    if (
      activeProviderRequests >= config.maxConcurrency &&
      providerQueue.length >= config.providerQueueMax
    ) {
      reject(providerQueueError("Translation provider queue is full; please retry shortly"));
      return;
    }
    const entry = {
      job,
      resolve,
      reject,
      timer: null,
      deadline: Date.now() + config.providerQueueWaitMs,
      expired: false,
      queued: true,
    };
    entry.timer = setTimeout(() => {
      entry.expired = true;
      if (entry.queued) {
        const index = providerQueue.indexOf(entry);
        if (index !== -1) providerQueue.splice(index, 1);
      }
      reject(providerQueueError("Translation provider queue wait exceeded; please retry shortly"));
    }, config.providerQueueWaitMs);
    providerQueue.push(entry);
    runNextProviderRequest();
  });

const libreRequest = async (path, options = {}) => {
  const config = getConfig();
  let lastError;

  for (let attempt = 1; attempt <= config.retryAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
    try {
      const response = await fetch(`${config.baseUrl}${path}`, {
        ...options,
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          ...(options.body ? { "Content-Type": "application/json" } : {}),
          ...options.headers,
        },
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        const upstreamMessage = body?.error || body?.message;
        const error = new AppError(
          response.status >= 500 ? 502 : response.status,
          upstreamMessage || "Translation provider request failed",
        );
        error.retryable = response.status === 429 || response.status >= 500;
        throw error;
      }
      return body;
    } catch (error) {
      if (error?.name === "AbortError") {
        lastError = new AppError(504, "Translation provider timed out");
        lastError.retryable = true;
      } else if (error instanceof AppError) {
        lastError = error;
      } else {
        // Node's fetch wraps network failures (DNS, connect, TLS) generically
        // as "fetch failed" with the real reason in `error.cause`. Surface it.
        const cause = error.cause || error;
        const code = cause.code || cause.name || "NETWORK_ERROR";
        lastError = new AppError(
          502,
          `Translation provider is unavailable (${code}): ${cause.message || error.message}`,
        );
        lastError.retryable = true;
        lastError.cause = cause;
      }
    } finally {
      clearTimeout(timeout);
    }

    if (!lastError.retryable || attempt === config.retryAttempts) break;
    await new Promise((resolve) =>
      setTimeout(resolve, config.retryDelayMs * attempt),
    );
  }

  throw lastError;
};

const translateChunk = async (chunk, options) => {
  const { leading, value, trailing } = preserveOuterWhitespace(chunk);
  if (!value) return { translatedText: chunk };

  const config = getConfig();
  
  // Try Lordsbook first ONLY if explicitly enabled (and the upstream is
  // believed healthy — see circuit breaker above).
  if (isLordsbookTextEnabled() && !lordsbookTextBreakerOpen()) {
    try {
      const lbResult = await withProviderLimit(() =>
        translateLordsbookText({
          q: value,
          source: options.source,
          target: options.target,
          format: options.format,
        }),
      );
      if (lbResult && lbResult.translatedText) {
        return markProvider({
          ...lbResult,
          translatedText: `${leading}${lbResult.translatedText}${trailing}`,
        }, "lordsbook");
      }
    } catch (e) {
      if (isLordsbookBreakerFailure(e)) {
        recordLordsbookTextFailure();
      }
      console.warn(`[Translation] Lordsbook failed, falling back to LibreTranslate: ${e.message}`);
    }
  }

  await assertSupportedTarget(options.target);
  const payload = {
    q: value,
    source: toLibreLanguageCode(options.source),
    target: toLibreLanguageCode(options.target),
    format: options.format,
    ...(options.alternatives ? { alternatives: options.alternatives } : {}),
    ...(config.apiKey ? { api_key: config.apiKey } : {}),
  };
  let result;
  for (let attempt = 1; attempt <= config.retryAttempts; attempt += 1) {
    result = await withProviderLimit(() =>
      libreRequest("/translate", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );
    const translated = result?.translatedText;
    if (typeof translated === "string" && translated.trim()) break;
    result = null;
    if (attempt < config.retryAttempts) {
      await new Promise((resolve) =>
        setTimeout(resolve, config.retryDelayMs * attempt),
      );
    }
  }
  if (!result) {
    throw new AppError(502, "Translation provider returned untranslated text");
  }
  return markProvider({
    ...result,
    translatedText: `${leading}${result.translatedText}${trailing}`,
  }, "libre");
};

const translateTextUncached = async ({ q, source = "auto", target, format = "text", alternatives }) => {
  const config = getConfig();

  // LibreTranslate's sentence tokenizer can leave `sentence.[123]` untouched.
  const normalized = format === "text" ? normalizeTranslationText(q) : q;
  const chunks = format === "html"
    ? [normalized]
    : splitText(normalized, config.chunkSize);
  const results = await mapWithConcurrency(
    chunks,
    config.maxConcurrency,
    (chunk) => translateChunk(chunk, { source, target, format, alternatives }),
  );

  const provider = results.some((result) => result[RESULT_PROVIDER] === "libre")
    ? "libre"
    : "lordsbook";
  if (provider === "lordsbook") recordLordsbookTextSuccess();
  return markProvider({
    translatedText: results.map((result) => result.translatedText).join(""),
    ...(results[0]?.detectedLanguage
      ? { detectedLanguage: results[0].detectedLanguage }
      : {}),
    ...(chunks.length === 1 && results[0]?.alternatives
      ? { alternatives: results[0].alternatives }
      : {}),
    source,
    target,
    characterCount: q.length,
    chunkCount: chunks.length,
  }, provider);
};

const translateBatchUncached = async ({ q, ...options }) => {
  const config = getConfig();
  const totalCharacters = q.reduce((total, text) => total + text.length, 0);

  // Preserve chunking for unusually large batch items. Verse-sized items use
  // LibreTranslate's native array input and complete in one provider request.
  if (q.some((text) => text.length > config.chunkSize)) {
    const translations = await mapWithConcurrency(
      q,
      config.maxConcurrency,
      (text) => translateTextUncached({ q: text, ...options }),
    );
    return {
      translations,
      itemCount: translations.length,
      characterCount: totalCharacters,
    };
  }

  const prepared = q.map((text) => {
    const normalized = options.format === "html"
      ? text
      : normalizeTranslationText(text);
    return { original: text, ...preserveOuterWhitespace(normalized) };
  });

  let lordsbookResults = null;
  if (
    isLordsbookTextEnabled() &&
    !lordsbookTextBreakerOpen()
  ) {
    lordsbookResults = await mapWithConcurrency(
      prepared,
      config.maxConcurrency,
      async (item) => {
        try {
          const result = await withProviderLimit(() =>
            translateLordsbookText({
              q: item.value,
              source: options.source || "auto",
              target: options.target,
              format: options.format || "text",
            }),
          );
          return { result, error: null };
        } catch (error) {
          console.warn(`[Translation] Lordsbook batch item failed: ${error.message}`);
          return { result: null, error };
        }
      },
    );
    if (lordsbookResults.every(({ result }) => result?.translatedText)) {
      recordLordsbookTextSuccess();
      const translations = prepared.map((item, index) => markProvider({
        translatedText: `${item.leading}${lordsbookResults[index].result.translatedText}${item.trailing}`,
        ...(lordsbookResults[index].result.detectedLanguage
          ? { detectedLanguage: lordsbookResults[index].result.detectedLanguage }
          : {}),
        source: options.source || "auto",
        target: options.target,
        characterCount: item.original.length,
        chunkCount: 1,
      }, "lordsbook"));
      return {
        translations,
        itemCount: translations.length,
        characterCount: totalCharacters,
        provider: "lordsbook",
      };
    }
    if (lordsbookResults.some(({ error }) => isLordsbookBreakerFailure(error))) {
      recordLordsbookTextFailure();
    }
  }

  const libreIndexes = prepared
    .map((_, index) => index)
    .filter((index) => !lordsbookResults?.[index]?.result?.translatedText);
  await assertSupportedTarget(options.target);
  const payload = {
    q: libreIndexes.map((index) => prepared[index].value),
    source: toLibreLanguageCode(options.source || "auto"),
    target: toLibreLanguageCode(options.target),
    format: options.format || "text",
    ...(options.alternatives
      ? { alternatives: options.alternatives }
      : {}),
    ...(config.apiKey ? { api_key: config.apiKey } : {}),
  };
  const result = await withProviderLimit(() =>
    libreRequest("/translate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
  const translatedTexts = result?.translatedText;
  if (
    !Array.isArray(translatedTexts) ||
    translatedTexts.length !== libreIndexes.length ||
    translatedTexts.some((text) => typeof text !== "string" || !text.trim())
  ) {
    throw new AppError(502, "Translation provider returned an incomplete batch");
  }

  const detectedLanguages = Array.isArray(result.detectedLanguage)
    ? result.detectedLanguage
    : null;
  const alternativeGroups = Array.isArray(result.alternatives?.[0])
    ? result.alternatives
    : null;
  let libreIndex = 0;
  const translations = prepared.map((item, index) => {
    const lordsbook = lordsbookResults?.[index]?.result;
    if (lordsbook?.translatedText) {
      return markProvider({
        translatedText: `${item.leading}${lordsbook.translatedText}${item.trailing}`,
        ...(lordsbook.detectedLanguage ? { detectedLanguage: lordsbook.detectedLanguage } : {}),
        source: options.source || "auto",
        target: options.target,
        characterCount: item.original.length,
        chunkCount: 1,
      }, "lordsbook");
    }
    const resultIndex = libreIndex++;
    return markProvider({
      translatedText: `${item.leading}${translatedTexts[resultIndex]}${item.trailing}`,
      ...(detectedLanguages?.[resultIndex]
        ? { detectedLanguage: detectedLanguages[resultIndex] }
        : result.detectedLanguage
          ? { detectedLanguage: result.detectedLanguage }
          : {}),
      ...(alternativeGroups?.[resultIndex]
        ? { alternatives: alternativeGroups[resultIndex] }
        : {}),
      source: options.source || "auto",
      target: options.target,
      characterCount: item.original.length,
      chunkCount: 1,
    }, "libre");
  });
  return { translations, itemCount: translations.length, characterCount: totalCharacters };
};

export const translateText = async (request) => {
  const config = getConfig();
  assertTextLimit(request.q, config.maxTextLength);
  const key = getTranslationCacheKey(request);
  const memoryCached = getMemoryCache(key);
  if (memoryCached) return memoryCached;
  if (translationInFlight.has(key)) return translationInFlight.get(key);

  const promise = (async () => {
    const cached = await getCachedTranslation(key);
    if (cached) return cached;
    const result = await translateTextUncached(request);
    cacheTranslation(key, result);
    return result;
  })().finally(() => translationInFlight.delete(key));
  translationInFlight.set(key, promise);
  return promise;
};

export const translateBatch = async ({ q, ...options }) => {
  const config = getConfig();
  if (q.length > config.maxBatchItems) {
    throw new ValidationError(`q exceeds the ${config.maxBatchItems} item batch limit`);
  }
  const totalCharacters = q.reduce((total, text) => total + text.length, 0);
  assertTextLimit(totalCharacters, config.maxTextLength, "Batch text");

  const unique = new Map();
  q.forEach((text) => {
    const request = { q: text, ...options };
    const key = getTranslationCacheKey(request);
    if (!unique.has(key)) unique.set(key, { key, request, owner: false, promise: null });
  });

  for (const item of unique.values()) {
    const memoryCached = getMemoryCache(item.key);
    if (memoryCached) {
      item.promise = Promise.resolve(memoryCached);
    } else if (translationInFlight.has(item.key)) {
      item.promise = translationInFlight.get(item.key);
    } else {
      let resolve;
      let reject;
      item.promise = new Promise((res, rej) => { resolve = res; reject = rej; });
      item.resolve = resolve;
      item.reject = reject;
      item.owner = true;
      translationInFlight.set(item.key, item.promise);
    }
  }

  const owners = [...unique.values()].filter((item) => item.owner);
  const misses = [];
  let provider;
  await Promise.all(owners.map(async (item) => {
    const cached = await getCachedTranslation(item.key);
    if (cached) {
      item.resolve(cached);
      translationInFlight.delete(item.key);
    } else {
      misses.push(item);
    }
  }));

  if (misses.length) {
    try {
      const fresh = await translateBatchUncached({
        q: misses.map((item) => item.request.q),
        ...options,
      });
      provider = fresh.provider;
      fresh.translations.forEach((result, index) => {
        const item = misses[index];
        cacheTranslation(item.key, result);
        item.resolve(result);
        translationInFlight.delete(item.key);
      });
    } catch (error) {
      misses.forEach((item) => {
        item.reject(error);
        translationInFlight.delete(item.key);
      });
    }
  }

  const resolved = new Map();
  await Promise.all([...unique.values()].map(async (item) => {
    resolved.set(item.key, await item.promise);
  }));
  const translations = q.map((text) =>
    resolved.get(getTranslationCacheKey({ q: text, ...options })));
  return {
    translations,
    itemCount: translations.length,
    characterCount: totalCharacters,
    ...(provider ? { provider } : {}),
  };
};

export const detectLanguage = async (q) => {
  const config = getConfig();
  assertTextLimit(q, config.maxTextLength);
  const payload = { q, ...(config.apiKey ? { api_key: config.apiKey } : {}) };
  const result = await withProviderLimit(() =>
    libreRequest("/detect", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
  if (!Array.isArray(result)) {
    throw new AppError(502, "Translation provider returned an invalid detection response");
  }
  return result;
};

export const getLanguages = async () => {
  const result = await withProviderLimit(() => libreRequest("/languages"));
  if (!Array.isArray(result)) {
    throw new AppError(502, "Translation provider returned an invalid language list");
  }
  return result;
};

export const getStatus = async () => {
  const startedAt = Date.now();
  const languages = await getLanguages();
  return {
    available: true,
    languageCount: languages.length,
    responseTimeMs: Date.now() - startedAt,
    limits: {
      maxTextLength: getConfig().maxTextLength,
      chunkSize: getConfig().chunkSize,
      maxBatchItems: getConfig().maxBatchItems,
    },
  };
};
