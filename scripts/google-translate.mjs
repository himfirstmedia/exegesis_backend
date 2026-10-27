// Build-time Google Translate client for heading packs.
//
// Default mode is FREE: it uses the same endpoint that powers the Google
// Translate website widget (the method shown on w3schools), via
// clients5.google.com. It needs no API key and translates up to 128 headings per
// request, which is far faster than the old one-by-one provider fallbacks.
//
// Optional cloud mode (only if you explicitly configure it) uses the official
// Cloud Translation API and requires GOOGLE_TRANSLATE_API_KEY or a service
// account with the "Cloud Translation API User" role.
//
//   GOOGLE_TRANSLATE_MODE=free   (default)
//   GOOGLE_TRANSLATE_MODE=cloud  (paid, batched, most reliable)
//
// The Google Translate *widget* itself is browser-only, but its backing
// endpoint accepts normal HTTP requests from Node. We send batches as repeated
// `q` parameters and Google returns one translated string per input, in order.

import { GoogleAuth } from 'google-auth-library';

const FREE_URL = 'https://clients5.google.com/translate_a/t';
const CLOUD_URL = 'https://translation.googleapis.com/language/translate/v2';
const USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

// Google codes differ from the app's UI codes for a few languages.
const CLOUD_LANGUAGE_CODES = {
  fil: 'tl',
  mni: 'mni-Mtei',
  zh: 'zh-CN',
  'zh-Hans': 'zh-CN',
  'zh-Hant': 'zh-TW',
};
const FREE_LANGUAGE_CODES = {
  fil: 'tl',
  mni: 'mni-Mtei',
};
const MAX_ITEMS = 128;
const MAX_URL_LENGTH = 6000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const readPositiveInt = (name, fallback) => {
  const value = Number.parseInt(process.env[name], 10);
  return Number.isInteger(value) && value > 0 ? value : fallback;
};

const HTML_ENTITIES = { quot: '"', amp: '&', lt: '<', gt: '>', apos: "'", nbsp: '\u00a0' };
const decodeHtmlEntities = (value) =>
  typeof value === 'string'
    ? value.replace(/&(#x?[0-9a-fA-F]+|quot|amp|lt|gt|apos|nbsp);/g, (match, entity) => {
        if (entity[0] === '#') {
          const code = entity[1]?.toLowerCase() === 'x'
            ? Number.parseInt(entity.slice(2), 16)
            : Number.parseInt(entity.slice(1), 10);
          return Number.isFinite(code) ? String.fromCodePoint(code) : match;
        }
        return HTML_ENTITIES[entity] ?? match;
      })
    : value;

export const getGoogleTranslateMode = () => {
  const configured = (process.env.GOOGLE_TRANSLATE_MODE || '').trim().toLowerCase();
  if (configured === 'cloud' || configured === 'free') return configured;
  return (process.env.GOOGLE_TRANSLATE_API_KEY || '').trim() ? 'cloud' : 'free';
};

// Split strings into request-sized groups: count limit plus a URL-length cap
// (the free endpoint takes the text in the query string).
const chunkTexts = (texts) => {
  const groups = [];
  let group = [];
  let length = 0;
  for (const text of texts) {
    const cost = encodeURIComponent(text).length + 4;
    if (group.length && (group.length >= MAX_ITEMS || length + cost > MAX_URL_LENGTH)) {
      groups.push(group);
      group = [];
      length = 0;
    }
    group.push(text);
    length += cost;
  }
  if (group.length) groups.push(group);
  return groups;
};

const translateFree = async (texts, language, attempt = 1) => {
  const target = FREE_LANGUAGE_CODES[language] || language;
  const params = new URLSearchParams();
  params.set('client', 'dict-chrome-ex');
  params.set('sl', 'en');
  params.set('tl', target);
  for (const text of texts) params.append('q', text);

  let response;
  try {
    response = await fetch(`${FREE_URL}?${params}`, {
      headers: { 'User-Agent': USER_AGENT, Accept: '*/*' },
      signal: AbortSignal.timeout(60000),
    });
  } catch (error) {
    if (attempt < 5) {
      await sleep(Math.min(30000, 1000 * 2 ** (attempt - 1)));
      return translateFree(texts, language, attempt + 1);
    }
    throw new Error(`Google Translate request failed: ${error.message}`);
  }

  const raw = await response.text();
  if (!response.ok || /<html/i.test(raw)) {
    // 429/403 from the widget endpoint is a rate limit; back off and retry.
    if (attempt < 6) {
      await sleep(Math.min(60000, 1500 * 2 ** (attempt - 1)));
      return translateFree(texts, language, attempt + 1);
    }
    throw new Error(`Google Translate is rate limiting this network (HTTP ${response.status})`);
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    if (attempt < 6) {
      await sleep(Math.min(60000, 1500 * 2 ** (attempt - 1)));
      return translateFree(texts, language, attempt + 1);
    }
    throw new Error('Google Translate returned a non-JSON response');
  }

  const results = (Array.isArray(payload) ? payload : [payload])
    .map((item) => (Array.isArray(item) ? item.join('') : String(item ?? '')));
  if (results.length !== texts.length) {
    throw new Error(`Google Translate returned ${results.length} results for ${texts.length} inputs`);
  }
  return results;
};

let authClientPromise = null;
const getAccessToken = async () => {
  if (!authClientPromise) {
    const credentials = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
      : undefined;
    const auth = new GoogleAuth({
      ...(credentials ? { credentials } : {}),
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    authClientPromise = auth.getClient();
  }
  const client = await authClientPromise;
  const token = await client.getAccessToken();
  return typeof token === 'string' ? token : token?.token;
};

const translateCloud = async (texts, language, attempt = 1) => {
  const apiKey = (process.env.GOOGLE_TRANSLATE_API_KEY || '').trim();
  const url = (process.env.GOOGLE_TRANSLATE_URL || CLOUD_URL).replace(/\/$/, '');
  const headers = { 'Content-Type': 'application/json' };
  const endpoint = apiKey ? `${url}?key=${encodeURIComponent(apiKey)}` : url;
  if (!apiKey) headers.Authorization = `Bearer ${await getAccessToken()}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ q: texts, source: 'en', target: CLOUD_LANGUAGE_CODES[language] || language, format: 'text' }),
    signal: AbortSignal.timeout(60000),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload?.error?.message || `Google Translate request failed (${response.status})`;
    if ((response.status === 429 || response.status >= 500) && attempt < 6) {
      await sleep(Math.min(30000, 1000 * 2 ** (attempt - 1)));
      return translateCloud(texts, language, attempt + 1);
    }
    throw new Error(message);
  }
  const translations = payload?.data?.translations;
  if (!Array.isArray(translations) || translations.length !== texts.length) {
    throw new Error('Google Translate returned an incomplete batch');
  }
  return translations.map((item) => decodeHtmlEntities(String(item?.translatedText ?? '')));
};

/**
 * Translate English heading strings into `language`, returning an array that
 * matches `texts` position for position. Throws on failure so the builder stops
 * on an incomplete pack instead of publishing a partial one.
 */
export const translateWithGoogle = async (texts, language, onProgress = () => {}) => {
  const mode = getGoogleTranslateMode();
  const delay = readPositiveInt(
    mode === 'free' ? 'GOOGLE_TRANSLATE_FREE_DELAY_MS' : 'GOOGLE_TRANSLATE_CLOUD_DELAY_MS',
    mode === 'free' ? 400 : 0,
  );
  const results = [];
  for (const group of chunkTexts(texts)) {
    const translated = mode === 'cloud'
      ? await translateCloud(group, language)
      : await translateFree(group, language);
    for (const item of translated) results.push(item);
    onProgress(results.length, texts.length);
    if (delay) await sleep(delay);
  }
  return results;
};