import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import { BIBLE_BOOK_NAMES } from '../bible/bookNames.js';

const moduleDir = (() => {
  try { return path.dirname(fileURLToPath(import.meta.url)); } catch { return __dirname; }
})();
export const headingSource = JSON.parse(fs.readFileSync(path.join(moduleDir, 'data/chapter-headings.json'), 'utf8'));
export const HEADING_PACK_REVISION = createHash('sha256').update(`v1:${JSON.stringify(headingSource)}`).digest('hex').slice(0, 12);
export const headingLanguages = Object.keys(BIBLE_BOOK_NAMES);
export const headingPackKeys = (language, revision = HEADING_PACK_REVISION) => {
  const base = `heading-packs/bsb-${revision}/${language}`;
  return { final: `${base}.json`, partial: `${base}-partial.json`, manifest: `${base}-manifest.json` };
};
// Per-language carry record. It pairs every published source heading with its
// translation so a new source revision reuses unchanged headings and only sends
// added or edited ones to the provider.
export const headingCarryKey = language => `heading-packs/carry/${language}.json`;
export const validHeadingTranslation = value => typeof value === 'string' && !!value.trim();
// Every translatable heading in the published source order.
export const headingTexts = () => Object.values(headingSource).flatMap(chapters =>
  Object.values(chapters).flatMap(headings => headings.map(item => item.heading)));
// Translations read back from a complete pack, aligned with headingTexts().
export const headingTranslationList = pack => Object.entries(headingSource).flatMap(([book, chapters]) =>
  Object.entries(chapters).flatMap(([chapter, headings]) =>
    headings.map((_item, index) => pack?.books?.[book]?.[chapter]?.[index]?.heading)));
export const headingTranslationMap = carry => {
  const map = new Map();
  if (!Array.isArray(carry?.texts) || !Array.isArray(carry.translations)) return map;
  carry.texts.forEach((text, index) => {
    const value = carry.translations[index];
    if (!map.has(text) && typeof text === 'string' && text.trim() && validHeadingTranslation(value)) map.set(text, value);
  });
  return map;
};
export const makeHeadingPack = (language, books) => ({ headingSet: 'bsb', revision: HEADING_PACK_REVISION, language, books });

export const isCompleteHeadingBook = (book, chapters) =>
  Boolean(chapters) && Object.entries(headingSource[book]).every(([chapter, headings]) => {
    const list = chapters[chapter];
    return Array.isArray(list) && list.length === headings.length && list.every((item, index) =>
      item?.verse === headings[index].verse && typeof item.heading === 'string' && item.heading.trim());
  });

export const isCompleteHeadingPack = (pack, language) =>
  pack?.headingSet === 'bsb' && pack.revision === HEADING_PACK_REVISION && pack.language === language &&
  Object.keys(headingSource).every(book => isCompleteHeadingBook(book, pack.books?.[book]));
