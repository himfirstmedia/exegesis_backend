jest.mock("../../config/db.js", () => ({
  prisma: {
    $queryRaw: jest.fn(),
    verseExplanation: { findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn() },
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

import { getAllVersesExplanation, getVerseExplanationForEdit } from "./service.js";
import { prisma } from "../../config/db.js";
import { translateMany } from "../../utils/translator.js";
import { invalidateVerseExplanationLists } from "./verseExplanationListCache.js";

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
  beforeEach(async () => {
    await invalidateVerseExplanationLists();
    jest.clearAllMocks();
  });

  test("shows a linked study date for an undated explanation without inventing a root timestamp", async () => {
    const studyDate = new Date("2025-12-01T10:00:00.000Z");
    prisma.verseExplanation.findMany.mockResolvedValue([
      { ...record(), id: 1n, verseNumber: 17n, createdOn: null, updatedOn: null, sharedStudy: { createdOn: studyDate } },
      { ...record(), id: 2n, verseNumber: 18n, createdOn: null, updatedOn: null },
      record(),
    ]);
    prisma.verseExplanation.count.mockResolvedValue(3);
    prisma.systemUser.findMany.mockResolvedValue([]);
    prisma.$queryRaw.mockResolvedValue([{ id: 7n }, { id: 1n, studyCreatedOn: studyDate }, { id: 2n }]);
    const { data } = await getAllVersesExplanation({ pageSize: 9, listPreview: true });
    expect(data.explanations.map(item => item.id)).toEqual([7, 1, 2]);
    expect(data.explanations[1]).toMatchObject({
      createdOn: null, updatedOn: null, studyCreatedOn: studyDate.toISOString(),
    });
    expect(data.explanations[1]).not.toHaveProperty("sharedStudy");
    expect(data.explanations[2]).not.toHaveProperty("studyCreatedOn");
    expect(prisma.verseExplanation.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.verseExplanation.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: { in: [7n, 1n, 2n] } },
    }));
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
    expect(prisma.verseExplanation.findMany.mock.calls[0][0].select).not.toHaveProperty("exegesis");
    expect(prisma.verseExplanation.findMany.mock.calls[1][0].where).toEqual({ id: { in: [2n, 3n] } });

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
    expect(prisma.verseExplanation.findMany.mock.calls[2][0].where.OR).toEqual(
      expect.arrayContaining([
        { createdBy: { in: ["user-1"] } },
        { updatedBy: { in: ["user-1"] } },
      ]),
    );
  });

  test("reuses identical page requests, separates language and preview settings, and invalidates stale pages", async () => {
    prisma.verseExplanation.findMany.mockResolvedValue([record()]);
    prisma.systemUser.findMany.mockResolvedValue([]);
    const query = { pageSize: 9, listPreview: true, bookName: "John" };
    await Promise.all([
      getAllVersesExplanation(query),
      getAllVersesExplanation({ ...query, page: "1", search: "  " }),
    ]);
    await getAllVersesExplanation(query);
    expect(prisma.verseExplanation.findMany).toHaveBeenCalledTimes(2);
    await getAllVersesExplanation({ ...query, lang: "fr" });
    await getAllVersesExplanation({ ...query, listPreview: false });
    expect(prisma.verseExplanation.findMany).toHaveBeenCalledTimes(6);
    await invalidateVerseExplanationLists();
    await getAllVersesExplanation(query);
    expect(prisma.verseExplanation.findMany).toHaveBeenCalledTimes(8);
  });

  test("translates short shared-study previews without dropping the requested canonical source", async () => {
    const sharedText = "Shared explanation. ".repeat(30).trim();
    prisma.verseExplanation.findMany
      .mockResolvedValueOnce([record()])
      .mockResolvedValueOnce([{ ...record(), sharedStudy: {
        explanation: sharedText, introduction: "Shared introduction", takeaways: [],
      } }]);
    prisma.systemUser.findMany.mockResolvedValue([]);
    const result = await getAllVersesExplanation({ pageSize: 9, bookName: "John", listPreview: true, includeSource: true, lang: "fr" });
    const [item] = result.data.explanations;
    expect(item.explanation).toBe(item.preview.explanation);
    expect(item.explanation).toMatch(/^fr:Shared explanation/);
    expect(item.explanation.length).toBeLessThan(sharedText.length);
    expect(item.source.explanation).toBe(sharedText);
    expect(item.source).not.toHaveProperty("sharedStudy");
  });
});

test("gets canonical editor content by its primary key without requiring a passage or translating it", async () => {
  prisma.verseExplanation.findUnique.mockResolvedValue({
    ...record(),
    wordStudies: [
      { surfaceText: "Fruit trees", strongsId: null, strongsIds: ["H6086", "H6529"] },
      { surfaceText: "Biblical insight", strongsId: null },
    ],
  });
  const result = await getVerseExplanationForEdit({ id: "7", lang: "fr" });
  expect(result.status).toBe(200);
  expect(result.data).toMatchObject({ id: 7, bookName: "John", explanation: "God gave his Son" });
  expect(result.data.wordStudies).toEqual([
    { surfaceText: "Fruit trees", strongsId: "H6086/H6529", strongsIds: ["H6086", "H6529"] },
    { surfaceText: "Biblical insight", strongsId: "", strongsIds: [] },
  ]);
  expect(prisma.verseExplanation.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 7n } }));
});
