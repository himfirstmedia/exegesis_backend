const DEFAULT_BASE_URL = "https://translate-api.lordsbook.com";

const readPositiveInt = (name, fallback) => {
  const value = Number.parseInt(process.env[name], 10);
  return Number.isInteger(value) && value > 0 ? value : fallback;
};

const getConfig = () => ({
  baseUrl: (process.env.LORDSBOOK_GATEWAY_URL || DEFAULT_BASE_URL).replace(
    /\/+$/,
    "",
  ),
  apiKey: process.env.LORDSBOOK_API_KEY || "",
  timeoutMs: readPositiveInt("LORDSBOOK_TIMEOUT_MS", 30000),
  retryAttempts: readPositiveInt("LORDSBOOK_RETRY_ATTEMPTS", 3),
  retryDelayMs: readPositiveInt("LORDSBOOK_RETRY_DELAY_MS", 500),
  ttsTimeoutMs: readPositiveInt("LORDSBOOK_TTS_TIMEOUT_MS", 25000),
  ttsRetryAttempts: readPositiveInt("LORDSBOOK_TTS_RETRY_ATTEMPTS", 1),
});

const buildHeaders = (accept, hasBody = false) => {
  const { apiKey } = getConfig();
  // Fallback to provided API key if env is missing
  const key = apiKey || "3e76bf58-8681-48b1-b140-f8fb43c1d386";
  return {
    Accept: accept,
    ...(hasBody ? { "Content-Type": "application/json" } : {}),
    ...(key ? { "X-API-Key": key } : {}),
  };
};

const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const request = async (
  path,
  options = {},
  timeoutMsOverride = null,
  retryAttemptsOverride = null,
) => {
  const config = getConfig();
  const timeoutMs = timeoutMsOverride ?? config.timeoutMs;
  const retryAttempts = retryAttemptsOverride ?? config.retryAttempts;
  let lastError;

  for (let attempt = 1; attempt <= retryAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${config.baseUrl}${path}`, {
        ...options,
        signal: controller.signal,
      });
      if (response.ok) return response;

      const payload = await response.json().catch(() => null);
      const error = new Error(
        payload?.message || `Lordsbook request failed (${response.status})`,
      );
      error.status = response.status;
      error.retryable = response.status === 429 || response.status >= 500;
      throw error;
    } catch (error) {
      if (error?.name === "AbortError") {
        lastError = new Error("Lordsbook request timed out");
        lastError.status = 504;
        lastError.retryable = true;
      } else {
        lastError = error;
        if (lastError.retryable === undefined) {
          lastError.retryable = !lastError.status;
        }
      }
    } finally {
      clearTimeout(timeout);
    }

    if (!lastError.retryable || attempt === retryAttempts) break;
    await delay(config.retryDelayMs * attempt);
  }

  throw lastError;
};

const unwrapJson = async (response) => {
  const payload = await response.json().catch(() => null);
  if (!payload || payload.success !== true) {
    throw new Error(payload?.message || "Lordsbook returned an invalid response");
  }
  return payload.data;
};

export const translateLordsbookText = async ({ q, source, target, format = "text" }) => {
  const response = await request(
    "/translate",
    {
      method: "POST",
      headers: buildHeaders("application/json", true),
      body: JSON.stringify({ q, source, target, format }),
    },
    15000,
  );
  return await unwrapJson(response);
};

export const getLordsbookVoices = async () => {
  const response = await request("/voices", {
    headers: buildHeaders("application/json"),
  });
  const data = await unwrapJson(response);
  if (!Array.isArray(data?.voices)) {
    throw new Error("Lordsbook returned an invalid voice list");
  }
  return data.voices.filter(
    (voice, index, voices) =>
      typeof voice === "string" &&
      voice.trim().length > 0 &&
      voices.indexOf(voice) === index,
  );
};

export const synthesizeLordsbookSpeech = async ({ text, voice, lang, speed }) => {
  const config = getConfig();
  const body = {
    text,
    ...(voice ? { voice } : {}),
    ...(lang ? { lang } : {}),
    ...(speed !== undefined ? { speed } : {}),
  };
  const response = await request(
    "/tts",
    {
      method: "POST",
      headers: buildHeaders("audio/wav", true),
      body: JSON.stringify(body),
    },
    config.ttsTimeoutMs,
    config.ttsRetryAttempts,
  );
  const audioBuffer = Buffer.from(await response.arrayBuffer());
  const isWav =
    audioBuffer.length >= 12 &&
    audioBuffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    audioBuffer.subarray(8, 12).toString("ascii") === "WAVE";
  if (!isWav) throw new Error("Lordsbook returned invalid WAV audio");

  return {
    audioBuffer,
    cacheStatus: response.headers.get("x-tts-cache"),
    hash: response.headers.get("x-tts-hash"),
  };
};
