import { normalizeLanguage, translateMany } from '../../utils/translator.js';

const EXPLAIN_PROSE_FIELDS = [
  'intro',
  'explanation',
  'application',
  'prayer',
  'chapterInsights',
];

// These are the only keys inspected when an allowlisted field contains objects.
const NESTED_PROSE_FIELDS = new Set([
  'intro',
  'explanation',
  'application',
  'prayer',
  'chapterInsights',
  'answer',
  'title',
  'label',
  'description',
  'summary',
  'insight',
  'content',
]);

const PROTECTED_TEXT = /("[^"\n]*"|“[^”\n]*”|\b(?:[1-3]\s+)?[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*\s+\d+:\d+(?:[-–]\d+)?\b|\b[GH]\d{1,5}\b|[\u0370-\u03ff\u0590-\u05ff]+|\([A-Za-zÀ-ž][^()\n]{0,40}\))/g;

const isStructuredWordStudy = (value) => {
  if (typeof value !== 'string') return true;
  const text = value.trim();
  if (!text) return false;
  return /\b(?:strongs?|originalWord|transliteration|lemma)\b/i.test(text)
    || /\b[GH]\d{1,5}\b/.test(text)
    || /[\u0370-\u03ff\u0590-\u05ff]/.test(text)
    || /\*\*[^*]+\*\*\s*(?:\([^)]*\))?\s*(?:—|–|-|:)/.test(text)
    || /^[\[{]/.test(text);
};

const addStringParts = (value, entries, setValue) => {
  if (typeof value !== 'string' || !value.trim()) return;

  const parts = value.split(PROTECTED_TEXT);
  const translatedParts = [...parts];
  parts.forEach((part, index) => {
    if (!part || part.match(new RegExp(`^(?:${PROTECTED_TEXT.source})$`))) return;
    if (!part.trim()) return;
    entries.push({
      value: part,
      setValue: translated => {
        translatedParts[index] = translated;
        setValue(translatedParts.join(''));
      },
    });
  });
};

const collectAllowedValue = (value, entries, setValue) => {
  if (typeof value === 'string') {
    addStringParts(value, entries, setValue);
    return value;
  }

  if (Array.isArray(value)) {
    const copy = [...value];
    value.forEach((item, index) => {
      if (typeof item === 'string') {
        addStringParts(item, entries, translated => { copy[index] = translated; });
      } else if (item && typeof item === 'object' && !Array.isArray(item)) {
        copy[index] = collectAllowedObject(item, entries);
      }
    });
    setValue(copy);
    return copy;
  }

  if (value && typeof value === 'object') {
    const copy = collectAllowedObject(value, entries);
    setValue(copy);
    return copy;
  }

  return value;
};

const collectAllowedObject = (value, entries) => {
  const copy = { ...value };
  Object.keys(value).forEach(key => {
    if (!NESTED_PROSE_FIELDS.has(key)) return;
    collectAllowedValue(value[key], entries, translated => { copy[key] = translated; });
  });
  return copy;
};

const collectWordStudy = (value, entries, setValue) => {
  if (typeof value === 'string') {
    if (!isStructuredWordStudy(value)) addStringParts(value, entries, setValue);
    return;
  }

  if (!Array.isArray(value)) return;
  const copy = [...value];
  value.forEach((item, index) => {
    if (typeof item === 'string' && !isStructuredWordStudy(item)) {
      addStringParts(item, entries, translated => { copy[index] = translated; });
    }
  });
  setValue(copy);
};

const translateFields = async (result, lang, fields, includeWordStudy = false) => {
  const target = normalizeLanguage(lang);
  if (!result || target.toLowerCase() === 'en') return result;

  const entries = [];
  const records = Array.isArray(result) ? result : [result];
  const translatedRecords = [];

  records.forEach((record, recordIndex) => {
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      translatedRecords[recordIndex] = record;
      return;
    }
    const recordCopy = { ...record };
    fields.forEach(field => {
      if (!(field in record)) return;
      collectAllowedValue(record[field], entries, value => { recordCopy[field] = value; });
    });
    if (includeWordStudy) {
      collectWordStudy(record.wordStudy, entries, value => { recordCopy.wordStudy = value; });
    }
    translatedRecords[recordIndex] = recordCopy;
  });

  const translated = Array.isArray(result) ? translatedRecords : translatedRecords[0];

  if (!entries.length) return translated;

  try {
    const values = await translateMany(entries.map(entry => entry.value), target);
    entries.forEach((entry, index) => entry.setValue(values[index]));
    return translated;
  } catch (error) {
    console.warn(`[ai] Translation to ${target} failed:`, error.message);
    return result;
  }
};

export const translateExplainResponse = (result, lang = 'en') =>
  translateFields(result, lang, EXPLAIN_PROSE_FIELDS, true);

export const translatePromptResponse = (result, lang = 'en') =>
  translateFields(result, lang, ['answer']);
