import { translateMany } from "../../utils/translator.js";
import {
  translateDailyDevotionContent,
  translateDailyExegesisContent,
  translateDailyVerseContent,
} from "./dailyContentTranslation.js";

jest.mock("../../utils/translator.js", () => ({
  translateMany: jest.fn(),
}));

describe("daily content translation", () => {
  beforeEach(() => {
    translateMany.mockReset();
    translateMany.mockImplementation(async (texts) =>
      texts.map((text) => `AR:${text}`),
    );
  });

  test("translates daily verse prose while preserving metadata", async () => {
    const item = {
      id: 12,
      bookName: "John",
      chapter: 3,
      verseNumber: 16,
      reference: "John 3:16",
      bibleVersion: "KJV",
      text: "For God so loved the world.",
      explanation: "God's love is demonstrated.",
      reflection: "Consider God's love.",
      learnMore: "https://example.com/learn-more",
      crossReferences: JSON.stringify(["Romans 5:8"]),
      practicalApplications: JSON.stringify(["Love your neighbor"]),
      keyThemes: JSON.stringify(["Love"]),
      takeaways: JSON.stringify(["God loves the world"]),
      wordStudies: JSON.stringify([
        { word: "loved", strongs: "G25", definition: "to love" },
      ]),
    };

    const result = await translateDailyVerseContent(item, "ar");

    expect(result.text).toBe("AR:For God so loved the world.");
    expect(result.explanation).toBe("AR:God's love is demonstrated.");
    expect(result.reflection).toBe("AR:Consider God's love.");
    expect(result.learnMore).toBe("https://example.com/learn-more");
    expect(JSON.parse(result.practicalApplications)).toEqual([
      "AR:Love your neighbor",
    ]);
    expect(JSON.parse(result.wordStudies)).toEqual([
      { word: "loved", strongs: "G25", definition: "AR:to love" },
    ]);
    expect(result.bookName).toBe("John");
    expect(result.reference).toBe("John 3:16");
    expect(result.bibleVersion).toBe("KJV");
    expect(result.crossReferences).toBe(item.crossReferences);
  });

  test("translates devotion title, content, and rich prose", async () => {
    const result = await translateDailyDevotionContent(
      {
        title: "Walk in faith",
        content: "Trust God today.",
        finalThoughts: "Remain faithful.",
        displayDate: "2026-08-24T00:00:00.000Z",
      },
      "ar",
    );

    expect(result.title).toBe("AR:Walk in faith");
    expect(result.content).toBe("AR:Trust God today.");
    expect(result.finalThoughts).toBe("AR:Remain faithful.");
    expect(result.displayDate).toBe("2026-08-24T00:00:00.000Z");
  });

  test("translates exegesis prose but preserves references and tags", async () => {
    const result = await translateDailyExegesisContent(
      {
        title: "The Word",
        passageReference: "John 1:1-5",
        teachingBody: "The Word was with God.",
        application: "Listen to the Word.",
        tags: "john,word",
      },
      "ar",
    );

    expect(result.title).toBe("AR:The Word");
    expect(result.teachingBody).toBe("AR:The Word was with God.");
    expect(result.application).toBe("AR:Listen to the Word.");
    expect(result.passageReference).toBe("John 1:1-5");
    expect(result.tags).toBe("john,word");
  });

  test("keeps malformed JSON and English responses unchanged", async () => {
    const item = { text: "Verse", keyThemes: "not-json" };

    await expect(translateDailyVerseContent(item, "en")).resolves.toBe(item);
    expect(translateMany).not.toHaveBeenCalled();

    const translated = await translateDailyVerseContent(item, "ar");
    expect(translated.keyThemes).toBe("not-json");
  });

  test("returns the original record when translation is unavailable", async () => {
    const warning = jest.spyOn(console, "warn").mockImplementation(() => {});
    translateMany.mockRejectedValueOnce(new Error("offline"));
    const item = { title: "Original", content: "Original content" };

    await expect(translateDailyDevotionContent(item, "ar")).resolves.toBe(item);
    warning.mockRestore();
  });
});
