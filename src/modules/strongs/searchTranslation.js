import { streamReaderTranslation } from '../reader-stream/service.js';
import { serializeBigInt } from '../../utils/helpers.js';
import { AppError } from '../../utils/AppError.js';

// Reuse the reader's complete prose traversal, canonical-value protection,
// provider validation and cache. A search page is published atomically rather
// than returning partially translated entries or English on provider failure.
export async function translateSearchPage(entries, language = 'en') {
  const prepare = value => {
    if (Array.isArray(value)) return value.map(prepare);
    if (!value || typeof value !== 'object') return value;
    const result = Object.fromEntries(Object.entries(value).map(([key, child]) => [key, prepare(child)]));
    if (typeof result.surfaceText === 'string') {
      const split = result.surfaceText.match(/^(.+?)\s+[—–-]\s+(.+)$/u);
      const latin = /^[\p{Script=Latin}\p{Script=Common}\p{M}\s]+$/u.test(result.surfaceText);
      result.surfaceTextGloss = split ? split[1] : latin ? result.surfaceText : '';
      result.surfaceTextOriginal = split ? split[2] : latin ? '' : result.surfaceText;
    }
    return result;
  };
  let current;
  let complete = false;
  let failure;
  await streamReaderTranslation({
    kind: 'strongs-search', source: { data: prepare(serializeBigInt(entries)) }, fields: ['data'], language,
    emit: async (event, frame) => {
      if (event === 'meta') current = frame.data;
      if (event === 'patch') {
        current = { ...current, ...frame.changes };
        for (const [key, text] of Object.entries(frame.append || {})) current[key] += text;
      }
      if (event === 'done') complete = frame.complete === true;
      if (event === 'error') failure = { code: frame.code, reason: frame.reason,
        field: frame.field, key: frame.key, completed: frame.completed };
    },
  });
  if (!complete) throw new AppError(503, 'Dictionary translation temporarily unavailable, please retry', failure);
  return current.data.map(entry => ({ ...entry, contentLanguage: language }));
}
