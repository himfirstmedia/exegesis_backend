import {
  mapWithConcurrency,
  normalizeTranslationText,
  splitText,
  toLibreLanguageCode,
} from "./helper.js";

describe("text translation helpers", () => {
  test("separates Wikipedia citations from sentence punctuation", () => {
    expect(normalizeTranslationText("Repentance.[108] Next.[2]"))
      .toBe("Repentance. [108] Next. [2]");
  });

  test("maps the app Filipino language code for LibreTranslate", () => {
    expect(toLibreLanguageCode("fil")).toBe("tl");
    expect(toLibreLanguageCode("ar")).toBe("ar");
  });

  test("splits at natural boundaries without losing text", () => {
    const text = "First paragraph sentence.\n\nSecond paragraph has several words to split.";
    const chunks = splitText(text, 30);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length <= 30)).toBe(true);
    expect(chunks.join("")).toBe(text);
  });

  test("maps with bounded concurrency and preserves order", async () => {
    let active = 0;
    let maximumActive = 0;
    const result = await mapWithConcurrency([3, 1, 2, 4], 2, async (value) => {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      await new Promise((resolve) => setTimeout(resolve, value));
      active -= 1;
      return value * 2;
    });

    expect(maximumActive).toBe(2);
    expect(result).toEqual([6, 2, 4, 8]);
  });
});
