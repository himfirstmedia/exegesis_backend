import { createHash } from 'node:crypto';
import { prisma } from '../../config/db.js';
import { BIBLE_BOOK_NAMES } from '../bible/bookNames.js';

export const overviewLanguages = Object.keys(BIBLE_BOOK_NAMES);
export const overviewBooks = Object.keys(BIBLE_BOOK_NAMES.en);
// Explicit public fields only: never publish editor IDs or other DB columns.
export const overviewFields = ['author', 'authorDetail', 'audience', 'dateWritten', 'locationWritten',
  'purpose', 'keyTheme', 'summary', 'background', 'lessons', 'chapters', 'structure',
  'applications', 'keyScripture', 'mainThemes', 'keyPeople', 'keyVerses', 'christConnection'];
// Quotes/references keep their original edition and attribution. Translate commentary, not Scripture.
export const translatedOverviewFields = ['designation', ...overviewFields.filter(field => !['chapters', 'keyScripture', 'keyVerses'].includes(field))];
export const hashOverview = value => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
export const overviewPackKey = (revision, language) => `book-overview-packs/${revision}/${language}.json`;
export const overviewManifestKey = language => `book-overview-packs/manifests/${language}.json`;
export const overviewBookKey = (revision, language, partial = false) => `book-overview-packs/books/${revision}/${language}${partial ? '-partial' : ''}.json`;

export function validTranslatedOverview(data, source) {
  const sameShape = (value, original) => {
    if (original == null) return value === original;
    if (typeof original === 'string') return typeof value === 'string' && (!original.trim() || !!value.trim());
    if (Array.isArray(original)) return Array.isArray(value) && value.length === original.length && original.every((item, index) => sameShape(value[index], item));
    if (typeof original === 'object') return !!value && typeof value === 'object' && Object.keys(value).length === Object.keys(original).length &&
      Object.entries(original).every(([key, item]) => sameShape(value[key], item));
    return value === original;
  };
  return sameShape(data, source) && data.bookName === source.bookName &&
    ['keyScripture', 'keyVerses'].every(field => JSON.stringify(data[field]) === JSON.stringify(source[field]));
}

export function makeOverviewSnapshot(rows) {
  const sources = {};
  for (const row of rows) {
    const bookName = row.bookName === 'Psalm' ? 'Psalms' : row.bookName;
    if (!overviewBooks.includes(bookName) || sources[bookName]) throw new Error('Unknown or duplicate prologue book name');
    const index = overviewBooks.indexOf(bookName) + 1;
    const mod100 = index % 100;
    const suffix = mod100 >= 11 && mod100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[index % 10] || 'th');
    sources[bookName] = { bookName, designation: `The ${index}${suffix} Book of the Bible`,
      ...Object.fromEntries(overviewFields.map(field => [field, row[field] ?? null])) };
  }
  const books = Object.fromEntries(overviewBooks.filter(name => sources[name]).map(name => [name, sources[name]]));
  const bookRevisions = Object.fromEntries(Object.entries(books).map(([name, source]) => [name, hashOverview(['overview-v1', source]).slice(0, 12)]));
  const missingBooks = overviewBooks.filter(name => !books[name]);
  return { revision: hashOverview(['overview-v1', bookRevisions, missingBooks]).slice(0, 12), books, bookRevisions, missingBooks };
}

export const readOverviewSnapshot = async () => makeOverviewSnapshot(await prisma.bookPrologue.findMany({
  select: Object.fromEntries(['bookName', ...overviewFields].map(field => [field, true])),
}));

export function completeOverviewPack(pack, snapshot, language) {
  return pack?.schemaVersion === 1 && pack.language === language && pack.revision === snapshot.revision &&
    pack.complete === true && JSON.stringify(pack.bookRevisions) === JSON.stringify(snapshot.bookRevisions) &&
    JSON.stringify(pack.missingBooks) === JSON.stringify(snapshot.missingBooks) &&
    !!pack.books && Object.keys(pack.books).length === Object.keys(snapshot.books).length &&
    Object.keys(snapshot.books).every(name => validTranslatedOverview(pack.books[name], snapshot.books[name]));
}
