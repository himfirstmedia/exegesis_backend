import { AppError } from '../utils/AppError.js';

// Unofficial, keyless endpoint: best-effort only. Never fall through to a paid
// Cloud API. Keep provider priority and concurrency in the translation service.
const URL = 'https://clients5.google.com/translate_a/t';
const aliases = { fil: 'tl', mni: 'mni-Mtei', 'zh-Hans': 'zh-CN', 'zh-Hant': 'zh-TW', 'sd-arab': 'sd' };
let blockedUntil = 0;
export const resetGoogleFreeCooldown = () => { blockedUntil = 0; };
export const canUseGoogleFree = (options) =>
  (process.env.GOOGLE_FREE_TRANSLATE_ENABLE ?? 'true').trim().toLowerCase() === 'true' &&
  options?.format !== 'html';

export const translateGoogleFree = async (texts, { source = 'auto', target, requireChanged = false }) => {
  if (Date.now() < blockedUntil) throw new AppError(503, 'Free Google translation is temporarily rate limited');
  const results = [];
  let offset = 0;
  while (offset < texts.length) {
    const params = new URLSearchParams({ client: 'dict-chrome-ex', sl: aliases[source] || source, tl: aliases[target] || target });
    const group = [];
    let length = 200;
    while (offset < texts.length && group.length < 100) {
      const text = texts[offset];
      const cost = encodeURIComponent(text).length + 4;
      if (cost > 5500) throw new AppError(400, 'Text exceeds free translation request limit');
      if (group.length && length + cost > 5500) break;
      length += cost;
      group.push(text);
      params.append('q', text);
      offset++;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`${URL}?${params}`, { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!response.ok) {
        if (response.status === 429 || response.status === 403) blockedUntil = Date.now() + 60000;
        throw new AppError(502, `Free Google translation failed (HTTP ${response.status})`);
      }
      const values = await response.json();
      if (!Array.isArray(values) || values.length !== group.length ||
        values.some((text, index) => typeof text !== 'string' || !text.trim() ||
          (requireChanged && text.trim() === group[index].trim()))) {
        throw new AppError(502, 'Free Google translation returned incomplete or untranslated text');
      }
      results.push(...values);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(502, error?.name === 'AbortError'
        ? 'Free Google translation timed out' : 'Free Google translation is unavailable');
    } finally {
      clearTimeout(timeout);
    }
  }
  return results;
};
