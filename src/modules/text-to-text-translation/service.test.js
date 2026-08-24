import {
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
      TRANSLATION_MAX_TEXT_LENGTH: "200",
      TRANSLATION_CHUNK_SIZE: "35",
      TRANSLATION_MAX_BATCH_ITEMS: "3",
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

  test("limits all provider calls while translating a batch", async () => {
    let active = 0;
    let maximumActive = 0;
    global.fetch.mockImplementation(async (_url, options) => {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      const payload = JSON.parse(options.body);
      return jsonResponse({ translatedText: payload.q });
    });

    const result = await translateBatch({
      q: ["a".repeat(60), "b".repeat(60), "c".repeat(60)],
      source: "en",
      target: "ar",
    });

    expect(result.itemCount).toBe(3);
    expect(maximumActive).toBeLessThanOrEqual(2);
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
});
