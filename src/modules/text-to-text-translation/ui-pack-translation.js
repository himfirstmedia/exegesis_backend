// Build-time token protection; never alter interpolation contracts to accept bad output.
import { validUiText } from './ui-pack-data.js';

const tokenPattern = () => /\{\{?\w+\}?\}|%\d*\$?[sd]|<\/?\w+>/g;
export function protectUiText(text) {
  const tokens = [];
  const protectedText = text.replace(tokenPattern(), token => {
    tokens.push(token);
    return `ZXQPH${tokens.length - 1}QXZ`;
  });
  return {
    text: protectedText,
    restore(value) {
      if (typeof value !== 'string') return null;
      const occurrences = Array(tokens.length).fill(0);
      const restored = value.replace(/ZXQ\s*PH\s*(\d+)\s*QXZ/gi, (marker, rawIndex) => {
        const index = Number(rawIndex);
        if (index >= tokens.length) return marker;
        occurrences[index]++;
        return tokens[index];
      });
      return occurrences.every(count => count === 1) && !/ZXQ\s*PH/i.test(restored) && validUiText(text, restored) ? restored : null;
    },
  };
}

/** Last-resort translation of literal spans. Original tokens never reach the provider. */
export async function translateUiSpans(text, language, translate) {
  const parts = text.split(/(\{\{?\w+\}?\}|%\d*\$?[sd]|<\/?\w+>)/g);
  const indexes = parts.flatMap((part, index) => index % 2 === 0 && /[A-Za-z]/.test(part) ? [index] : []);
  if (!indexes.length) return text;
  // Bound fallback batches too, including unusually token-dense templates.
  for (let start = 0; start < indexes.length; start += 50) {
    const group = indexes.slice(start, start + 50);
    const values = await translate(group.map(index => parts[index].trim()), language);
    if (!Array.isArray(values) || values.length !== group.length) throw new Error('Provider returned an incomplete literal-span batch');
    group.forEach((index, i) => {
      if (typeof values[i] !== 'string' || !values[i].trim()) throw new Error('Provider returned an empty literal span');
      const original = parts[index];
      parts[index] = `${original.match(/^\s*/)[0]}${values[i].trim()}${original.match(/\s*$/)[0]}`;
    });
  }
  const result = parts.join('');
  if (!validUiText(text, result)) throw new Error('Provider introduced unexpected placeholders into literal text');
  return result;
}

export function abortable(promise, signal) {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(new Error('Build interrupted; checkpoint retained'));
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(new Error('Build interrupted; checkpoint retained'));
    signal.addEventListener('abort', onAbort, { once: true });
    Promise.resolve(promise).then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
  });
}
