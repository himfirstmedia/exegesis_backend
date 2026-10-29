import { cache } from '../../services/cacheService.js';
import { readHeadingPackObject, writeHeadingPackObject } from '../../services/objectStorage.js';
import { buildReaderPlan } from '../reader-stream/plan.js';
import { translateBatch } from '../text-to-text-translation/service.js';
import { protectUiText, abortable } from '../text-to-text-translation/ui-pack-translation.js';
import { recoverOverviewTranslation } from './pack-recovery.js';
import { overviewTranslationIssue } from './pack-translation.js';
import { localizeBookNames } from '../../utils/localizedBookNames.js';
import { overviewLanguages, overviewPackKey, overviewManifestKey, overviewBookKey,
  translatedOverviewFields, readOverviewSnapshot, completeOverviewPack, hashOverview, validTranslatedOverview } from './pack-data.js';

export function overviewFailureReason(error) {
  if (error?.code === 'FREE_PROVIDER_COOLDOWN') return 'PROVIDER_COOLDOWN';
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
  const provider = options.translate?.forBuild ? options.translate.forBuild({ signal: options.signal }) : options.translate;
  const rawTranslate = provider || (async (texts, target) => {
    const result = await translateBatch({ q: texts, source: 'en', target, format: 'text' });
    return result.translations.map(item => item?.translatedText);
  });
  const translate = (texts, target) => { check(); return abortable(rawTranslate(texts, target), options.signal); };
  const retryTranslate = options.retryTranslate || provider?.retry || provider || (async (texts, target) => {
    const result = await translateBatch({ q: texts, source: 'en', target, format: 'text', requireChanged: true });
    return result.translations.map(item => item?.translatedText);
  });
  try {
    check();
    const key = overviewPackKey(snapshot.revision, language);
    let pack = await readHeadingPackObject(key);
    const reused = completeOverviewPack(pack, snapshot, language);
    if (!reused) {
      const books = {};
      const incompleteBooks = [];
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
          const rejections = new Map();
          const valid = (index, value) => overviewTranslationIssue(plan.jobs[index], value, source, language) === null;
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
              const value = localizeBookNames(protectedTexts[i].restore(results?.[i]), language);
              if (valid(indexes[i], value)) values[indexes[i]] = value;
              else rejections.set(indexes[i], overviewTranslationIssue(plan.jobs[indexes[i]], value, source, language));
            }
            check();
            await writeHeadingPackObject(partialKey, { revision: bookRevision, language, values });
            options.onProgress?.({ language, bookName, completed: plan.jobs.filter((_job, index) => valid(index, values[index])).length, total: plan.jobs.length });
          }
          for (let index = 0; index < plan.jobs.length; index++) {
            if (valid(index, values[index])) continue;
            const job = plan.jobs[index];
            const detail = { language, bookName, index, field: job.field, key: job.key };
            const value = await recoverOverviewTranslation(job, source, language, retryTranslate, {
              check, signal: options.signal, retryDelayMs: options.retryDelayMs,
              reason: rejections.get(index) || overviewTranslationIssue(job, values[index], source, language),
              onRetry: retry => options.onRetry?.({ ...detail, ...retry }),
              onFailure: failure => rejections.set(index, failure.reason),
            });
            check();
            if (valid(index, value)) {
              values[index] = value;
              await writeHeadingPackObject(partialKey, { revision: bookRevision, language, values });
              options.onProgress?.({ language, bookName, completed: plan.jobs.filter((_job, i) => valid(i, values[i])).length, total: plan.jobs.length });
            } else options.onWarning?.({ ...detail, reason: rejections.get(index) || overviewTranslationIssue(job, value, source, language) });
          }
          if (plan.jobs.some((_job, index) => !valid(index, values[index]))) {
            incompleteBooks.push(bookName);
            continue; // Finish/cache other books instead of failing at a new book on every rerun.
          }
          books[bookName] = { ...source, ...plan.render(values) };
          await writeHeadingPackObject(bookKey, { complete: true, revision: bookRevision, language, data: books[bookName] }, { compress: true });
        }
      }
      if (incompleteBooks.length) throw new Error(`Incomplete overview translation: ${incompleteBooks.join(', ')} (${language}); checkpoints retained`);
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
