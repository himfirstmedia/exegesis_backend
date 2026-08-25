import { translateMany } from "../../utils/translator.js";

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

const translateEntries = async (entries, lang) => {
  const maxCharacters = getMaxBatchCharacters();
  const maxItems = getMaxBatchItems();
  let group = [];
  let characterCount = 0;

  const flush = async () => {
    if (!group.length) return;
    const result = await translateMany(
      group.map((entry) => entry.value),
      lang,
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
  if (!item || !lang || lang.toLowerCase() === "en") return item;

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
    await translateEntries(entries, lang);
    return translated;
  } catch (error) {
    console.warn(`[daily-content] Translation to ${lang} failed:`, error.message);
    return item;
  }
};

export const translateDailyVerseContent = (item, lang) =>
  translateRecord(item, lang, VERSE_FIELDS, true);

export const translateDailyDevotionContent = (item, lang) =>
  translateRecord(item, lang, DEVOTION_FIELDS, true);

export const translateDailyExegesisContent = (item, lang) =>
  translateRecord(item, lang, EXEGESIS_FIELDS, false);
