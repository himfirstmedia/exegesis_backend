import { cache } from "../../services/cacheService.js";
import { normalizeLanguage, translateMany } from "../../utils/translator.js";
import { getJournalPrompts, getJournalTemplates } from "./service.js";

jest.mock("../../config/db.js", () => ({ prisma: {} }));

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
});
