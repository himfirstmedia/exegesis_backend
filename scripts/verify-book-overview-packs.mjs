import 'dotenv/config';
import { prisma } from '../src/config/db.js';
import { readHeadingPackObject, isObjectStorageConfigured } from '../src/services/objectStorage.js';
import { overviewLanguages, overviewManifestKey, overviewPackKey, readOverviewSnapshot, completeOverviewPack, hashOverview } from '../src/modules/book-prologues/pack-data.js';

try {
  if (!isObjectStorageConfigured()) throw new Error('R2 required');
  const snapshot = await readOverviewSnapshot();
  const pending = [...overviewLanguages];
  const results = [];
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (pending.length) {
      const language = pending.shift();
      try {
        const manifest = await readHeadingPackObject(overviewManifestKey(language));
        if (!manifest || manifest.revision !== snapshot.revision) throw new Error('Stale manifest');
        const pack = await readHeadingPackObject(overviewPackKey(manifest.revision, language));
        if (!completeOverviewPack(pack, snapshot, language) || manifest.sha256 !== hashOverview(pack) ||
            manifest.bytes !== Buffer.byteLength(JSON.stringify(pack)) || manifest.bookCount !== Object.keys(snapshot.books).length ||
            JSON.stringify(manifest.missingBooks) !== JSON.stringify(snapshot.missingBooks)) throw new Error('Invalid pack');
        const books = Object.values(pack.books);
        if (books.some(book => typeof book.title !== 'string' || !book.title.trim())) throw new Error('Missing title');
        if (language !== 'en' && books.some(book => book.title === snapshot.books[book.bookName].title)) throw new Error('Untranslated title');
        results.push({ language, verified: true, books: books.length, titles: books.length });
      } catch {
        results.push({ language, verified: false });
      }
    }
  }));
  results.sort((a, b) => overviewLanguages.indexOf(a.language) - overviewLanguages.indexOf(b.language));
  const verified = results.filter(result => result.verified).length;
  console.log(JSON.stringify({ revision: snapshot.revision, sourceBooks: Object.keys(snapshot.books).length,
    missingSourceBooks: snapshot.missingBooks.length, verifiedLanguages: verified, totalLanguages: overviewLanguages.length, results }, null, 2));
  if (verified !== overviewLanguages.length) process.exitCode = 1;
} catch {
  console.error('Overview pack verification failed. Check DB/R2 connectivity. No objects were modified.');
  process.exitCode = 1;
} finally { await prisma.$disconnect(); }
