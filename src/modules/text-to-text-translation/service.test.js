import {
  __resetTranslationProviderCache,
  detectLanguage,
  getLanguages,
  translateBatch,
  translateText,
} from "./service.js";

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
    };
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
    __resetTranslationProviderCache();
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
});
