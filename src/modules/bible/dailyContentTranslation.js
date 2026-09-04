import {
  normalizeLanguage,
  translateMany,
} from "../../utils/translator.js";

const VERSE_FIELDS = [
  "text",
  "reflection",
  "explanation",
  "learnMore",
  "application",
  "verseIntroduction",
  "backgroundAuthor",
  "backgroundBook",
  "backgroundContext",
  "finalThoughts",
];

const DEVOTION_FIELDS = ["title", "content", ...VERSE_FIELDS];
const EXEGESIS_FIELDS = [
  "title",
  "introduction",
  "contextSummary",
  "teachingBody",
  "application",
  "prayer",
];

const ARRAY_FIELDS = ["practicalApplications", "keyThemes", "takeaways"];

const getMaxBatchCharacters = () => {
  const value = Number.parseInt(process.env.TRANSLATION_MAX_TEXT_LENGTH, 10);
  return Number.isInteger(value) && value > 0 ? value : 20000;
};

const getMaxBatchItems = () => {
  const value = Number.parseInt(process.env.TRANSLATION_MAX_BATCH_ITEMS, 10);
  return Number.isInteger(value) && value > 0 ? value : 100;
};

// Hard cap on how long a daily-content translation may take before the API
// returns the original (English) text. The mobile client's HTTP timeout is 15s,
// so letting a slow translation provider run for longer would surface as a
// Network Error / failed request on the device. Tight just under that budget.
const getTranslationTimeBudget = () => {
  const value = Number.parseInt(process.env.TRANSLATION_TIME_BUDGET_MS, 10);
  return Number.isInteger(value) && value > 0 ? value : 12000;
};

const addText = (entries, value, setValue) => {
  if (
    typeof value === "string" &&
    value.trim() &&
    !/^https?:\/\/\S+$/i.test(value.trim())
  ) {
    entries.push({ value, setValue });
  }
};

const addJsonArray = (record, field, entries) => {
  if (typeof record[field] !== "string") return;
  try {
    const values = JSON.parse(record[field]);
    if (!Array.isArray(values)) return;
    const translated = [...values];
    values.forEach((value, index) => {
      addText(entries, value, (next) => {
        translated[index] = next;
        record[field] = JSON.stringify(translated);
      });
    });
  } catch {
    // Keep malformed legacy JSON unchanged.
  }
};

const addWordStudies = (record, entries) => {
  if (typeof record.wordStudies !== "string") return;
  try {
    const values = JSON.parse(record.wordStudies);
    if (!Array.isArray(values)) return;
    const translated = values.map((value) =>
      value && typeof value === "object" ? { ...value } : value,
    );
    translated.forEach((value, index) => {
      if (!value || typeof value !== "object") return;
      addText(entries, value.definition, (next) => {
        translated[index].definition = next;
        record.wordStudies = JSON.stringify(translated);
      });
    });
  } catch {
    // Keep malformed legacy JSON unchanged.
  }
};

const withTimeout = (promise, ms) => {
  if (!ms || ms <= 0) return promise;
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`Translation exceeded ${ms}ms budget`)),
      ms,
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

const translateEntries = async (entries, lang) => {
  const maxCharacters = getMaxBatchCharacters();
  const maxItems = getMaxBatchItems();
  const budgetMs = getTranslationTimeBudget();
  const startedAt = Date.now();
  let group = [];
  let characterCount = 0;

  const flush = async () => {
    if (!group.length) return;
    // Keep the budget honest across multiple flushes: remaining budget goes
    // down as time elapses, so a long devotion cannot exceed the cap in total.
    const remaining = budgetMs - (Date.now() - startedAt);
    const result = await withTimeout(
      translateMany(
        group.map((entry) => entry.value),
        lang,
      ),
      Math.max(remaining, 1),
    );
    result.forEach((translation, index) => {
      group[index].setValue(translation);
    });
    group = [];
    characterCount = 0;
  };

  for (const entry of entries) {
    if (
      group.length >= maxItems ||
      (group.length && characterCount + entry.value.length > maxCharacters)
    ) {
      await flush();
    }
    group.push(entry);
    characterCount += entry.value.length;
  }
  await flush();
};

const translateRecord = async (item, lang, fields, includeRichFields) => {
  const target = normalizeLanguage(lang);
  if (!item || target.toLowerCase() === "en") return item;

  const translated = { ...item };
  const entries = [];
  fields.forEach((field) => {
    addText(entries, translated[field], (value) => {
      translated[field] = value;
    });
  });

  if (includeRichFields) {
    ARRAY_FIELDS.forEach((field) => addJsonArray(translated, field, entries));
    addWordStudies(translated, entries);
  }

  try {
    await translateEntries(entries, target);
    return translated;
  } catch (error) {
    console.warn(`[daily-content] Translation to ${target} failed:`, error.message);
    return item;
  }
};

export const translateDailyVerseContent = (item, lang) =>
  translateRecord(item, lang, VERSE_FIELDS, true);

export const translateDailyDevotionContent = (item, lang) =>
  translateRecord(item, lang, DEVOTION_FIELDS, true);

export const translateDailyExegesisContent = (item, lang) =>
  translateRecord(item, lang, EXEGESIS_FIELDS, false);
