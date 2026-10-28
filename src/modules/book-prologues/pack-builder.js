import { cache } from '../../services/cacheService.js';
import { readHeadingPackObject, writeHeadingPackObject } from '../../services/objectStorage.js';
import { buildReaderPlan } from '../reader-stream/plan.js';
import { translateBatch } from '../text-to-text-translation/service.js';
import { protectUiText, translateUiSpans, abortable } from '../text-to-text-translation/ui-pack-translation.js';
import { validUiText } from '../text-to-text-translation/ui-pack-data.js';
import { localizeBookNames } from '../../utils/localizedBookNames.js';
import { overviewLanguages, overviewPackKey, overviewManifestKey, overviewBookKey,
  translatedOverviewFields, readOverviewSnapshot, completeOverviewPack, hashOverview, validTranslatedOverview } from './pack-data.js';

export function overviewFailureReason(error) {
  const message = typeof error?.message === 'string' ? error.message : '';
  if (message.startsWith('Incomplete overview translation')) return 'INCOMPLETE_TRANSLATION';
  if (message.startsWith('Prologues changed')) return 'SOURCE_CHANGED';
  if (message.startsWith('Another overview publisher')) return 'PUBLISHER_BUSY';
  if (message.includes('lease lost')) return 'LEASE_LOST';
  if (message.includes('interrupted')) return 'INTERRUPTED';
  return 'PROVIDER_OR_STORAGE_ERROR';
}

export async function buildOverviewPack(language, options = {}) {
  if (!overviewLanguages.includes(language)) throw new Error('Unsupported overview language');
  const snapshot = options.snapshot || await readOverviewSnapshot();
  // Global per-language lock, not per revision: stale builds cannot race newer publishers.
  const lock = await cache.acquireLock(`book-overview-pack:${language}`, 120);
  if (!lock.acquired) throw new Error('Another overview publisher owns this language');
  let owned = true;
  const heartbeat = lock.renew ? setInterval(() => {
    lock.renew().then(ok => { if (!ok) owned = false; }).catch(() => { owned = false; });
  }, 30000) : null;
  heartbeat?.unref();
  const check = () => {
    if (!owned) throw new Error('Overview publisher lease lost');
    if (options.signal?.aborted) throw new Error('Overview build interrupted; checkpoints retained');
  };
  const rawTranslate = options.translate || (async (texts, target) => {
    const result = await translateBatch({ q: texts, source: 'en', target, format: 'text' });
    return result.translations.map(item => item?.translatedText);
  });
  const translate = (texts, target) => { check(); return abortable(rawTranslate(texts, target), options.signal); };
  try {
    check();
    const key = overviewPackKey(snapshot.revision, language);
    let pack = await readHeadingPackObject(key);
    const reused = completeOverviewPack(pack, snapshot, language);
    if (!reused) {
      const books = {};
      for (const [bookName, source] of Object.entries(snapshot.books)) {
        check();
        const bookRevision = snapshot.bookRevisions[bookName];
        const bookKey = overviewBookKey(bookRevision, language);
        const saved = language === 'en' ? null : await readHeadingPackObject(bookKey);
        const plan = buildReaderPlan(source, translatedOverviewFields, [], { chunkCharacters: 1500 });
        if (saved?.complete === true && saved.revision === bookRevision && saved.language === language && validTranslatedOverview(saved.data, source)) {
          books[bookName] = saved.data;
        } else if (language === 'en') {
          books[bookName] = source;
        } else {
          const partialKey = overviewBookKey(bookRevision, language, true);
          const partial = await readHeadingPackObject(partialKey);
          const values = partial?.revision === bookRevision && partial.language === language && Array.isArray(partial.values) ? [...partial.values] : [];
          const valid = (index, value) => validUiText(plan.jobs[index].text, value) &&
            (value.trim() !== plan.jobs[index].text.trim() || ['author', 'keyPeople', 'dateWritten', 'locationWritten'].includes(plan.jobs[index].field) ||
              (language === 'fr' && ['Introduction', 'Application', 'Conclusion', 'Question', 'Questions'].includes(value.trim())));
          for (let start = 0; start < plan.jobs.length;) {
            check();
            const indexes = []; let characters = 0;
            while (start < plan.jobs.length && indexes.length < 20) {
              if (valid(start, values[start])) { start++; continue; }
              const job = plan.jobs[start];
              if (indexes.length && characters + job.text.length > 10000) break;
              indexes.push(start++); characters += job.text.length;
            }
            if (!indexes.length) continue;
            const texts = indexes.map(index => plan.jobs[index].text);
            const protectedTexts = texts.map(protectUiText);
            const results = await translate(protectedTexts.map(item => item.text), language);
            for (let i = 0; i < indexes.length; i++) {
              let value = protectedTexts[i].restore(results?.[i]);
              if (!value) {
                try { value = await translateUiSpans(texts[i], language, translate); }
                catch { /* Retain successful items; missing items fail validation below. */ }
              }
              value = localizeBookNames(value, language);
              if (valid(indexes[i], value)) values[indexes[i]] = value;
            }
            check();
            await writeHeadingPackObject(partialKey, { revision: bookRevision, language, values });
            options.onProgress?.({ language, bookName, completed: values.filter(Boolean).length, total: plan.jobs.length });
          }
          if (plan.jobs.some((_job, index) => !valid(index, values[index]))) throw new Error(`Incomplete overview translation: ${bookName} (${language}); checkpoint retained`);
          books[bookName] = { ...source, ...plan.render(values) };
          await writeHeadingPackObject(bookKey, { complete: true, revision: bookRevision, language, data: books[bookName] }, { compress: true });
        }
      }
      pack = { schemaVersion: 1, complete: true, revision: snapshot.revision, language,
        bookRevisions: snapshot.bookRevisions, missingBooks: snapshot.missingBooks, books, scripturePolicy: 'original-edition' };
      if (!completeOverviewPack(pack, snapshot, language)) throw new Error('Invalid overview pack');
      check();
      await writeHeadingPackObject(key, pack, { compress: true, cacheControl: 'public, max-age=31536000, immutable' });
    }
    // DB is the durable pending-work record. Never advertise an already-obsolete snapshot.
    check();
    if ((await readOverviewSnapshot()).revision !== snapshot.revision) throw new Error('Prologues changed during build; latest source will be retried');
    const manifest = { schemaVersion: 1, language, revision: snapshot.revision,
      bookCount: Object.keys(pack.books).length, missingBooks: pack.missingBooks,
      sha256: hashOverview(pack), bytes: Buffer.byteLength(JSON.stringify(pack)) };
    if (lock.renew && !(await lock.renew())) throw new Error('Overview publisher lease lost');
    check();
    await writeHeadingPackObject(overviewManifestKey(language), manifest, { cacheControl: 'no-store' });
    return { ...manifest, reused };
  } finally {
    if (heartbeat) clearInterval(heartbeat);
    await lock.release();
  }
}
