// Admin/build-time generation only. Do not import this module into HTTP routes.
import { cache } from '../../services/cacheService.js';
import { readHeadingPackObject, writeHeadingPackObject } from '../../services/objectStorage.js';
import { translateMany } from '../../utils/translator.js';
import {
  HEADING_PACK_REVISION, headingLanguages, headingSource, headingPackKeys, makeHeadingPack, isCompleteHeadingPack, isCompleteHeadingBook,
  headingCarryKey, headingTranslationMap, headingTranslationList, headingTexts, validHeadingTranslation,
} from './heading-pack-data.js';

export const buildHeadingPack = async (language, onProgress = () => {}, options = {}) => {
  if (!headingLanguages.includes(language)) throw new Error(`Unsupported heading language: ${language}`);
  // Build-time callers can inject a provider (e.g. Google Cloud Translation for
  // the languages the runtime chain cannot serve). Runtime keeps the default.
  const translate = options.translate ||
    ((items, target) => translateMany(items, target, { throwOnFailure: true }));
  const lock = await cache.acquireLock(`heading-pack:${HEADING_PACK_REVISION}:${language}`, 120);
  if (!lock.acquired) throw new Error(`Another builder is already generating ${language}; retry after it finishes`);
  let owned = true;
  const heartbeat = lock.renew ? setInterval(() => {
    lock.renew().then(ok => { if (!ok) owned = false; }).catch(() => { owned = false; });
  }, 30000) : null;
  heartbeat?.unref();
  try {
    const key = headingPackKeys(language);
    const existing = await readHeadingPackObject(key.final);
    let result = isCompleteHeadingPack(existing, language) ? existing : null;
    const reused = Boolean(result);
    if (language === 'en') result = makeHeadingPack('en', headingSource);
    if (!result) {
      const checkpoint = await readHeadingPackObject(key.partial);
      const books = checkpoint?.revision === HEADING_PACK_REVISION ? checkpoint.books || {} : {};
      // Reuse translations from the previously published revision. Only headings
      // that are new or edited since then reach the provider.
      const carried = headingTranslationMap(options.carry ?? await readHeadingPackObject(headingCarryKey(language)));
      for (const [book, chapters] of Object.entries(headingSource)) {
        // Validate checkpoint books before trusting them after interruption.
        if (isCompleteHeadingBook(book, books[book])) continue;
        if (!owned) throw new Error('Heading pack generation lock lost');
        const items = Object.values(chapters).flat();
        const resolved = items.map(item => validHeadingTranslation(carried.get(item.heading)) ? carried.get(item.heading) : null);
        const missing = [];
        for (let index = 0; index < items.length; index++) if (resolved[index] === null) missing.push(index);
        if (missing.length) {
          const texts = missing.map(index => items[index].heading);
          const translated = language === 'en' ? texts : await translate(texts, language);
          if (!owned) throw new Error('Heading pack generation lock lost');
          if (translated.length !== texts.length || translated.some(text => typeof text !== 'string' || !text.trim())) {
            throw new Error('Incomplete heading translation');
          }
          missing.forEach((index, offset) => { resolved[index] = translated[offset]; });
        }
        let index = 0;
        books[book] = Object.fromEntries(Object.entries(chapters).map(([chapter, headings]) => [
          chapter, headings.map(item => ({ ...item, heading: resolved[index++] })),
        ]));
        await writeHeadingPackObject(key.partial, makeHeadingPack(language, books));
        onProgress({ language, book, completedBooks: Object.keys(books).length, totalBooks: Object.keys(headingSource).length });
      }
      result = makeHeadingPack(language, books);
    }
    if (!isCompleteHeadingPack(result, language)) throw new Error('Incomplete heading pack');
    if (!owned) throw new Error('Heading pack generation lock lost');
    // Re-publish older packs compressed, without re-translating. Publish the
    // manifest last so users can never discover an incomplete upload.
    await writeHeadingPackObject(key.final, result, { compress: true, cacheControl: 'public, max-age=31536000, immutable' });
    // Record source→translation so the next revision reuses unchanged headings.
    // English always equals its source, so it needs no carry.
    if (language !== 'en') {
      await writeHeadingPackObject(headingCarryKey(language), { schemaVersion: 1, revision: HEADING_PACK_REVISION, language,
        texts: headingTexts(), translations: headingTranslationList(result) });
      if (!owned) throw new Error('Heading pack generation lock lost');
    }
    const manifest = {
      headingSet: 'bsb', language, revision: HEADING_PACK_REVISION,
      totalBooks: Object.keys(result.books).length, bytes: Buffer.byteLength(JSON.stringify(result)),
    };
    await writeHeadingPackObject(key.manifest, manifest);
    return { ...manifest, reused };
  } finally {
    if (heartbeat) clearInterval(heartbeat);
    await lock.release();
  }
};
