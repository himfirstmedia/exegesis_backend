jest.mock("../../config/db.js", () => ({
  prisma: {
    verseExplanation: { findMany: jest.fn(), count: jest.fn() },
  },
}));
jest.mock("../../modules/bible-translations/service.js", () => ({
  getVerse: jest.fn(),
}));
jest.mock("../../services/cacheService.js", () => ({
  cache: { get: jest.fn(), set: jest.fn(), del: jest.fn() },
}));
jest.mock("../../utils/translator.js", () => ({
  normalizeLanguage: jest.fn((lang) =>
    typeof lang === "string" ? lang : "en",
  ),
  translateLongText: jest.fn(async (text) => text),
  translateMany: jest.fn(async (texts, lang) =>
    texts.map((text) => `${lang}:${text}`),
  ),
}));
jest.mock("./dailyContentTranslation.js", () => ({
  translateDailyDevotionContent: jest.fn(),
  translateDailyExegesisContent: jest.fn(),
  translateDailyVerseContent: jest.fn(),
}));

import { getAllVersesExplanation } from "./service.js";
import { prisma } from "../../config/db.js";
import { translateMany } from "../../utils/translator.js";

const record = () => ({
  id: 7n,
  bookName: "John",
  chapter: 3n,
  verseNumber: 16n,
  bibleVersion: "KJV",
  promptIds: null,
  sortOrder: 430,
  createdOn: new Date("2026-01-01T00:00:00.000Z"),
  updatedOn: new Date("2026-01-01T00:00:00.000Z"),
  exegesis: {
    explanationText: "God gave his Son",
    applicationText: "Trust him",
  },
  studyMetadata: {},
});

describe("getAllVersesExplanation localization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("translates the legacy fields the admin cards render and keeps canonical source", async () => {
    prisma.verseExplanation.findMany.mockResolvedValue([record()]);
    prisma.verseExplanation.count.mockResolvedValue(1);

    const result = await getAllVersesExplanation({
      page: 1,
      pageSize: 4,
      lang: "fr",
      includeSource: true,
    });

    const item = result.data.explanations[0];
    // Cards render the legacy fields, so they must follow the translation.
    expect(item.explanation).toBe("fr:God gave his Son");
    expect(item.application).toBe("fr:Trust him");
    expect(item.exegesis.explanationText).toBe("fr:God gave his Son");
    expect(item.exegesis.applicationText).toBe("fr:Trust him");
    // The canonical snapshot still carries English for the edit screen.
    expect(item.source).toMatchObject({
      explanation: "God gave his Son",
      application: "Trust him",
      bookName: "John",
    });
    expect(item.source.exegesis.explanationText).toBe("God gave his Son");
    expect(translateMany).toHaveBeenCalledTimes(2);
  });

  test("omits the source payload unless the admin opts in", async () => {
    prisma.verseExplanation.findMany.mockResolvedValue([record()]);
    prisma.verseExplanation.count.mockResolvedValue(1);

    const result = await getAllVersesExplanation({
      page: 1,
      pageSize: 4,
      lang: "fr",
    });

    expect(result.data.explanations[0].source).toBeUndefined();
    expect(result.data.explanations[0].explanation).toBe("fr:God gave his Son");
  });
});