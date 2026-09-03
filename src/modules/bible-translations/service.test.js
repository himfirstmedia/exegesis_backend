import {
  normalizeTranslationId,
  getTranslationDisplayName,
  getVerse,
  getVerses,
  getVersesBatch,
  getBooksWithMaxChapters,
  getChapters,
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

describe('fast XML reader paths', () => {
  test('returns a complete chapter with the existing response contract', async () => {
    const chapter = await getVerses('French', 'Genesis', 1);
    expect(chapter).toMatchObject({
      bookNumber: 1,
      bookName: 'Genesis',
      chapterNumber: 1,
    });
    expect(chapter.verses).toHaveLength(31);
    expect(chapter.verses[0].verseNumber).toBe(1);
    expect(typeof chapter.verses[0].text).toBe('string');
  });

  test('decodes XML entities when parsing a chapter fragment', async () => {
    const verse = await getVerse('French', 'Leviticus', 27, 3);
    expect(typeof verse.text).toBe('string');
    expect(verse.text).not.toContain('&amp;');
  });

  test('derives books and chapter counts without a full XML parse', async () => {
    const books = await getBooksWithMaxChapters('French');
    const genesis = books.find((book) => book.bookName === 'Genesis');
    expect(books).toHaveLength(66);
    expect(genesis).toMatchObject({
      bookNumber: 1,
      chaptersCount: 50,
      maxChapter: 50,
    });

    const chapters = await getChapters('French', 'Genesis');
    expect(chapters.chapters).toHaveLength(50);
    expect(chapters.chapters[0]).toEqual({
      chapterNumber: 1,
      versesCount: 31,
    });
  });

  test('batch reads reuse chapter extraction and preserve missing chapters', async () => {
    const chapters = await getVersesBatch('French', 'Genesis', [1, 999]);
    expect(chapters[0].verses).toHaveLength(31);
    expect(chapters[1]).toEqual({
      bookName: 'Genesis',
      chapterNumber: 999,
      verses: [],
    });
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
