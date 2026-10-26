import { cache } from "../../services/cacheService.js";
import { prisma } from "../../config/db.js";
import { normalizeLanguage, translateMany } from "../../utils/translator.js";
import {
  getAllJournalEntries,
  getJournalEntry,
  getJournalExportCopy,
  getJournalPrompts,
  getJournalTemplates,
} from "./service.js";

jest.mock("../../config/db.js", () => ({
  prisma: {
    journalEntry: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock("url", () => ({ fileURLToPath: jest.fn((value) => value) }));

jest.mock("../../services/cacheService.js", () => ({
  cache: { getOrSet: jest.fn() },
}));

jest.mock("../../utils/translator.js", () => ({
  normalizeLanguage: jest.fn((lang) => typeof lang === "string" ? lang : "en"),
  translateMany: jest.fn(),
}));

describe("journal public content translation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    translateMany.mockImplementation(async (texts, lang) =>
      texts.map((text) => `${lang}:${text}`),
    );
  });

  test("translates only prompt prose and preserves canonical records and metadata", async () => {
    const source = [{
      id: 12n,
      prompt: "What did you learn?",
      description: "Reflect on the passage.",
      category: "study",
      bookName: "John",
      chapter: 3n,
      verseNumber: 16n,
      order: 4,
      isActive: true,
      createdBy: "admin-1",
      createdOn: new Date("2026-01-02T00:00:00.000Z"),
      updatedBy: "admin-2",
    }];
    cache.getOrSet.mockResolvedValue(source);

    const result = await getJournalPrompts({ lang: "es", category: "study" });

    expect(normalizeLanguage).toHaveBeenCalledWith("es");
    expect(translateMany).toHaveBeenCalledWith([
      "What did you learn?",
      "Reflect on the passage.",
    ], "es");
    expect(result.returnData).toEqual([{
      ...source[0],
      id: 12,
      chapter: 3,
      verseNumber: 16,
      createdOn: "2026-01-02T00:00:00.000Z",
      prompt: "es:What did you learn?",
      description: "es:Reflect on the passage.",
    }]);
    expect(source[0].prompt).toBe("What did you learn?");
    expect(source[0].description).toBe("Reflect on the passage.");
  });

  test("translates template prose and parsed string prompts without changing promptsJson", async () => {
    const source = [{
      id: 9n,
      name: "Daily reflection",
      description: "A short daily template.",
      category: "reflection",
      promptsJson: JSON.stringify(["Give thanks", null, "Apply the passage"]),
      isActive: true,
      isDefault: false,
      createdBy: "admin-1",
      createdOn: new Date("2026-02-03T00:00:00.000Z"),
    }];
    cache.getOrSet.mockResolvedValue(source);

    const result = await getJournalTemplates({ lang: "fr" });

    expect(translateMany).toHaveBeenCalledWith([
      "Daily reflection",
      "A short daily template.",
      "Give thanks",
      "Apply the passage",
    ], "fr");
    expect(result.returnData[0]).toEqual({
      ...source[0],
      id: 9,
      createdOn: "2026-02-03T00:00:00.000Z",
      name: "fr:Daily reflection",
      description: "fr:A short daily template.",
      prompts: ["fr:Give thanks", null, "fr:Apply the passage"],
    });
    expect(result.returnData[0].promptsJson).toBe(source[0].promptsJson);
    expect(source[0].name).toBe("Daily reflection");
  });

  test("defaults both reads to English without invoking translation", async () => {
    cache.getOrSet
      .mockResolvedValueOnce([{ prompt: "Canonical", description: null }])
      .mockResolvedValueOnce([{
        name: "Canonical template",
        description: null,
        promptsJson: '["Canonical prompt"]',
      }]);

    const prompts = await getJournalPrompts({});
    const templates = await getJournalTemplates();

    expect(normalizeLanguage).toHaveBeenNthCalledWith(1, "en");
    expect(normalizeLanguage).toHaveBeenNthCalledWith(2, "en");
    expect(translateMany).not.toHaveBeenCalled();
    expect(prompts.returnData[0].prompt).toBe("Canonical");
    expect(templates.returnData[0]).toMatchObject({
      name: "Canonical template",
      promptsJson: '["Canonical prompt"]',
      prompts: ["Canonical prompt"],
    });
  });

  test("localizes journal entry prose without mutating the cached source", async () => {
    const source = {
      id: 21n,
      title: "A faithful day",
      content: "I learned to trust God.",
      prayers: "Give me wisdom.",
      gratitude: null,
      learnings: "Patience matters.",
      application: "Listen first.",
      tags: "faith,trust",
      category: "reflection",
      bookName: "John",
      createdOn: new Date("2026-03-04T00:00:00.000Z"),
    };
    cache.getOrSet.mockResolvedValue(source);

    const result = await getJournalEntry({ id: 21, lang: "hi" }, "user-1");

    expect(translateMany).toHaveBeenCalledWith([
      "A faithful day",
      "I learned to trust God.",
      "Give me wisdom.",
      "Patience matters.",
      "Listen first.",
      "faith,trust",
    ], "hi", { throwOnFailure: true, retryUnchanged: true });
    expect(result.returnData).toMatchObject({
      id: 21,
      title: "hi:A faithful day",
      content: "hi:I learned to trust God.",
      contentLanguage: "hi",
      category: "reflection",
      bookName: "John",
    });
    expect(source.title).toBe("A faithful day");
    expect(source).not.toHaveProperty("contentLanguage");
  });

  test("translates only card copy when listing journal entries", async () => {
    prisma.journalEntry.findMany.mockResolvedValue([{
      id: 31n,
      title: "A faithful day",
      content: "I learned to trust God.",
      prayers: "Give me wisdom.",
      gratitude: "Thank you.",
      learnings: "Patience matters.",
      application: "Listen first.",
      tags: "faith,trust",
      createdOn: new Date("2026-03-04T00:00:00.000Z"),
    }]);
    prisma.journalEntry.count.mockResolvedValue(1);

    const result = await getAllJournalEntries(
      { page: 1, pageSize: 20, lang: "fr" },
      "user-1",
    );

    expect(translateMany).toHaveBeenCalledWith(
      ["A faithful day", "I learned to trust God."],
      "fr",
      { throwOnFailure: true, retryUnchanged: true },
    );
    expect(result.returnData.entries[0]).toMatchObject({
      title: "fr:A faithful day",
      content: "fr:I learned to trust God.",
      prayers: "Give me wisdom.",
      contentLanguage: "fr",
    });
  });

  test("reports English when journal localization fails", async () => {
    cache.getOrSet.mockResolvedValue({
      id: 23n,
      title: "Canonical title",
      content: "Canonical content",
    });
    translateMany.mockRejectedValueOnce(new Error("offline"));

    const result = await getJournalEntry({ id: 23, lang: "ru" }, "user-1");

    expect(result.returnData).toMatchObject({
      id: 23,
      title: "Canonical title",
      content: "Canonical content",
      contentLanguage: "en",
    });
  });

  test("returns canonical journal content to the editor", async () => {
    const source = {
      id: 22n,
      title: "Canonical title",
      content: "Canonical content",
    };
    cache.getOrSet.mockResolvedValue(source);

    const result = await getJournalEntry(
      { id: 22, lang: "fr", raw: true },
      "user-1",
    );

    expect(translateMany).not.toHaveBeenCalled();
    expect(result.returnData).toEqual({
      id: 22,
      title: "Canonical title",
      content: "Canonical content",
    });
  });

  test("localizes PDF labels using the requested app language", async () => {
    const copy = await getJournalExportCopy("hi");

    expect(normalizeLanguage).toHaveBeenCalledWith("hi");
    expect(translateMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        "Legacy Ledger",
        "Personal Journal",
        "Generated",
        "Prayer Requests",
        "Public",
        "Private",
      ]),
      "hi",
    );
    expect(copy).toMatchObject({
      ledgerTitle: "hi:Legacy Ledger",
      personalJournal: "hi:Personal Journal",
      generated: "hi:Generated",
      prayerRequests: "hi:Prayer Requests",
      public: "hi:Public",
      private: "hi:Private",
    });
  });
});
