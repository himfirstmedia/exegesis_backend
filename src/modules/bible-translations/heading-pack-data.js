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
