import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { headingLanguages } from '../bible-translations/heading-pack-data.js';

const dir = (() => { try { return path.dirname(fileURLToPath(import.meta.url)); } catch { return __dirname; } })();
export const uiSource = JSON.parse(fs.readFileSync(path.join(dir, 'ui-pack-source.json'), 'utf8'));
export const uiLanguages = headingLanguages;
export const uiPackKeys = (language, revision = uiSource.revision) => {
  const key = `ui-packs/app-${revision}/${language}`;
  return { final: `${key}.json`, partial: `${key}-partial.json`, manifest: `${key}-manifest.json` };
};
// Per-language carry record. It pairs the source strings that were published
// with their translations, so a new source revision can reuse unchanged copy
// (and only translate added or edited strings) instead of rebuilding the pack.
export const uiCarryKey = language => `ui-packs/carry/${language}.json`;
const tokens = text => (text.match(/\{\{?\w+\}?\}|%\d*\$?[sd]|<\/?\w+>/g) || []).sort();
export const validUiText = (source, value) => typeof value === 'string' && !!value.trim() &&
  JSON.stringify(tokens(source)) === JSON.stringify(tokens(value));
// Source strings are only reused when the exact text matches, so a reordered or
// edited catalogue cannot pin the wrong translation onto a string.
export const uiTranslationMap = carry => {
  const map = new Map();
  if (!Array.isArray(carry?.texts) || !Array.isArray(carry.translations)) return map;
  carry.texts.forEach((text, index) => {
    const value = carry.translations[index];
    if (!map.has(text) && validUiText(text, value)) map.set(text, value);
  });
  return map;
};
export const completeUiPack = (pack, language) => pack?.schemaVersion === 1 &&
  pack.language === language && pack.revision === uiSource.revision &&
  Array.isArray(pack.translations) && pack.translations.length === uiSource.texts.length &&
  uiSource.texts.every((text, i) => validUiText(text, pack.translations[i]));
