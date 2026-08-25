import { cache } from "../services/cacheService.js";
import { translateText as translateWithLibre } from "../modules/text-to-text-translation/service.js";
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
  translateText: jest.fn(),
}));

describe("LibreTranslate compatibility adapter", () => {
  beforeEach(() => {
    cache.get.mockReset().mockResolvedValue(null);
    cache.set.mockReset().mockResolvedValue(undefined);
    translateWithLibre.mockReset().mockImplementation(async ({ q, target }) => ({
      translatedText: `${target}:${q}`,
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
  });

  test("returns original text when LibreTranslate is unavailable", async () => {
    const warning = jest.spyOn(console, "warn").mockImplementation(() => {});
    translateWithLibre.mockRejectedValueOnce(new Error("offline"));

    await expect(translateText("Unique fallback", "ar")).resolves.toBe(
      "Unique fallback",
    );
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
