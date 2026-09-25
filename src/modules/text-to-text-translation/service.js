import { AppError, ValidationError } from "../../utils/AppError.js";
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
});

const assertTextLimit = (text, maxTextLength, field = "q") => {
  const length = typeof text === "number" ? text : text.length;
  if (length > maxTextLength) {
    throw new ValidationError(
      `${field} exceeds the ${maxTextLength} character limit`,
    );
  }
};

// ── Lordsbook text-provider circuit breaker ────────────────────────────────
// Lordsbook text translation and TTS share the same upstream. When it is down,
// trying it first for every chunk adds ~10s+ of connect timeouts before the
// LibreTranslate fallback runs. Repeated failures open a breaker so the text
// path goes straight to LibreTranslate until the upstream recovers.
const LB_TEXT_WINDOW_MS = 60_000;
const LB_TEXT_THRESHOLD = readPositiveInt(
  "LORDSBOOK_TEXT_BREAKER_THRESHOLD",
  3,
);
const LB_TEXT_COOLDOWN_MS = readPositiveInt(
  "LORDSBOOK_TEXT_BREAKER_COOLDOWN_MS",
  5 * 60_000,
);
let lordsbookTextBreaker = { failures: [], cooldownUntil: 0 };

const lordsbookTextBreakerOpen = () =>
  Date.now() < lordsbookTextBreaker.cooldownUntil;

const recordLordsbookTextSuccess = () => {
  lordsbookTextBreaker.failures = [];
};

const recordLordsbookTextFailure = () => {
  const now = Date.now();
  lordsbookTextBreaker.failures = [
    ...lordsbookTextBreaker.failures.filter(
      (t) => now - t < LB_TEXT_WINDOW_MS,
    ),
    now,
  ];
  if (lordsbookTextBreaker.failures.length >= LB_TEXT_THRESHOLD) {
    lordsbookTextBreaker.cooldownUntil = now + LB_TEXT_COOLDOWN_MS;
    console.warn(
      `[Translation] Lordsbook text provider unhealthy after ${LB_TEXT_THRESHOLD} failures; skipping it for ${LB_TEXT_COOLDOWN_MS / 1000}s`,
    );
  }
};

let activeProviderRequests = 0;
const providerQueue = [];
let providerStartGate = Promise.resolve();
let lastProviderStart = 0;

const waitForProviderStart = () => {
  const scheduled = providerStartGate.then(async () => {
    const wait = getConfig().minDelayMs - (Date.now() - lastProviderStart);
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    lastProviderStart = Date.now();
  });
  providerStartGate = scheduled.catch(() => {});
  return scheduled;
};

const runNextProviderRequest = () => {
  const maxConcurrency = getConfig().maxConcurrency;
  while (activeProviderRequests < maxConcurrency && providerQueue.length) {
    const { job, resolve, reject } = providerQueue.shift();
    activeProviderRequests += 1;
    void waitForProviderStart()
      .then(job)
      .then(resolve, reject)
      .finally(() => {
        activeProviderRequests -= 1;
        runNextProviderRequest();
      });
  }
};

const withProviderLimit = (job) =>
  new Promise((resolve, reject) => {
    providerQueue.push({ job, resolve, reject });
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
  if (process.env.LORDSBOOK_TEXT_ENABLE === "true" && !lordsbookTextBreakerOpen()) {
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
        recordLordsbookTextSuccess();
        return {
          ...lbResult,
          translatedText: `${leading}${lbResult.translatedText}${trailing}`,
        };
      }
    } catch (e) {
      recordLordsbookTextFailure();
      console.warn(`[Translation] Lordsbook failed, falling back to LibreTranslate: ${e.message}`);
    }
  }

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
  return {
    ...result,
    translatedText: `${leading}${result.translatedText}${trailing}`,
  };
};

export const translateText = async ({ q, source = "auto", target, format = "text", alternatives }) => {
  const config = getConfig();
  assertTextLimit(q, config.maxTextLength);

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

  return {
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
  };
};

export const translateBatch = async ({ q, ...options }) => {
  const config = getConfig();
  if (q.length > config.maxBatchItems) {
    throw new ValidationError(
      `q exceeds the ${config.maxBatchItems} item batch limit`,
    );
  }
  const totalCharacters = q.reduce((total, text) => total + text.length, 0);
  assertTextLimit(totalCharacters, config.maxTextLength, "Batch text");

  // Preserve chunking for unusually large batch items. Verse-sized items use
  // LibreTranslate's native array input and complete in one provider request.
  if (q.some((text) => text.length > config.chunkSize)) {
    const translations = await mapWithConcurrency(
      q,
      config.maxConcurrency,
      (text) => translateText({ q: text, ...options }),
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

// Try Lordsbook first ONLY if explicitly enabled. Batch succeeds only when
  // every item translates; otherwise fall back to LibreTranslate's array input.
  if (
    process.env.LORDSBOOK_TEXT_ENABLE === "true" &&
    !lordsbookTextBreakerOpen()
  ) {
    const lbResults = await mapWithConcurrency(
      prepared,
      config.maxConcurrency,
      async (item) => {
        try {
          return await withProviderLimit(() =>
            translateLordsbookText({
              q: item.value,
              source: options.source || "auto",
              target: options.target,
              format: options.format || "text",
            }),
          );
        } catch (error) {
          console.warn(`[Translation] Lordsbook batch item failed: ${error.message}`);
          return null;
        }
      },
    );
    if (lbResults.every((result) => result?.translatedText)) {
      recordLordsbookTextSuccess();
      const translations = prepared.map((item, index) => ({
        translatedText: `${item.leading}${lbResults[index].translatedText}${item.trailing}`,
        ...(lbResults[index].detectedLanguage
          ? { detectedLanguage: lbResults[index].detectedLanguage }
          : {}),
        source: options.source || "auto",
        target: options.target,
        characterCount: item.original.length,
        chunkCount: 1,
      }));
      return {
        translations,
        itemCount: translations.length,
        characterCount: totalCharacters,
        provider: "lordsbook",
      };
    }
    recordLordsbookTextFailure();
  }

  const payload = {
    q: prepared.map(({ value }) => value),
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
    translatedTexts.length !== prepared.length ||
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
  const translations = prepared.map((item, index) => ({
    translatedText: `${item.leading}${translatedTexts[index]}${item.trailing}`,
    ...(detectedLanguages?.[index]
      ? { detectedLanguage: detectedLanguages[index] }
      : result.detectedLanguage
        ? { detectedLanguage: result.detectedLanguage }
        : {}),
    ...(alternativeGroups?.[index]
      ? { alternatives: alternativeGroups[index] }
      : {}),
    source: options.source || "auto",
    target: options.target,
    characterCount: item.original.length,
    chunkCount: 1,
  }));
  return { translations, itemCount: translations.length, characterCount: totalCharacters };
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
