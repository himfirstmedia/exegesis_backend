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
const tokens = text => (text.match(/\{\{?\w+\}?\}|%\d*\$?[sd]|<\/?\w+>/g) || []).sort();
export const validUiText = (source, value) => typeof value === 'string' && !!value.trim() &&
  JSON.stringify(tokens(source)) === JSON.stringify(tokens(value));
export const completeUiPack = (pack, language) => pack?.schemaVersion === 1 &&
  pack.language === language && pack.revision === uiSource.revision &&
  Array.isArray(pack.translations) && pack.translations.length === uiSource.texts.length &&
  uiSource.texts.every((text, i) => validUiText(text, pack.translations[i]));
