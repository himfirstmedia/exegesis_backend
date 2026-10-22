import path from 'node:path';
import { discoverBibles, findLanguagePrefix } from './discovery.js';

// __dirname is provided by jest's CJS transform (or via the import.meta.url
// babel plugin). Fall back to process.cwd() for safety.
const MODULE_DIR = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
const XML_DIR = path.join(MODULE_DIR, 'Holy-Bible-XML-Format');

describe('discoverBibles', () => {
  test('keeps the lean curated free-translation catalog', () => {
    const entries = discoverBibles(XML_DIR);
    expect(entries.length).toBe(44);
    expect(entries.length).toBeGreaterThan(10);
    expect(entries.map((entry) => entry.shortId)).toEqual(
      expect.arrayContaining([
        'Berean',
        'KJV',
        'ASV',
        'Tyndale',
        'French',
        'Arabic',
        'Spanish',
        'Urdu',
        'GreekModern1904',
        'Tamil2017',
        'Telugu',
        'MarathiIRVMAR',
        'Gujarati2017',
        'KannadaIRV',
        'MalayalamBCS',
        'PunjabiIRV',
        'Nepali2012',
        // Indian-language Bibles added from the Holy-Bible-XML-Format corpus
        'Assamese',
        'Dogri',
        'Konkani',
        'Maithili',
        'Meitei',
        'OdiaIRV2017',
        'SanskritDevanagari',
        'SantaliCommon',
        'SindhiMuslim',
      ]),
    );
  });

  test('the catalogue contains no copyrighted English translations', () => {
    const entries = discoverBibles(XML_DIR);
    const englishIds = entries
      .filter((entry) => entry.language === 'en')
      .map((entry) => entry.shortId);

    // The New King James Version, God's Word, EASY and The Living Bible are
    // all under a publisher's copyright; they were replaced by free texts.
    expect(englishIds).not.toContain('NKJ');
    expect(englishIds).not.toContain('GW');
    expect(englishIds).not.toContain('EASY');
    expect(englishIds).not.toContain('TL');
    expect(englishIds).toEqual(
      expect.arrayContaining(['Berean', 'KJV', 'ASV', 'YLT', 'Darby', 'Tyndale']),
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
    ['ArabicSVDBible.xml', 'ar', 'Arabic'],
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

  test('ChineseTraditionalBible.xml is included with language "zh"', () => {
    const entries = discoverBibles(XML_DIR);
    const chinese = entries.find((e) => e.fileName === 'ChineseTraditionalBible.xml');
    expect(chinese).toBeDefined();
    expect(chinese.language).toBe('zh');
    expect(chinese.shortId).toBe('ChineseSimplified');
  });

  test.each([
    ['UrduIRVURDBible.xml', 'Urdu', 'ur'],
    ['GreekModern1904Bible.xml', 'GreekModern1904', 'el'],
    ['TamilIRVBible.xml', 'Tamil2017', 'ta'],
    ['TeluguBible.xml', 'Telugu', 'te'],
    ['MarathiIRVMARBible.xml', 'MarathiIRVMAR', 'mr'],
    ['Gujarati2017Bible.xml', 'Gujarati2017', 'gu'],
    ['KannadaIRVBible.xml', 'KannadaIRV', 'kn'],
    ['MalayalamBCSBible.xml', 'MalayalamBCS', 'ml'],
    ['PunjabiIRVBible.xml', 'PunjabiIRV', 'pa'],
    ['Nepali2012Bible.xml', 'Nepali2012', 'ne'],
  ])('%s is available with stable ID %s', (fileName, shortId, language) => {
    const entries = discoverBibles(XML_DIR);
    const entry = entries.find((candidate) => candidate.fileName === fileName);
    expect(entry).toMatchObject({ shortId, language });
  });

  test.each([
    ['AssameseBible.xml', 'Assamese', 'as', 'Assamese'],
    ['DogriBible.xml', 'Dogri', 'doi', 'Dogri'],
    ['KonkaniBible.xml', 'Konkani', 'kok', 'Konkani'],
    ['MaithiliBible.xml', 'Maithili', 'mai', 'Maithili'],
    ['MeiteiBible.xml', 'Meitei', 'mni', 'Meitei (Manipuri)'],
    ['OdiaIRV2017Bible.xml', 'OdiaIRV2017', 'or', 'Odia'],
    ['SanskritDevanagariBible.xml', 'SanskritDevanagari', 'sa', 'Sanskrit'],
    ['SantaliCommonBible.xml', 'SantaliCommon', 'sat', 'Santali'],
    ['SindhiMuslimBible.xml', 'SindhiMuslim', 'sd', 'Sindhi'],
  ])('%s → %s / %s / "%s"', (fileName, shortId, language, languageName) => {
    const entries = discoverBibles(XML_DIR);
    const entry = entries.find((candidate) => candidate.fileName === fileName);
    expect(entry).toMatchObject({ shortId, language, languageName });
  });
});
