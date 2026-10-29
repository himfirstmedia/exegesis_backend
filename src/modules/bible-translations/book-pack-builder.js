import { createHash } from 'node:crypto';
import { BIBLE_BOOK_NAMES } from '../bible/bookNames.js';
import { getCatalog, getBooksWithMaxChapters } from './service.js';
import { writeHeadingPackObject, readHeadingPackObject } from '../../services/objectStorage.js';

export function validateBookPack(pack) {
  if (pack?.schemaVersion !== 1 || !pack.editions?.length || !pack.names?.en) throw new Error('Incomplete book metadata');
  const ids = new Set();
  for (const edition of pack.editions) {
    if (!edition.id || !edition.fileId || ids.has(edition.id) || !edition.books?.length) throw new Error('Invalid edition');
    ids.add(edition.id);
    const numbers = new Set();
    for (const book of edition.books) {
      if (!book.bookName?.trim() || !Number.isInteger(book.bookNumber) || book.bookNumber < 1 || numbers.has(book.bookNumber) ||
          !Number.isInteger(book.maxChapter) || book.maxChapter < 1 || book.chaptersCount !== book.maxChapter ||
          !Number.isInteger(book.totalVerses) || book.totalVerses < 0 || !['Old', 'New'].includes(book.testament)) throw new Error(`Invalid book in ${edition.id}`);
      numbers.add(book.bookNumber);
    }
  }
  for (const names of Object.values(pack.names)) {
    if (Object.keys(pack.names.en).some(name => typeof names[name] !== 'string' || !names[name].trim())) throw new Error('Incomplete localized names');
  }
  return pack;
}

export async function buildBookPack(onProgress = () => {}) {
  const editions = [];
  for (const entry of getCatalog().sort((a, b) => a.id.localeCompare(b.id))) {
    const books = (await getBooksWithMaxChapters(entry.id)).map(book => ({ ...book,
      testament: book.bookNumber <= 39 ? 'Old' : 'New',
    }));
    editions.push({ id: entry.id, fileId: entry.fileId, books });
    onProgress(entry.id, books.length);
  }
  const content = validateBookPack({ schemaVersion: 1, names: BIBLE_BOOK_NAMES, editions });
  const revision = createHash('sha256').update(JSON.stringify(content)).digest('hex').slice(0, 12);
  const pack = { ...content, revision };
  // The revision is a content hash, so a matching immutable object already holds
  // the exact same data. Skip re-uploading it and only refresh the manifest.
  const key = `book-packs/${revision}/catalog.json`;
  const existing = await readHeadingPackObject(key).catch(() => null);
  const reused = Boolean(existing);
  // Immutable content first; an interrupted build never advertises partial data.
  if (!reused) await writeHeadingPackObject(key, pack, { compress: true, cacheControl: 'public, max-age=31536000, immutable' });
  await writeHeadingPackObject('book-packs/manifest.json', { schemaVersion: 1, revision, editionCount: editions.length }, { cacheControl: 'no-cache' });
  return { revision, editionCount: editions.length, reused };
}
