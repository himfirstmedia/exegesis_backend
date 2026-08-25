import { cache } from "../services/cacheService.js";
import {
  translateBatch as translateBatchWithLibre,
  translateText as translateWithLibre,
} from "../modules/text-to-text-translation/service.js";
import {
  normalizeLanguage,
  translateLongText,
  translateMany,
  translateResult,
  translateText,
} from "./translator.js";

jest.mock("../services/cacheService.js", () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

jest.mock("../modules/text-to-text-translation/service.js", () => ({
  translateBatch: jest.fn(),
  translateText: jest.fn(),
}));

describe("LibreTranslate compatibility adapter", () => {
  beforeEach(() => {
    cache.get.mockReset().mockResolvedValue(null);
    cache.set.mockReset().mockResolvedValue(undefined);
    translateWithLibre.mockReset().mockImplementation(async ({ q, target }) => ({
      translatedText: `${target}:${q}`,
    }));
    translateBatchWithLibre.mockReset().mockImplementation(async ({ q, target }) => ({
      translations: q.map((text) => ({ translatedText: `${target}:${text}` })),
    }));
  });

  test("preserves the legacy string return contract", async () => {
    await expect(translateText("Unique hello", "ar")).resolves.toBe(
      "ar:Unique hello",
    );
    expect(translateWithLibre).toHaveBeenCalledWith({
      q: "Unique hello",
      source: "en",
      target: "ar",
    });
  });

  test("normalizes invalid language input to English", async () => {
    expect(normalizeLanguage(123)).toBe("en");
    expect(normalizeLanguage("../../es")).toBe("en");
    expect(normalizeLanguage("zh-Hans")).toBe("zh-Hans");
    await expect(translateText("Do not translate", 123)).resolves.toBe(
      "Do not translate",
    );
  });

  test("bypasses English and preserves empty batch positions", async () => {
    await expect(translateText("English text", "en")).resolves.toBe(
      "English text",
    );
    await expect(translateMany(["First unique", "", "Third unique"], "ar"))
      .resolves.toEqual(["ar:First unique", "", "ar:Third unique"]);
    expect(translateBatchWithLibre).toHaveBeenCalledTimes(1);
    expect(translateWithLibre).not.toHaveBeenCalled();
  });

  test("translates ten short fields in one provider request", async () => {
    const fields = Array.from(
      { length: 10 },
      (_, index) => `Unique prologue field ${index}`,
    );

    await expect(translateMany(fields, "fr")).resolves.toEqual(
      fields.map((text) => `fr:${text}`),
    );
    expect(translateBatchWithLibre).toHaveBeenCalledTimes(1);
    expect(translateBatchWithLibre).toHaveBeenCalledWith({
      q: fields,
      source: "en",
      target: "fr",
      format: "text",
    });
  });

  test("returns original text when LibreTranslate is unavailable", async () => {
    const warning = jest.spyOn(console, "warn").mockImplementation(() => {});
    translateWithLibre.mockRejectedValueOnce(new Error("offline"));

    await expect(translateText("Unique fallback", "ar")).resolves.toBe(
      "Unique fallback",
    );
    warning.mockRestore();
  });

  test("returns original batch fields when LibreTranslate is unavailable", async () => {
    const warning = jest.spyOn(console, "warn").mockImplementation(() => {});
    translateBatchWithLibre.mockRejectedValueOnce(new Error("offline"));

    await expect(
      translateMany(["Unique purpose", "Unique summary"], "sw"),
    ).resolves.toEqual(["Unique purpose", "Unique summary"]);
    warning.mockRestore();
  });

  test("splits text over the configured service limit", async () => {
    const previousLimit = process.env.TRANSLATION_MAX_TEXT_LENGTH;
    process.env.TRANSLATION_MAX_TEXT_LENGTH = "20";

    const result = await translateLongText(
      "First sentence. Second sentence. Third sentence.",
      "ar",
    );

    expect(result).toContain("ar:First sentence.");
    expect(translateWithLibre.mock.calls.length).toBeGreaterThan(1);
    if (previousLimit === undefined) {
      delete process.env.TRANSLATION_MAX_TEXT_LENGTH;
    } else {
      process.env.TRANSLATION_MAX_TEXT_LENGTH = previousLimit;
    }
  });

  test("translates only a service result message", async () => {
    const result = { status: 200, message: "Unique success", data: { id: 1 } };
    await expect(translateResult(result, "ar")).resolves.toEqual({
      ...result,
      message: "ar:Unique success",
    });
  });
});
