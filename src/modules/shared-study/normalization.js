import { createHash } from 'node:crypto';
import { CANONICAL_BOOK_ORDER } from '../../constants/bible-books.js';

export const SCALARS = ['introduction', 'explanation', 'application', 'backgroundAuthor', 'backgroundBook', 'backgroundContext', 'finalThoughts'];
export const COLLECTIONS = ['takeaways', 'practicalApplications', 'themes', 'words', 'crossReferences'];
export const jsonSafe = value => JSON.parse(JSON.stringify(value, (_key, item) => typeof item === 'bigint' ? item.toString() : item));
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value;
export const same = (left, right) => JSON.stringify(stable(left)) === JSON.stringify(stable(right));
export function sourceHash(row) {
  const { sharedStudyId: _link, ...original } = jsonSafe(row);
  return createHash('sha256').update(JSON.stringify(stable(original))).digest('hex');
}
export const canonicalBook = value => {
  let name = String(value || '').trim().replace(/\s+/g, ' ');
  if (/^psalm$/i.test(name)) name = 'Psalms';
  return CANONICAL_BOOK_ORDER.find(book => book.toLowerCase() === name.toLowerCase()) || null;
};
export const editionId = value => {
  const id = String(value || '').trim().toUpperCase();
  if (['BSB', 'BEREAN'].includes(id)) return 'BSB';
  // Preserve the historical editorial edition; do not silently reattribute
  // stored quotations to the reader's current free-edition replacement.
  if (['NKJ', 'NKJV'].includes(id)) return 'NKJV';
  return id || 'UNSPECIFIED';
};

function list(value, field, issues) {
  if (value == null || value === '') return [];
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') { issues.push(`${field}: unsupported collection value`); return []; }
  const text = value.trim();
  if (!text) return [];
  try {
    const result = JSON.parse(text);
    if (Array.isArray(result)) return result;
    issues.push(`${field}: JSON is not an array`); return [];
  } catch {
    if (/^[\[{]/.test(text)) { issues.push(`${field}: malformed JSON`); return []; }
    return value.split(/\r?\n/).filter(line => line.trim());
  }
}

export function passageFrom(row, issues) {
  const bookName = canonicalBook(row.bookName);
  const chapter = Number(row.chapter);
  const verse = Number(row.verseNumber ?? row.verse);
  const end = row.verseEnd == null || row.verseEnd === '' ? verse : Number(row.verseEnd);
  if (!bookName || !Number.isInteger(chapter) || chapter < 1 || !Number.isInteger(verse) || verse < 1 || !Number.isInteger(end) || end < verse || end > 176) {
    issues.push('passage: invalid or incomplete reference'); return null;
  }
  return { bookId: CANONICAL_BOOK_ORDER.indexOf(bookName) + 1, startChapter: chapter, startVerse: verse, endChapter: chapter, endVerse: end };
}

function referenceFrom(entry, issues) {
  if (typeof entry === 'string') {
    const match = entry.trim().match(/^(.+?)\s+(\d+)(?::|\s)(\d+)(?:\s*[-–—]\s*(\d+))?(?:\s*[-–—]\s*|\s+|$)([\s\S]*)$/);
    if (!match) { issues.push('crossReferences: unparsed legacy reference'); return null; }
    entry = { bookName: match[1], chapter: match[2], verseNumber: match[3], verseEnd: match[4], referenceText: match[5] };
  }
  if (!entry || typeof entry !== 'object') { issues.push('crossReferences: invalid item'); return null; }
  const passage = passageFrom(entry, issues);
  return passage ? { passage, quotationOverride: entry.referenceText || entry.text || null, commentary: entry.commentary || null } : null;
}

/** Lossless source archival is separate from normalized live fields. */
export function normalizeSource(type, row) {
  const issues = [];
  if (type === 'devotion' && !row.bookName && !row.chapter && !row.verseNumber) return { status: 'NO_PASSAGE', issues, payload: null, key: null };
  const passage = passageFrom(row, issues);
  const study = {};
  for (const field of SCALARS) {
    let value = row[field];
    if (type === 'explanation') {
      if (field === 'explanation') value = row.exegesis?.explanationText;
      else if (field === 'application') value = row.exegesis?.applicationText;
      else value = row.studyMetadata?.[field];
    } else if (field === 'introduction') value = row.verseIntroduction;
    study[field] = value == null || value === '' ? null : String(value);
  }
  const asText = (items, field, property) => list(items, field, issues).map(item => {
    const text = typeof item === 'string' ? item : item?.[property];
    if (typeof text !== 'string') { issues.push(`${field}: missing item text`); return null; }
    return text.trim() ? text : null;
  }).filter(value => value !== null);
  study.takeaways = asText(type === 'explanation' ? row.studyMetadata?.takeaways : row.takeaways, 'takeaways', 'text');
  study.practicalApplications = asText(type === 'explanation' ? row.practicalApps : row.practicalApplications, 'practicalApplications', 'applicationText');
  study.themes = asText(type === 'explanation' ? row.themes : row.keyThemes, 'themes', 'themeName');
  study.words = list(row.wordStudies, 'words', issues).map(item => {
    if (typeof item === 'string') {
      const parts = item.split('|');
      if (parts.length < 3) { issues.push('words: unparsed legacy word'); return null; }
      item = { word: parts[0].trim(), strongs: parts[1].trim(), definition: parts.slice(2).join('|').trim() };
    }
    if (!item || typeof item !== 'object') { issues.push('words: invalid item'); return null; }
    const strongs = String(item.strongsIds?.join('/') || item.strongsId || item.strongs || item.Strongs || '');
    const ids = [...new Set(strongs.match(/\b[HG]\d+\b/gi)?.map(id => id.toUpperCase()) || [])];
    if (strongs && (!ids.length || ids.some(id => !/^[HG][1-9][0-9]*$/.test(id)))) issues.push('words: invalid Strong\'s identifier');
    const transliteration = strongs.match(/^(.*?)\s*[-–—]\s*Strong['’]?s\s+/i)?.[1];
    const word = { surfaceText: String(item.surfaceText || item.word || ''), contextualMeaning: String(item.customDefinition || item.definition || ''), strongsIds: ids };
    if (transliteration) word.surfaceText += ` · ${transliteration}`;
    if (!word.surfaceText.trim() || !word.contextualMeaning.trim()) issues.push('words: incomplete contextual study');
    return word;
  }).filter(Boolean);
  study.crossReferences = list(row.crossReferences, 'crossReferences', issues).map(entry => referenceFrom(entry, issues)).filter(Boolean);
  const edition = editionId(row.bibleVersion);
  return { status: issues.length ? 'INVALID' : 'LINKED', issues, payload: { passage, edition, language: 'en', study }, key: passage ? `${Object.values(passage).join(':')}:${edition}:en` : null };
}

export function mergeStudy(existing, incoming) {
  const merged = structuredClone(existing);
  const conflicts = [];
  for (const field of [...SCALARS, ...COLLECTIONS]) {
    const empty = value => value == null || value === '' || (Array.isArray(value) && value.length === 0);
    if (empty(incoming[field])) continue;
    if (empty(existing[field])) merged[field] = structuredClone(incoming[field]);
    else if (!same(existing[field], incoming[field])) conflicts.push(field);
  }
  // Never partially merge a source with differing populated fields.
  return { merged: conflicts.length ? existing : merged, conflicts };
}
