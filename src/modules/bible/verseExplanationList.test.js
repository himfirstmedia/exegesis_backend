jest.mock("../../config/db.js", () => ({
  prisma: {
    verseExplanation: { findMany: jest.fn(), count: jest.fn() },
    systemUser: { findMany: jest.fn() },
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
  createdBy: "user-1",
  updatedBy: null,
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
    prisma.systemUser.findMany.mockResolvedValue([
      { id: "user-1", firstName: "Ada", lastName: "Lovelace", username: "ada" },
    ]);

    const result = await getAllVersesExplanation({
      page: 1,
      pageSize: 4,
      lang: "fr",
      includeSource: true,
    });

    const item = result.data.explanations[0];
    // Cards render the short snippet, so it must follow the translation.
    expect(item.explanation).toBe("fr:God gave his Son");
    // The card shows the creator's name, not their id.
    expect(item.creatorName).toBe("Ada Lovelace");
    expect(item.creatorName).not.toBe(record().createdBy);
    // The canonical snapshot still carries English for the edit screen.
    expect(item.source).toMatchObject({
      explanation: "God gave his Son",
      bookName: "John",
    });
    expect(translateMany).toHaveBeenCalledTimes(2);
  });

  test("returns only list fields instead of hydrated study internals", async () => {
    prisma.verseExplanation.findMany.mockResolvedValue([record()]);
    prisma.verseExplanation.count.mockResolvedValue(1);
    prisma.systemUser.findMany.mockResolvedValue([]);

    const result = await getAllVersesExplanation({ page: 1, pageSize: 4 });
    const item = result.data.explanations[0];

    expect(item).toMatchObject({
      id: 7,
      bookName: "John",
      chapter: 3,
      verseNumber: 16,
      creatorName: null,
      explanation: "God gave his Son",
    });
    for (const key of [
      "exegesis",
      "studyMetadata",
      "application",
      "wordStudies",
      "practicalApps",
      "crossReferences",
      "themes",
      "sharedStudyId",
      "createdBy",
      "updatedBy",
    ]) {
      expect(item).not.toHaveProperty(key);
    }
  });

  test("omits the source payload unless the admin opts in", async () => {
    prisma.verseExplanation.findMany.mockResolvedValue([record()]);
    prisma.verseExplanation.count.mockResolvedValue(1);
    prisma.systemUser.findMany.mockResolvedValue([
      { id: "user-1", firstName: "Ada", lastName: "Lovelace", username: "ada" },
    ]);

    const result = await getAllVersesExplanation({
      page: 1,
      pageSize: 4,
      lang: "fr",
    });

    expect(result.data.explanations[0].source).toBeUndefined();
    expect(result.data.explanations[0].explanation).toBe("fr:God gave his Son");
  });

  test("falls back to the updater's name when the creator is null", async () => {
    prisma.verseExplanation.findMany.mockResolvedValue([
      { ...record(), id: 8n, createdBy: null, updatedBy: "editor-2" },
    ]);
    prisma.verseExplanation.count.mockResolvedValue(1);
    prisma.systemUser.findMany.mockResolvedValue([
      { id: "editor-2", firstName: "Grace", lastName: "Hopper", username: "grace" },
    ]);

    const result = await getAllVersesExplanation({ page: 1, pageSize: 4 });

    expect(result.data.explanations[0].creatorName).toBe("Grace Hopper");
  });

  test("leaves creatorName null when no user can be resolved", async () => {
    prisma.verseExplanation.findMany.mockResolvedValue([
      { ...record(), createdBy: null, updatedBy: null },
    ]);
    prisma.verseExplanation.count.mockResolvedValue(1);
    prisma.systemUser.findMany.mockResolvedValue([]);

    const result = await getAllVersesExplanation({ page: 1, pageSize: 4 });

    expect(result.data.explanations[0].creatorName).toBeNull();
  });

  test("orders by the most recent created or updated date and paginates", async () => {
    const oldOnly = {
      ...record(), id: 1n,
      createdOn: new Date("2026-01-01T00:00:00.000Z"), updatedOn: null,
    };
    const updated = {
      ...record(), id: 2n,
      createdOn: new Date("2025-01-01T00:00:00.000Z"),
      updatedOn: new Date("2026-03-01T00:00:00.000Z"),
    };
    const recent = {
      ...record(), id: 3n,
      createdOn: new Date("2026-02-01T00:00:00.000Z"), updatedOn: null,
    };
    prisma.verseExplanation.findMany.mockResolvedValue([oldOnly, updated, recent]);
    prisma.verseExplanation.count.mockResolvedValue(3);
    prisma.systemUser.findMany.mockResolvedValue([]);

    const first = await getAllVersesExplanation({ page: 1, pageSize: 2 });
    expect(first.data.explanations.map((item) => item.id)).toEqual([2, 3]);

    const second = await getAllVersesExplanation({ page: 2, pageSize: 2 });
    expect(second.data.explanations.map((item) => item.id)).toEqual([1]);
  });

  test("filters by exact book and chapter", async () => {
    prisma.verseExplanation.findMany.mockResolvedValue([record()]);
    prisma.verseExplanation.count.mockResolvedValue(1);
    prisma.systemUser.findMany.mockResolvedValue([]);

    await getAllVersesExplanation({ page: 1, pageSize: 4, bookName: "John", chapter: 3 });

    expect(prisma.verseExplanation.findMany.mock.calls[0][0].where).toMatchObject({
      bookName: "John",
      chapter: 3,
    });
  });

  test("filters by creator/updater display name and searches names", async () => {
    prisma.verseExplanation.findMany.mockResolvedValue([record()]);
    prisma.verseExplanation.count.mockResolvedValue(1);
    prisma.systemUser.findMany.mockResolvedValue([
      { id: "user-1", firstName: "John", lastName: "Joe", username: "johnjoe" },
    ]);

    await getAllVersesExplanation({ page: 1, pageSize: 4, creatorName: "John" });
    expect(prisma.verseExplanation.findMany.mock.calls[0][0].where.AND).toEqual([
      {
        OR: [
          { createdBy: { in: ["user-1"] } },
          { updatedBy: { in: ["user-1"] } },
        ],
      },
    ]);

    await getAllVersesExplanation({ page: 1, pageSize: 4, search: "John" });
    expect(prisma.verseExplanation.findMany.mock.calls[1][0].where.OR).toEqual(
      expect.arrayContaining([
        { createdBy: { in: ["user-1"] } },
        { updatedBy: { in: ["user-1"] } },
      ]),
    );
  });
});