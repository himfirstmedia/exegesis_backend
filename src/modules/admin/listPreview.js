import { normalizeLanguage, translateMany } from '../../utils/translator.js';
import { buildLocalizedReference, localizeBookName, localizeReferenceText } from '../bible/bookNames.js';

// Translate only what the list renders, not the article's hidden rich fields.
// Keep canonical rows intact for editing and full-detail navigation.
export const PREVIEW_FIELDS = {
  verse: { explanation: 80 },
  devotion: { title: 100, content: 240 },
  exegesis: { title: 100, teachingBody: 160 },
  journal: { title: 100, content: 280 },
  prologue: { keyTheme: 100, summary: 240 },
  explanation: { explanation: 280, learnMore: 200 },
  tool: { label: 100, description: 240 },
  plan: { title: 100, description: 160 },
  trivia: { question: 160, explanation: 160 },
};

export const excerpt = (value, limit) => {
  if (typeof value !== 'string') return value;
  const text = value.replace(/\s+/g, ' ').trim();
  const characters = Array.from(text);
  if (characters.length <= limit) return text;
  const prefix = characters.slice(0, limit).join('');
  const boundary = prefix.lastIndexOf(' ');
  return `${boundary > limit * 0.6 ? prefix.slice(0, boundary) : prefix}…`;
};

export const localizeListPreviews = async (rows, lang, kind) => {
  const language = normalizeLanguage(lang || 'en');
  const entries = [];
  const result = rows.map(row => {
    const preview = { contentLanguage: language };
    for (const [field, limit] of Object.entries(PREVIEW_FIELDS[kind])) {
      preview[field] = excerpt(row[field], limit);
      if (typeof preview[field] === 'string' && preview[field].trim()) {
        entries.push({ preview, field, value: preview[field], limit });
      }
    }
    if (row.bookName) {
      preview.bookName = localizeBookName(row.bookName, language);
      preview.reference = buildLocalizedReference(row, language);
    }
    if (row.passageReference) {
      preview.reference = localizeReferenceText(row.passageReference, language);
    }
    return { ...row, preview };
  });
  if (language.toLowerCase() !== 'en' && entries.length) {
    let timer;
    try {
      const values = await Promise.race([
        translateMany(entries.map(entry => entry.value), language, {
          throwOnFailure: true, retryUnchanged: true,
        }),
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error('Admin preview translation timed out')), 30000);
        }),
      ]);
      entries.forEach((entry, index) => {
        if (typeof values[index] !== 'string' || !values[index].trim()) {
          throw new Error('Admin preview translation was incomplete');
        }
        entry.preview[entry.field] = excerpt(values[index], entry.limit);
      });
    } finally {
      clearTimeout(timer);
    }
  }
  return result;
};
