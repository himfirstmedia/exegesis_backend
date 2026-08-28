import {
  normalizeTranslationId,
  getTranslationDisplayName,
  getVerse,
  getAllTranslations,
  getCatalog,
} from './service.js';

describe('normalizeTranslationId', () => {
  test('resolves the NKJV alias to the canonical NKJ id', () => {
    expect(normalizeTranslationId('NKJV')).toBe('NKJ');
  });

  test('resolves BSB to Berean', () => {
    expect(normalizeTranslationId('BSB')).toBe('Berean');
  });

  test('resolves case variants (darby → Darby)', () => {
    expect(normalizeTranslationId('darby')).toBe('Darby');
    expect(normalizeTranslationId('KJV')).toBe('KJV');
    expect(normalizeTranslationId('kjv')).toBe('KJV');
  });

  test('resolves full display names (New King James Version → NKJ)', () => {
    expect(normalizeTranslationId('New King James Version')).toBe('NKJ');
  });

  test('resolves full XML file names (EnglishKJBible → KJV)', () => {
    expect(normalizeTranslationId('EnglishKJBible')).toBe('KJV');
  });

  test('trims surrounding whitespace', () => {
    expect(normalizeTranslationId('  NKJV  ')).toBe('NKJ');
  });

  test('returns unknown ids untouched so callers surface Translation not found', () => {
    expect(normalizeTranslationId('WEB')).toBe('WEB');
    expect(normalizeTranslationId('WEBSTER')).toBe('WEBSTER');
  });
});

describe('catalog presentation', () => {
  test('uses recognizable names, abbreviations, and language-free display filenames', () => {
    const catalog = getCatalog();
    const kjv = catalog.find((entry) => entry.id === 'KJV');
    const berean = catalog.find((entry) => entry.id === 'Berean');

    expect(kjv).toMatchObject({
      name: 'King James Version (KJV)',
      abbreviation: 'KJV',
      fileName: 'KJV.xml',
    });
    expect(berean).toMatchObject({
      name: 'Berean Standard Bible (BSB)',
      abbreviation: 'BSB',
      fileName: 'BSB.xml',
    });
  });
});

describe('getTranslationDisplayName', () => {
  test('returns the proper name for aliased ids', () => {
    expect(getTranslationDisplayName('NKJV')).toBe('New King James Version');
    expect(getTranslationDisplayName('BSB')).toBe('Berean Standard Bible');
    expect(getTranslationDisplayName('KJV')).toBe('King James Version');
  });

  test('falls back to the raw id for unknown translations', () => {
    expect(getTranslationDisplayName('WEBSTER')).toBe('WEBSTER');
  });
});

describe('getVerse (real XML files)', () => {
  test('fetches a verse with the aliased NKJV id', async () => {
    const verse = await getVerse('NKJV', 'Genesis', 1, 1);
    expect(verse.bookName).toBe('Genesis');
    expect(verse.chapterNumber).toBe(1);
    expect(verse.verseNumber).toBe(1);
    expect(verse.text.length).toBeGreaterThan(0);
  });

  test('fetches a verse with the canonical NKJ id', async () => {
    const verse = await getVerse('NKJ', 'John', 3, 16);
    expect(verse.text.length).toBeGreaterThan(0);
  });

  test('fetches a verse with lowercase id (case-insensitive)', async () => {
    const verse = await getVerse('kjv', 'Psalms', 23, 1);
    expect(verse.text.length).toBeGreaterThan(0);
  });

  test('throws Translation not found for a translation with no XML file', async () => {
    await expect(getVerse('WEB', 'Genesis', 1, 1)).rejects.toThrow(
      'Translation not found',
    );
    await expect(getVerse('WEBSTER', 'Genesis', 1, 1)).rejects.toThrow(
      'Translation not found',
    );
  });
});

describe('getAllTranslations', () => {
  test('lists bundled translations with canonical ids', async () => {
    const list = await getAllTranslations();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(10);
    expect(list.some((t) => t.id === 'NKJ')).toBe(true);
  });
});
