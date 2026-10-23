import { buildReaderPlan } from './plan.js';
import { translateText } from '../text-to-text-translation/service.js';
import { cache } from '../../services/cacheService.js';
import { localizeBookNames } from '../../utils/localizedBookNames.js';
import { isGrammarCognate } from './grammar.js';

export const MAX_READER_CHARACTERS = 100_000;
export const MAX_READER_CHUNKS = 600;

const abortError = () => Object.assign(new Error('Reader stream cancelled'), { name: 'AbortError' });
const checkAbort = signal => { if (signal?.aborted) throw abortError(); };
export function abortable(promise, signal) {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(abortError());
  return new Promise((resolve, reject) => {
    const abort = () => { cleanup(); reject(abortError()); };
    const cleanup = () => signal.removeEventListener('abort', abort);
    signal.addEventListener('abort', abort, { once: true });
    promise.then(value => { cleanup(); resolve(value); }, error => { cleanup(); reject(error); });
  });
}

/** One ordered stream; provider calls/cache stay entirely on the server. */
export async function streamReaderTranslation({ source, fields, atomicFields, availableScopes,
  kind, scope, language, signal, emit, reserveCharacters = () => {}, translate = translateText }) {
  const plan = buildReaderPlan(source, fields, atomicFields);
  const characters = plan.jobs.reduce((sum, job) => sum + job.text.length, 0);
  if (characters > MAX_READER_CHARACTERS || plan.jobs.length > MAX_READER_CHUNKS) {
    throw Object.assign(new Error('Reader document is too large'), { status: 413 });
  }
  // Bumped whenever post-translation normalization changes so cached documents
  // cannot keep serving older prose (for example untranslated book names).
  const key = `v2:${kind}:${scope || ''}:${language}:${plan.sourceVersion}`;
  const cached = await cache.get('reader-stream', key).catch(() => null);
  checkAbort(signal);
  const pendingFields = completed => [...new Set(plan.jobs.slice(completed).map(job => job.field))];
  const stamp = (data, incomplete, failed = false) => ({ ...data, contentLanguage: language,
    localizationMode: 'server-stream', localizationIncomplete: incomplete, localizationFailed: failed });
  const common = { version: 1, language, sourceVersion: plan.sourceVersion, total: plan.jobs.length, availableScopes, fields: plan.fields };
  if (cached?.complete === true && cached.language === language) {
    await emit('meta', { ...common, data: stamp(cached.data, false), completed: plan.jobs.length, pendingFields: [], cached: true });
    await emit('done', { ...common, complete: true, completed: plan.jobs.length, pendingFields: [] });
    return;
  }
  await reserveCharacters(language === 'en' ? 0 : characters);
  checkAbort(signal);
  if (language === 'en') {
    const data = Object.fromEntries([...new Set([...Object.keys(plan.render([])), ...fields])]
      .filter(field => source[field] != null).map(field => [field, source[field]]));
    await emit('meta', { ...common, data: stamp(data, false), completed: plan.jobs.length, pendingFields: [] });
    await emit('done', { ...common, complete: true, completed: plan.jobs.length, pendingFields: [] });
    return;
  }
  let current = plan.render([]);
  await emit('meta', { ...common, data: stamp(current, plan.jobs.length > 0), completed: 0, pendingFields: pendingFields(0) });
  const values = [];
  // At most two chunks of bounded look-ahead, but publish strictly in order.
  const inflight = new Map();
  const start = index => {
    if (index >= plan.jobs.length || inflight.has(index) || signal?.aborted) return;
    const text = plan.jobs[index].text;
    // Consume rejections immediately: a later look-ahead request may fail first.
    inflight.set(index, Promise.resolve().then(() => {
      checkAbort(signal);
      return translate({ q: text, source: 'en', target: language, format: 'text' });
    }).then(result => ({ result }), error => ({ error })));
  };
  start(0); start(1);
  for (let index = 0; index < plan.jobs.length; index += 1) {
    checkAbort(signal);
    let { result, error } = await abortable(inflight.get(index), signal);
    inflight.delete(index);
    checkAbort(signal);
    let translated = result?.translatedText;
    // Providers routinely leave proper book names in English. Normalize them
    // after translation, before validation/cache/emit, so every reader kind
    // (explanations, background, Strong's, Lab, headings) stays consistent.
    let text = localizeBookNames(translated, language)?.trim();
    let reportedTarget = result?.targetLanguage || result?.target;
    const job = plan.jobs[index];
    const shortCanonical = job.text.length <= 60 && !/[.!?]/.test(job.text);
    // Cognates and proper nouns legitimately survive translation unchanged
    // (e.g. French "propitiation"); prose never does.
    const sameAllowed = isGrammarCognate(job.key, job.text, language) ||
      (['author', 'keyPeople', 'dateWritten', 'locationWritten'].includes(job.field) && shortCanonical) ||
      (shortCanonical && (job.key === 'term' || job.key === 'shortDefinition' ||
        (job.key === 'label' && job.field === 'studyTools') ||
        (job.key === 'translation' && job.field === 'interlinearWords'))) ||
      (language === 'fr' && ['Introduction', 'Application', 'Conclusion', 'Question', 'Questions'].includes(job.text.trim()));
    // A provider can report success while echoing a short word such as "In"
    // or "adverb". Retry once through the existing provider fallback chain,
    // bypassing permissive cached echoes, rather than failing every page retry.
    if (!error && !sameAllowed && translated?.trim() === job.text.trim()) {
      try {
        result = await abortable(translate({ q: job.text, source: 'en', target: language,
          format: 'text', requireChanged: true }), signal);
        checkAbort(signal);
        translated = result?.translatedText;
        text = localizeBookNames(translated, language)?.trim();
        reportedTarget = result?.targetLanguage || result?.target;
      } catch (failure) {
        if (failure.name === 'AbortError') throw failure;
        error = failure;
      }
    }
    if (error || !text || (reportedTarget && reportedTarget.toLowerCase() !== language.toLowerCase()) ||
      (!sameAllowed && translated?.trim() === job.text.trim())) {
      // Safe diagnostics identify the field/reason without publishing source
      // prose or upstream error messages (which can contain provider secrets).
      const reason = error ? 'PROVIDER_ERROR' : !text ? 'EMPTY_TRANSLATION'
        : reportedTarget && reportedTarget.toLowerCase() !== language.toLowerCase()
          ? 'TARGET_MISMATCH' : 'UNCHANGED_SOURCE';
      await emit('error', { ...common, code: 'TRANSLATION_FAILED', reason,
        field: job.field, key: job.key, completed: index, pendingFields: pendingFields(index) });
      return; // Never certify source fallbacks or skip a missing chunk.
    }
    values.push(text);
    const next = plan.render(values);
    const changes = {}; const append = {};
    for (const field of plan.fields) {
      if (JSON.stringify(next[field]) === JSON.stringify(current[field])) continue;
      if (typeof next[field] === 'string' && typeof current[field] === 'string' && next[field].startsWith(current[field])) {
        append[field] = next[field].slice(current[field].length);
      } else changes[field] = next[field];
    }
    current = next;
    await emit('patch', { ...common, changes, append, completed: index + 1, pendingFields: pendingFields(index + 1) });
    start(index + 2);
  }
  checkAbort(signal);
  await cache.set('reader-stream', key, { complete: true, language, data: current }, 7 * 86400).catch(() => {});
  checkAbort(signal);
  await emit('done', { ...common, complete: true, completed: plan.jobs.length, pendingFields: [] });
}
