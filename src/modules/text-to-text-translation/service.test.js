import { cache } from "../../services/cacheService.js";
import {
  __resetTranslationProviderCache,
  detectLanguage,
  getLanguages,
  translateBatch,
  translateText,
} from "./service.js";

jest.mock("../../services/cacheService.js", () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

const jsonResponse = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: jest.fn().mockResolvedValue(body),
});

describe("text-to-text translation service", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      LIBRETRANSLATE_URL: "https://translate.test/",
      LIBRETRANSLATE_API_KEY: "secret",
      LIBRETRANSLATE_TIMEOUT_MS: "1000",
      LIBRETRANSLATE_MAX_CONCURRENCY: "2",
      LIBRETRANSLATE_MIN_DELAY_MS: "1",
      LIBRETRANSLATE_RETRY_ATTEMPTS: "3",
      LIBRETRANSLATE_RETRY_DELAY_MS: "1",
      TRANSLATION_MAX_TEXT_LENGTH: "200",
      TRANSLATION_CHUNK_SIZE: "35",
      TRANSLATION_MAX_BATCH_ITEMS: "3",
      TRANSLATION_ENFORCE_SUPPORTED_LANGS: "false",
      TRANSLATION_CACHE_TTL_SECONDS: "60",
      TRANSLATION_LORDSBOOK_FALLBACK_CACHE_TTL_SECONDS: "1",
      LORDSBOOK_TEXT_ENABLE: "false",
      LORDSBOOK_TEXT_RETRY_ATTEMPTS: "1",
      LORDSBOOK_GATEWAY_URL: "https://lordsbook.test",
    };
    __resetTranslationProviderCache();
    cache.get.mockReset().mockResolvedValue(null);
    cache.set.mockReset().mockResolvedValue(undefined);
    global.fetch = jest.fn();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("normalizes citations and reassembles large text in order", async () => {
    global.fetch.mockImplementation(async (_url, options) => {
      const payload = JSON.parse(options.body);
      return jsonResponse({
        translatedText: `<${payload.q}>`,
        detectedLanguage: { language: "en", confidence: 100 },
      });
    });

    const input = "Prayer asks forgiveness.[108] Another sufficiently long sentence follows here.";
    const result = await translateText({ q: input, source: "auto", target: "ar" });

    expect(global.fetch.mock.calls.length).toBeGreaterThan(1);
    expect(result.chunkCount).toBeGreaterThan(1);
    expect(result.translatedText).toContain("[108]");
    expect(result.detectedLanguage.language).toBe("en");
    const submittedText = global.fetch.mock.calls
      .map(([, options]) => JSON.parse(options.body).q)
      .join(" ");
    expect(submittedText).not.toContain(".[108]");
    for (const [, options] of global.fetch.mock.calls) {
      const payload = JSON.parse(options.body);
      expect(payload.api_key).toBe("secret");
      expect(payload.target).toBe("ar");
      expect(payload.q.length).toBeLessThanOrEqual(35);
    }
  });

  test("rejects text and batches over the configured character limit", async () => {
    await expect(
      translateText({ q: "x".repeat(201), target: "ar" }),
    ).rejects.toMatchObject({ status: 400 });

    await expect(
      translateBatch({ q: ["x".repeat(101), "y".repeat(100)], target: "ar" }),
    ).rejects.toMatchObject({ status: 400 });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("translates a batch in one provider request", async () => {
    let active = 0;
    let maximumActive = 0;
    global.fetch.mockImplementation(async (_url, options) => {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      const payload = JSON.parse(options.body);
      return jsonResponse({
        translatedText: payload.q.map((text) => `translated:${text}`),
      });
    });

    const result = await translateBatch({
      q: ["a".repeat(20), "b".repeat(20), "c".repeat(20)],
      source: "en",
      target: "ar",
    });

    expect(result.itemCount).toBe(3);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(maximumActive).toBeLessThanOrEqual(2);
    expect(result.translations.map((item) => item.translatedText)).toEqual([
      `translated:${"a".repeat(20)}`,
      `translated:${"b".repeat(20)}`,
      `translated:${"c".repeat(20)}`,
    ]);
  });

  test("uses per-text cache entries and translates only unique batch misses", async () => {
    global.fetch.mockImplementation(async (_url, options) => {
      const payload = JSON.parse(options.body);
      return jsonResponse({
        translatedText: Array.isArray(payload.q)
          ? payload.q.map((text) => `translated:${text}`)
          : `translated:${payload.q}`,
      });
    });

    await translateText({ q: "cached", source: "en", target: "es" });
    global.fetch.mockClear();
    const result = await translateBatch({
      q: ["cached", "missing", "missing"],
      source: "en",
      target: "es",
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse(global.fetch.mock.calls[0][1].body).q).toEqual(["missing"]);
    expect(result.translations.map((item) => item.translatedText)).toEqual([
      "translated:cached",
      "translated:missing",
      "translated:missing",
    ]);
  });

  test("uses Redis results with an opaque SHA-256 cache key", async () => {
    cache.get.mockResolvedValue({
      version: 2,
      provider: "libre",
      result: {
        translatedText: "Desde Redis",
        source: "en",
        target: "es",
        characterCount: 16,
        chunkCount: 1,
      },
    });

    await expect(
      translateText({ q: "sensitive source", source: "en", target: "es" }),
    ).resolves.toMatchObject({ translatedText: "Desde Redis" });
    expect(global.fetch).not.toHaveBeenCalled();
    expect(cache.get).toHaveBeenCalledWith(
      "text-translations",
      expect.stringMatching(/^v2:[a-f0-9]{64}$/),
    );
    expect(cache.get.mock.calls[0][1]).not.toContain("sensitive source");
  });

  test("expires in-memory cache entries", async () => {
    process.env.TRANSLATION_CACHE_TTL_SECONDS = "1";
    global.fetch.mockResolvedValue(jsonResponse({ translatedText: "Hola" }));
    const now = Date.now();
    const clock = jest.spyOn(Date, "now").mockReturnValue(now);

    await translateText({ q: "memory ttl", source: "en", target: "es" });
    await translateText({ q: "memory ttl", source: "en", target: "es" });
    expect(global.fetch).toHaveBeenCalledTimes(1);

    clock.mockReturnValue(now + 1001);
    await translateText({ q: "memory ttl", source: "en", target: "es" });
    expect(global.fetch).toHaveBeenCalledTimes(2);
    clock.mockRestore();
  });

  test("uses a short cache TTL for Libre fallback and retries recovered Lordsbook", async () => {
    process.env.LORDSBOOK_TEXT_ENABLE = "true";
    let lordsbookHealthy = false;
    global.fetch.mockImplementation(async (url, options) => {
      const { q } = JSON.parse(options.body);
      if (url.startsWith("https://lordsbook.test")) {
        return lordsbookHealthy
          ? jsonResponse({ success: true, data: { translatedText: `lb:${q}` } })
          : jsonResponse({ message: "down" }, 503);
      }
      return jsonResponse({ translatedText: `libre:${q}` });
    });
    const now = Date.now();
    const clock = jest.spyOn(Date, "now").mockReturnValue(now);

    await expect(
      translateText({ q: "recover", source: "en", target: "es" }),
    ).resolves.toMatchObject({ translatedText: "libre:recover" });
    expect(cache.set).toHaveBeenLastCalledWith(
      "text-translations",
      expect.any(String),
      expect.objectContaining({ version: 2, provider: "libre" }),
      1,
    );

    lordsbookHealthy = true;
    clock.mockReturnValue(now + 1001);
    await expect(
      translateText({ q: "recover", source: "en", target: "es" }),
    ).resolves.toMatchObject({ translatedText: "lb:recover" });
    clock.mockRestore();
  });

  test("accepts a direct translation response from the gateway", async () => {
    process.env.LORDSBOOK_TEXT_ENABLE = "true";
    global.fetch.mockResolvedValue(
      jsonResponse({ translatedText: "Direto do gateway" }),
    );

    await expect(
      translateText({ q: "direct response", source: "en", target: "pt" }),
    ).resolves.toMatchObject({
      translatedText: "Direto do gateway",
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch.mock.calls[0][0]).toBe(
      "https://lordsbook.test/translate",
    );
  });

  test("deduplicates concurrent requests for the same text", async () => {
    let release;
    let markStarted;
    const started = new Promise((resolve) => { markStarted = resolve; });
    global.fetch.mockImplementation(() => new Promise((resolve) => {
      release = () => resolve(jsonResponse({ translatedText: "Hola" }));
      markStarted();
    }));

    const first = translateText({ q: "same", source: "en", target: "es" });
    const second = translateText({ q: "same", source: "en", target: "es" });
    await started;
    release();

    await expect(Promise.all([first, second])).resolves.toEqual([
      expect.objectContaining({ translatedText: "Hola" }),
      expect.objectContaining({ translatedText: "Hola" }),
    ]);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test("rejects excess provider work when the bounded queue is full", async () => {
    process.env.LIBRETRANSLATE_MAX_CONCURRENCY = "1";
    process.env.TRANSLATION_PROVIDER_QUEUE_MAX = "1";
    process.env.TRANSLATION_PROVIDER_QUEUE_WAIT_MS = "1000";
    let releaseFirst;
    let markStarted;
    const started = new Promise((resolve) => { markStarted = resolve; });
    global.fetch.mockImplementation((_url, options) => {
      const { q } = JSON.parse(options.body);
      if (q === "first") {
        markStarted();
        return new Promise((resolve) => {
          releaseFirst = () => resolve(jsonResponse({ translatedText: "uno" }));
        });
      }
      return Promise.resolve(jsonResponse({ translatedText: q }));
    });

    const first = translateText({ q: "first", source: "en", target: "es" });
    await started;
    const second = translateText({ q: "second", source: "en", target: "es" });
    await new Promise((resolve) => setTimeout(resolve, 5));
    const excess = translateText({ q: "third", source: "en", target: "es" });

    await expect(excess).rejects.toMatchObject({
      status: 503,
      message: expect.stringContaining("queue is full"),
    });
    releaseFirst();
    await expect(Promise.all([first, second])).resolves.toHaveLength(2);
  });

  test("expires provider work that waits in the queue too long", async () => {
    process.env.LIBRETRANSLATE_MAX_CONCURRENCY = "1";
    process.env.TRANSLATION_PROVIDER_QUEUE_MAX = "2";
    process.env.TRANSLATION_PROVIDER_QUEUE_WAIT_MS = "10";
    let releaseFirst;
    let markStarted;
    const started = new Promise((resolve) => { markStarted = resolve; });
    global.fetch.mockImplementation((_url, options) => {
      const { q } = JSON.parse(options.body);
      if (q === "slow") {
        markStarted();
        return new Promise((resolve) => {
          releaseFirst = () => resolve(jsonResponse({ translatedText: "lento" }));
        });
      }
      return Promise.resolve(jsonResponse({ translatedText: q }));
    });

    const first = translateText({ q: "slow", source: "en", target: "es" });
    await started;
    const waiting = translateText({ q: "waiting", source: "en", target: "es" });

    await expect(waiting).rejects.toMatchObject({
      status: 503,
      message: expect.stringContaining("queue wait exceeded"),
    });
    releaseFirst();
    await expect(first).resolves.toMatchObject({ translatedText: "lento" });
  });

  test("lets Libre fallback run while the Lordsbook queue is saturated", async () => {
    process.env.LORDSBOOK_TEXT_ENABLE = "true";
    process.env.LORDSBOOK_TEXT_MAX_CONCURRENCY = "1";
    process.env.LORDSBOOK_TEXT_QUEUE_MAX = "2";
    process.env.LORDSBOOK_TEXT_QUEUE_WAIT_MS = "10";
    let releaseFirst;
    let markStarted;
    const started = new Promise((resolve) => { markStarted = resolve; });
    global.fetch.mockImplementation((url, options) => {
      const { q } = JSON.parse(options.body);
      if (url.startsWith("https://lordsbook.test")) {
        if (q === "first provider") {
          markStarted();
          return new Promise((resolve) => {
            releaseFirst = () => resolve(jsonResponse({ message: "down" }, 503));
          });
        }
        throw new Error("Queued Lordsbook work should expire before starting");
      }
      return Promise.resolve(jsonResponse({ translatedText: `libre:${q}` }));
    });

    const first = translateText({ q: "first provider", source: "en", target: "es" });
    await started;
    await expect(
      translateText({ q: "fallback provider", source: "en", target: "es" }),
    ).resolves.toMatchObject({ translatedText: "libre:fallback provider" });

    releaseFirst();
    await expect(first).resolves.toMatchObject({ translatedText: "libre:first provider" });
  });

  test("enforces queue deadline while waiting at the provider start gate", async () => {
    process.env.LIBRETRANSLATE_MAX_CONCURRENCY = "2";
    process.env.LIBRETRANSLATE_MIN_DELAY_MS = "1000";
    process.env.TRANSLATION_PROVIDER_QUEUE_WAIT_MS = "10";
    let releaseFirst;
    let markStarted;
    const started = new Promise((resolve) => { markStarted = resolve; });
    global.fetch.mockImplementation((_url, options) => {
      const { q } = JSON.parse(options.body);
      if (q === "gate first") {
        markStarted();
        return new Promise((resolve) => {
          releaseFirst = () => resolve(jsonResponse({ translatedText: q }));
        });
      }
      return Promise.resolve(jsonResponse({ translatedText: q }));
    });

    const first = translateText({ q: "gate first", source: "en", target: "es" });
    await started;
    const gated = translateText({ q: "gate second", source: "en", target: "es" });

    await expect(gated).rejects.toMatchObject({
      status: 503,
      message: expect.stringContaining("queue wait exceeded"),
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    releaseFirst();
    await first;
  });

  test("keeps successful Lordsbook batch items and falls back only failed items", async () => {
    process.env.LORDSBOOK_TEXT_ENABLE = "true";
    global.fetch.mockImplementation(async (url, options) => {
      const payload = JSON.parse(options.body);
      if (url.startsWith("https://lordsbook.test")) {
        if (payload.q === "second") return jsonResponse({ message: "down" }, 503);
        return jsonResponse({ success: true, data: { translatedText: `lb:${payload.q}` } });
      }
      expect(payload.q).toEqual(["second"]);
      return jsonResponse({ translatedText: ["libre:second"] });
    });

    const result = await translateBatch({
      q: ["first", "second", "third"],
      source: "en",
      target: "ta",
    });

    expect(result.translations.map((item) => item.translatedText)).toEqual([
      "lb:first",
      "libre:second",
      "lb:third",
    ]);
    const libreCalls = global.fetch.mock.calls.filter(([url]) =>
      url.startsWith("https://translate.test"));
    expect(libreCalls).toHaveLength(1);
    expect(cache.set.mock.calls.map(([, , value, ttl]) => [value.provider, ttl])).toEqual([
      ["lordsbook", 60],
      ["libre", 1],
      ["lordsbook", 60],
    ]);
  });

  test("skips Lordsbook for targets only advertised by LibreTranslate", async () => {
    process.env.LORDSBOOK_TEXT_ENABLE = "true";
    global.fetch.mockImplementation(async (url, options) => {
      expect(url).toBe("https://translate.test/translate");
      const payload = JSON.parse(options.body);
      return jsonResponse({ translatedText: `libre:${payload.q}` });
    });

    await expect(
      translateText({ q: "Welcome", source: "en", target: "uk" }),
    ).resolves.toMatchObject({ translatedText: "libre:Welcome" });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test("stops a failed Lordsbook batch instead of retrying every item", async () => {
    process.env.LORDSBOOK_TEXT_ENABLE = "true";
    process.env.LORDSBOOK_TEXT_MAX_CONCURRENCY = "2";
    global.fetch.mockImplementation(async (url, options) => {
      const payload = JSON.parse(options.body);
      if (url.startsWith("https://lordsbook.test")) {
        return jsonResponse({ message: "down" }, 503);
      }
      return jsonResponse({
        translatedText: payload.q.map((text) => `libre:${text}`),
      });
    });

    const result = await translateBatch({
      q: ["one", "two", "three"],
      source: "en",
      target: "ta",
    });

    expect(result.translations.map((item) => item.translatedText)).toEqual([
      "libre:one",
      "libre:two",
      "libre:three",
    ]);
    expect(global.fetch.mock.calls.filter(([url]) =>
      url.startsWith("https://lordsbook.test"))).toHaveLength(2);
  });

  test("trips the Lordsbook breaker only for retryable upstream failures", async () => {
    process.env.LORDSBOOK_TEXT_ENABLE = "true";
    process.env.LORDSBOOK_TEXT_BREAKER_THRESHOLD = "2";
    let lordsbookStatus = 400;
    const lordsbookCalls = () =>
      global.fetch.mock.calls.filter(([url]) =>
        url.startsWith("https://lordsbook.test"));
    global.fetch.mockImplementation(async (url, options) => {
      const { q } = JSON.parse(options.body);
      if (url.startsWith("https://lordsbook.test")) {
        return jsonResponse({ message: "failed" }, lordsbookStatus);
      }
      return jsonResponse({ translatedText: `libre:${q}` });
    });

    // Three distinct targets: each is attempted once, and none of the 4xx
    // responses trips the breaker.
    for (const [text, target] of [
      ["bad request 1", "es"],
      ["bad request 2", "fr"],
      ["bad request 3", "de"],
    ]) {
      await translateText({ q: text, source: "en", target });
    }
    expect(lordsbookCalls()).toHaveLength(3);

    // A target Lordsbook rejected is remembered, so it stops paying the wasted
    // upstream round trip until the capability entry expires.
    global.fetch.mockClear();
    await translateText({ q: "bad request 4", source: "en", target: "es" });
    expect(lordsbookCalls()).toHaveLength(0);

    __resetTranslationProviderCache();
    cache.get.mockResolvedValue(null);
    global.fetch.mockClear();
    lordsbookStatus = 503;
    for (const text of ["upstream 1", "upstream 2", "upstream 3"]) {
      await translateText({ q: text, source: "en", target: "es" });
    }
    expect(lordsbookCalls()).toHaveLength(2);
  });

  test("rejects incomplete provider batch output", async () => {
    global.fetch.mockResolvedValue(
      jsonResponse({ translatedText: ["only one"] }),
    );

    await expect(
      translateBatch({ q: ["one", "two"], source: "en", target: "es" }),
    ).rejects.toMatchObject({ status: 502 });
  });

  test("proxies language detection and language discovery", async () => {
    global.fetch
      .mockResolvedValueOnce(jsonResponse([{ language: "en", confidence: 100 }]))
      .mockResolvedValueOnce(jsonResponse([{ code: "en", name: "English", targets: ["ar"] }]));

    await expect(detectLanguage("Hello")).resolves.toEqual([
      { language: "en", confidence: 100 },
    ]);
    await expect(getLanguages()).resolves.toEqual([
      { code: "en", name: "English", targets: ["ar"] },
    ]);

    expect(global.fetch.mock.calls[0][0]).toBe("https://translate.test/detect");
    expect(global.fetch.mock.calls[1][0]).toBe("https://translate.test/languages");
  });

  test("returns a gateway error when LibreTranslate returns invalid output", async () => {
    global.fetch.mockResolvedValue(jsonResponse({ translatedText: "" }));

    await expect(translateText({ q: "Hello", target: "ar" }))
      .rejects.toMatchObject({ status: 502 });
    expect(cache.set).not.toHaveBeenCalled();
  });

  test("retries temporary provider errors", async () => {
    global.fetch
      .mockResolvedValueOnce(jsonResponse({ error: "overloaded" }, 500))
      .mockResolvedValueOnce(jsonResponse({ translatedText: "Hola" }));

    await expect(translateText({ q: "Hello retry", target: "es" }))
      .resolves.toMatchObject({ translatedText: "Hola" });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test("accepts unchanged proper names without treating them as failures", async () => {
    global.fetch.mockResolvedValueOnce(
      jsonResponse({ translatedText: "Legacy Sower" }),
    );

    await expect(
      translateText({ q: "Legacy Sower", source: "en", target: "fr" }),
    ).resolves.toMatchObject({ translatedText: "Legacy Sower" });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

describe("capability enforcement (TRANSLATION_ENFORCE_SUPPORTED_LANGS)", () => {
  const supported = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "tl", name: "Tagalog" },
    { code: "ar", name: "Arabic" },
    { code: "fr", name: "French" },
  ];

  beforeEach(() => {
    process.env.TRANSLATION_ENFORCE_SUPPORTED_LANGS = "true";
    process.env.LORDSBOOK_TEXT_ENABLE = "false";
    process.env.MYMEMORY_TRANSLATE_ENABLE = "false";
    __resetTranslationProviderCache();
    cache.get.mockReset().mockResolvedValue(null);
    cache.set.mockReset().mockResolvedValue(undefined);
    global.fetch = jest.fn();
  });

  const mockProvider = (translateImpl) => {
    global.fetch.mockImplementation(async (url, options) => {
      if (url.endsWith("/languages")) return jsonResponse(supported);
      return translateImpl(url, options);
    });
  };

  const translateCalls = () =>
    global.fetch.mock.calls.filter(([url]) => url.endsWith("/translate"));

  test("rejects an unsupported target up front with 400 and no provider call", async () => {
    mockProvider(() => {
      throw new Error("provider must not be reached");
    });

    await expect(
      translateText({ q: "Hello", source: "en", target: "ta" }),
    ).rejects.toMatchObject({ status: 400, message: expect.stringContaining("not supported") });
    expect(translateCalls()).toHaveLength(0);
  });

  test("falls back to MyMemory when LibreTranslate lacks Malayalam", async () => {
    process.env.MYMEMORY_TRANSLATE_ENABLE = "true";
    global.fetch.mockImplementation(async (url) => {
      if (url.endsWith("/languages")) return jsonResponse(supported);
      if (url.startsWith("https://api.mymemory.translated.net/get?")) {
        return jsonResponse({
          responseStatus: 200,
          responseData: { translatedText: "Malayalam translation" },
        });
      }
      throw new Error(`Unexpected provider URL: ${url}`);
    });

    const result = await translateBatch({
      q: ["Verse", "Devotion"],
      source: "en",
      target: "ml",
    });

    expect(result.provider).toBe("mymemory");
    expect(result.translations.map((item) => item.translatedText)).toEqual([
      "Malayalam translation",
      "Malayalam translation",
    ]);
    expect(global.fetch.mock.calls.filter(([url]) =>
      url.startsWith("https://api.mymemory.translated.net/get?"))).toHaveLength(2);
  });

  test("maps fil to tl before checking capability", async () => {
    mockProvider(async (_url, options) =>
      jsonResponse({
        translatedText: JSON.parse(options.body).q.map((text) => `X:${text}`),
      }),
    );

    const result = await translateBatch({ q: ["Hello"], source: "en", target: "fil" });
    expect(result.translations[0].translatedText).toBe("X:Hello");
    expect(JSON.parse(translateCalls()[0][1].body).target).toBe("tl");
  });

  test("proceeds to the provider when the capability probe fails", async () => {
    global.fetch.mockRejectedValue(new Error("network down"));

    await expect(
      translateText({ q: "Hello", target: "es" }),
    ).rejects.toMatchObject({ status: 502 });
    expect(translateCalls().length).toBeGreaterThan(0);
  });

  test("lets enabled Lordsbook translate before applying Libre capabilities", async () => {
    process.env.LORDSBOOK_TEXT_ENABLE = "true";
    process.env.LORDSBOOK_GATEWAY_URL = "https://lordsbook.test";
    global.fetch.mockImplementation(async (url) => {
      if (url.startsWith("https://lordsbook.test")) {
        return jsonResponse({ success: true, data: { translatedText: "வணக்கம்" } });
      }
      throw new Error("Libre capability endpoint must not be called");
    });

    await expect(
      translateText({ q: "Hello", source: "en", target: "ta" }),
    ).resolves.toMatchObject({ translatedText: "வணக்கம்" });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
