jest.mock("stripe", () => {
  const Stripe = jest.fn().mockImplementation(() => ({
    subscriptions: { cancel: jest.fn() },
    customers: { update: jest.fn() },
  }));
  return { __esModule: true, default: Stripe };
});

jest.mock("../../config/db.js", () => ({
  prisma: {
    dailyVerse: { findMany: jest.fn(), count: jest.fn() },
    dailyDevotion: { findMany: jest.fn(), count: jest.fn() },
    dailyExegesis: { findMany: jest.fn(), count: jest.fn() },
  },
}));

jest.mock("../../services/cacheService.js", () => ({ cache: {} }));
jest.mock("../../utils/translator.js", () => ({
  normalizeLanguage: language => language || 'en',
  translateMany: jest.fn(async (texts, language) => texts.map(text => `${language}:${text}`)),
}));
jest.mock("../../services/objectStorage.js", () => ({
  deleteStoredMedia: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../../utils/emailTemplates.js", () => ({
  __esModule: true,
  default: {},
}));
jest.mock("../bible/dailyContentTranslation.js", () => ({
  translateDailyVerseContent: jest.fn(async (item, lang) => ({
    ...item,
    explanation: `${lang}:${item.explanation}`,
    contentLanguage: lang,
  })),
  translateDailyDevotionContent: jest.fn(async (item, lang) => ({
    ...item,
    title: `${lang}:${item.title}`,
    contentLanguage: lang,
  })),
  translateDailyExegesisContent: jest.fn(async (item, lang) => ({
    ...item,
    title: `${lang}:${item.title}`,
    contentLanguage: lang,
  })),
}));

const {
  getAllDailyVerses,
  getAllDailyDevotions,
  getAllDailyExegesis,
} = require("./service.js");
const { prisma } = require("../../config/db.js");
const {
  translateDailyVerseContent,
  translateDailyDevotionContent,
  translateDailyExegesisContent,
} = require("../bible/dailyContentTranslation.js");

describe("admin daily content localization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("translates daily verses and keeps four-row pagination", async () => {
    prisma.dailyVerse.findMany.mockResolvedValue([
      {
        id: 1n,
        bookName: "John",
        chapter: 3n,
        verseNumber: 16n,
        explanation: "For God so loved the world",
        user: { firstName: "Ada", lastName: "Lovelace" },
      },
    ]);
    prisma.dailyVerse.count.mockResolvedValue(1);

    const result = await getAllDailyVerses({
      page: 0,
      size: 4,
      lang: "fr",
      includeSource: true,
    });

    expect(prisma.dailyVerse.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 4 }),
    );
    expect(translateDailyVerseContent).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1n }),
      "fr",
      expect.objectContaining({ timeBudgetMs: expect.any(Number) }),
    );
    expect(result.data.content[0]).toMatchObject({
      id: 1,
      explanation: "fr:For God so loved the world",
      creatorName: "Ada Lovelace",
      contentLanguage: "fr",
    });
    // The canonical row rides alongside the localized copy so edit screens
    // write English source back to storage.
    expect(result.data.content[0].source).toMatchObject({
      id: 1,
      explanation: "For God so loved the world",
      creatorName: "Ada Lovelace",
    });
    expect(result.data.content[0].source.explanation).not.toBe(
      result.data.content[0].explanation,
    );
    expect(result.data.pageSize).toBe(4);
  });

  test("returns source rows without calling the translator for English", async () => {
    prisma.dailyVerse.findMany.mockResolvedValue([
      { id: 1n, bookName: "John", chapter: 3n, verseNumber: 16n, explanation: "A" },
    ]);
    prisma.dailyVerse.count.mockResolvedValue(1);

    const result = await getAllDailyVerses({ page: 0, size: 4, lang: "en" });

    expect(translateDailyVerseContent).not.toHaveBeenCalled();
    expect(result.data.content[0].explanation).toBe("A");
  });

  test.each([
    ['verse', getAllDailyVerses, 'dailyVerse', 'explanation', translateDailyVerseContent],
    ['devotion', getAllDailyDevotions, 'dailyDevotion', 'content', translateDailyDevotionContent],
    ['exegesis', getAllDailyExegesis, 'dailyExegesis', 'teachingBody', translateDailyExegesisContent],
  ])('%s list translates only its preview and preserves the canonical full record', async (_kind, getRows, model, field, fullTranslator) => {
    const text = 'Full article content. '.repeat(100);
    prisma[model].findMany.mockResolvedValue([{ id: 1n, [field]: text, prayer: 'Hidden prayer' }]);
    prisma[model].count.mockResolvedValue(1);
    const response = await getRows({ size: 4, lang: 'es', listPreview: true });
    expect(fullTranslator).not.toHaveBeenCalled();
    expect(response.data.content[0][field]).toBe(text);
    expect(response.data.content[0].preview[field]).toMatch(/^es:/);
    expect(response.data.content[0].preview[field].length).toBeLessThan(300);
    expect(response.data.content[0].preview.prayer).toBeUndefined();
  });

  test("Spanish uses the admin budget and never silently falls back to English", async () => {
    prisma.dailyVerse.findMany.mockResolvedValue([
      { id: 1n, bookName: "Psalms", chapter: 46n, verseNumber: 10n, explanation: "Be still" },
    ]);
    prisma.dailyVerse.count.mockResolvedValue(1);
    const result = await getAllDailyVerses({ size: 4, lang: "es", includeSource: true });
    expect(result.data.content[0]).toMatchObject({
      explanation: "es:Be still", contentLanguage: "es",
      source: { explanation: "Be still" },
    });
    const options = translateDailyVerseContent.mock.calls[0][2];
    expect(options.throwOnFailure).toBe(true);
    expect(options.timeBudgetMs).toBeGreaterThan(9000);

    translateDailyVerseContent.mockRejectedValueOnce(new Error("Provider unavailable"));
    const failed = await getAllDailyVerses({ size: 4, lang: "es" });
    expect(failed.status).toBe(503);
    expect(failed.data).toBeUndefined();
  });

  test("translates devotions and exegesis rows", async () => {
    prisma.dailyDevotion.findMany.mockResolvedValue([
      { id: 2n, title: "Morning", content: "Devotion body" },
    ]);
    prisma.dailyDevotion.count.mockResolvedValue(1);
    prisma.dailyExegesis.findMany.mockResolvedValue([
      { id: 3n, title: "Exegesis", teachingBody: "Body" },
    ]);
    prisma.dailyExegesis.count.mockResolvedValue(1);

    const devotions = await getAllDailyDevotions({
      page: 0,
      size: 4,
      lang: "ar",
    });
    const exegesis = await getAllDailyExegesis({
      page: 0,
      size: 4,
      lang: "ar",
    });

    expect(translateDailyDevotionContent).toHaveBeenCalledWith(
      expect.objectContaining({ id: 2n }),
      "ar",
      expect.objectContaining({ timeBudgetMs: expect.any(Number) }),
    );
    expect(devotions.data.content[0].title).toBe("ar:Morning");
    expect(translateDailyExegesisContent).toHaveBeenCalledWith(
      expect.objectContaining({ id: 3n }),
      "ar",
      expect.objectContaining({ timeBudgetMs: expect.any(Number) }),
    );
    expect(exegesis.data.content[0].title).toBe("ar:Exegesis");
    // Without the explicit opt-in, admin responses stay lean.
    expect(devotions.data.content[0].source).toBeUndefined();
    expect(exegesis.data.content[0].source).toBeUndefined();
  });
});
