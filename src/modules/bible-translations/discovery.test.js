import path from 'node:path';
import { discoverBibles, findLanguagePrefix } from './discovery.js';

// __dirname is provided by jest's CJS transform (or via the import.meta.url
// babel plugin). Fall back to process.cwd() for safety.
const MODULE_DIR = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
const XML_DIR = path.join(MODULE_DIR, 'Holy-Bible-XML-Format');

describe('discoverBibles', () => {
  test('keeps the lean curated free-translation catalog', () => {
    const entries = discoverBibles(XML_DIR);
    expect(entries.length).toBeLessThan(40);
    expect(entries.length).toBeGreaterThan(10);
    expect(entries.map((entry) => entry.shortId)).toEqual(
      expect.arrayContaining(['Berean', 'KJV', 'ASV', 'French', 'Arabic', 'Spanish']),
    );
  });

  test('every entry has all required fields', () => {
    const entries = discoverBibles(XML_DIR);
    expect(entries.length).toBeGreaterThan(0);
    for (const e of entries) {
      expect(typeof e.fileId).toBe('string');
      expect(e.fileId.length).toBeGreaterThan(0);
      expect(typeof e.shortId).toBe('string');
      expect(e.shortId.length).toBeGreaterThan(0);
      expect(typeof e.prefix).toBe('string');
      expect(typeof e.language).toBe('string');
      expect(e.language.length).toBeGreaterThan(0);
      expect(typeof e.languageName).toBe('string');
      expect(e.languageName.length).toBeGreaterThan(0);
      expect(typeof e.fileName).toBe('string');
      expect(e.fileName.endsWith('.xml')).toBe(true);
      expect(typeof e.filePath).toBe('string');
      expect(typeof e.fileSize).toBe('number');
      expect(e.fileSize).toBeGreaterThan(0);
    }
  });

  test('SwahiliBible.xml → shortId "Swahili", language "sw"', () => {
    const entries = discoverBibles(XML_DIR);
    const swahili = entries.find((e) => e.fileName === 'SwahiliBible.xml');
    expect(swahili).toBeDefined();
    expect(swahili.shortId).toBe('Swahili');
    expect(swahili.language).toBe('sw');
    expect(swahili.languageName).toBe('Swahili');
  });

  test('EnglishKJBible.xml → language "en" (shortId preserved as "KJV")', () => {
    const entries = discoverBibles(XML_DIR);
    const kjv = entries.find((e) => e.fileName === 'EnglishKJBible.xml');
    expect(kjv).toBeDefined();
    expect(kjv.language).toBe('en');
    expect(kjv.shortId).toBe('KJV');
  });

  test.each([
    ['FrenchBible.xml', 'fr', 'French'],
    ['ArabicBible.xml', 'ar', 'Arabic'],
    ['SpanishBible.xml', 'es', 'Spanish'],
  ])('%s is classified under its actual language', (fileName, code, name) => {
    const entries = discoverBibles(XML_DIR);
    const entry = entries.find((candidate) => candidate.fileName === fileName);
    expect(entry).toMatchObject({ language: code, languageName: name });
  });

  test('every XML filename has an explicit language-prefix mapping', () => {
    const entries = discoverBibles(XML_DIR);
    const unmapped = entries.filter((entry) => {
      const base = entry.fileId.replace(/Bible$/, '');
      return !findLanguagePrefix(base);
    });

    expect(unmapped.map((entry) => entry.fileName)).toEqual([]);
  });

  test('only explicitly English-prefixed files appear in the English group', () => {
    const entries = discoverBibles(XML_DIR);
    const misplaced = entries.filter(
      (entry) => entry.language === 'en' && !entry.fileName.startsWith('English'),
    );

    expect(misplaced.map((entry) => entry.fileName)).toEqual([]);
  });

  test('every language code has one consistent filter label', () => {
    const entries = discoverBibles(XML_DIR);
    const labelsByCode = new Map();
    for (const entry of entries) {
      const labels = labelsByCode.get(entry.language) || new Set();
      labels.add(entry.languageName);
      labelsByCode.set(entry.language, labels);
    }
    const inconsistent = Array.from(labelsByCode.entries())
      .filter(([, labels]) => labels.size !== 1)
      .map(([code, labels]) => [code, Array.from(labels)]);

    expect(inconsistent).toEqual([]);
  });

  test('ChineseSimplifiedBible.xml is included with language "zh"', () => {
    const entries = discoverBibles(XML_DIR);
    const chinese = entries.find((e) => e.fileName === 'ChineseSimplifiedBible.xml');
    expect(chinese).toBeDefined();
    expect(chinese.language).toBe('zh');
    expect(chinese.shortId).toBe('ChineseSimplified');
  });
});
