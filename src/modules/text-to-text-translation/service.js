import { AppError, ValidationError } from "../../utils/AppError.js";
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

let activeProviderRequests = 0;
const providerQueue = [];

const runNextProviderRequest = () => {
  const maxConcurrency = getConfig().maxConcurrency;
  while (activeProviderRequests < maxConcurrency && providerQueue.length) {
    const { job, resolve, reject } = providerQueue.shift();
    activeProviderRequests += 1;
    void job()
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
      throw new AppError(
        response.status >= 500 ? 502 : response.status,
        upstreamMessage || "Translation provider request failed",
      );
    }
    return body;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new AppError(504, "Translation provider timed out");
    }
    if (error instanceof AppError) throw error;
    throw new AppError(502, "Translation provider is unavailable");
  } finally {
    clearTimeout(timeout);
  }
};

const translateChunk = async (chunk, options) => {
  const { leading, value, trailing } = preserveOuterWhitespace(chunk);
  if (!value) return { translatedText: chunk };

  const config = getConfig();
  const payload = {
    q: value,
    source: toLibreLanguageCode(options.source),
    target: toLibreLanguageCode(options.target),
    format: options.format,
    ...(options.alternatives ? { alternatives: options.alternatives } : {}),
    ...(config.apiKey ? { api_key: config.apiKey } : {}),
  };
  const result = await withProviderLimit(() =>
    libreRequest("/translate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
  if (typeof result?.translatedText !== "string" || !result.translatedText.trim()) {
    throw new AppError(502, "Translation provider returned an empty translation");
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

  const translations = await mapWithConcurrency(
    q,
    config.maxConcurrency,
    (text) => translateText({ q: text, ...options }),
  );
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
