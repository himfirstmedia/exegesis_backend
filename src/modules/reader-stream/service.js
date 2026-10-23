import { buildReaderPlan } from './plan.js';
import { translateText } from '../text-to-text-translation/service.js';
import { cache } from '../../services/cacheService.js';

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
  const key = `v1:${kind}:${scope || ''}:${language}:${plan.sourceVersion}`;
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
    const { result, error } = await abortable(inflight.get(index), signal);
    inflight.delete(index);
    checkAbort(signal);
    const text = result?.translatedText?.trim();
    const reportedTarget = result?.targetLanguage || result?.target;
    const sameAllowed = (['author', 'keyPeople'].includes(plan.jobs[index].field) && plan.jobs[index].text.length <= 60 && !/[.!?]/.test(plan.jobs[index].text)) ||
      (language === 'fr' && ['Introduction', 'Application', 'Conclusion', 'Question', 'Questions'].includes(plan.jobs[index].text.trim()));
    if (error || !text || (reportedTarget && reportedTarget.toLowerCase() !== language.toLowerCase()) ||
      (!sameAllowed && text === plan.jobs[index].text.trim())) {
      await emit('error', { ...common, code: 'TRANSLATION_FAILED', completed: index, pendingFields: pendingFields(index) });
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
