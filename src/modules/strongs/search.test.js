jest.mock('../../config/db.js', () => ({ prisma: {
  strongsDictionary: { findMany: jest.fn(), count: jest.fn() },
  verseWord: { findMany: jest.fn() },
  studyWord: { findMany: jest.fn() },
  verseWordStudy: { findMany: jest.fn() },
  verseWordStudyEntry: { findMany: jest.fn() },
  verseResource: { findMany: jest.fn() },
} }));
jest.mock('../../services/cacheService.js', () => ({ cache: {} }));
jest.mock('./translation.js', () => ({ translateStrongsData: jest.fn(), translateBibleTopics: jest.fn() }));
jest.mock('./searchTranslation.js', () => ({ translateSearchPage: jest.fn() }));
import { prisma } from '../../config/db.js';
import { translateSearchPage } from './searchTranslation.js';
import { searchStrongs, getBookWords, getRandomWords } from './service.js';

beforeEach(() => {
  jest.resetAllMocks();
  prisma.studyWord.findMany.mockResolvedValue([]);
  prisma.verseWordStudy.findMany.mockResolvedValue([]);
  prisma.verseWordStudyEntry.findMany.mockResolvedValue([]);
  prisma.verseResource.findMany.mockResolvedValue([]);
  translateSearchPage.mockImplementation(async entries => entries);
});

it('caps search pages at two and preserves offset, total and the canonical language filter', async () => {
  prisma.strongsDictionary.findMany.mockResolvedValue([
    { strongsId: 'H3', verseExplanationWordStudies: [] },
    { strongsId: 'H4', verseExplanationWordStudies: [] },
  ]);
  prisma.strongsDictionary.count.mockResolvedValue(8);
  translateSearchPage.mockImplementation(async entries => entries.map(entry => ({ ...entry, contentLanguage: 'hi' })));
  const result = await searchStrongs('thanks', 50, 2, 'hi', 'Hebrew');
  expect(prisma.strongsDictionary.findMany).toHaveBeenCalledWith(expect.objectContaining({
    take: 2, skip: 2, where: expect.objectContaining({ language: { equals: 'Hebrew', mode: 'insensitive' } }),
  }));
  expect(result.data).toMatchObject({ total: 8, hasNext: true, contentLanguage: 'hi' });
  expect(translateSearchPage).toHaveBeenCalledWith(expect.arrayContaining([
    expect.not.objectContaining({ verseExplanationWordStudies: expect.anything() }),
  ]), 'hi');
});

it('caps Browse at four fully translated rows and advances using the requested offset', async () => {
  const ids = ['H5', 'H6', 'H7', 'H8'];
  prisma.strongsDictionary.count.mockResolvedValue(12);
  prisma.strongsDictionary.findMany.mockResolvedValue(ids.map(strongsId => ({ strongsId, verseExplanationWordStudies: [] })));
  translateSearchPage.mockImplementation(async entries => entries.map(entry => ({ ...entry, contentLanguage: 'hi' })));
  const result = await getBookWords('Psalms', 100, 4, 'hi');
  expect(prisma.strongsDictionary.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 4, skip: 4 }));
  expect(result.data).toMatchObject({ total: 12, hasNext: true, contentLanguage: 'hi' });
  expect(result.data.data).toHaveLength(4);
  expect(translateSearchPage).toHaveBeenCalledWith(expect.any(Array), 'hi');
});

it('keeps Browse totals and the language marker on an empty last page', async () => {
  prisma.strongsDictionary.findMany.mockResolvedValue([]);
  prisma.strongsDictionary.count.mockResolvedValue(1);
  const result = await getBookWords('Psalms', 4, 4, 'hi');
  expect(result.data).toEqual({ data: [], total: 1, hasNext: false, contentLanguage: 'hi' });
});

it('returns a shuffled random window without requiring a book filter', async () => {
  const ids = Array.from({ length: 12 }, (_, index) => `H${index + 1}`);
  prisma.strongsDictionary.count.mockResolvedValue(100);
  prisma.strongsDictionary.findMany.mockResolvedValue(ids.map(strongsId => ({ strongsId })));
  translateSearchPage.mockImplementation(async entries => entries.map(entry => ({ ...entry, contentLanguage: 'fr' })));
  const random = jest.spyOn(Math, 'random').mockReturnValue(0.5);
  const result = await getRandomWords(6, 'fr', 'Hebrew', 'preview');
  expect(prisma.strongsDictionary.findMany).toHaveBeenCalledWith(expect.objectContaining({
    skip: 32,
    take: 36,
    where: { language: { equals: 'hebrew', mode: 'insensitive' } },
  }));
  expect(result.data).toMatchObject({ total: 100, hasNext: true, contentLanguage: 'fr', nextOffset: null });
  expect(result.data.data).toHaveLength(6);
  expect(prisma.studyWord.findMany).toHaveBeenCalledWith(expect.objectContaining({
    where: expect.objectContaining({
      strongLinks: { some: { strongsId: { in: expect.arrayContaining(['H0001']) } } },
    }),
  }));
  expect(translateSearchPage).toHaveBeenCalledWith(expect.any(Array), 'fr');
  random.mockRestore();
});

it('keeps the web-authored word studies on the random Browse page', async () => {
  prisma.strongsDictionary.count.mockResolvedValue(1);
  prisma.strongsDictionary.findMany.mockResolvedValue([{ strongsId: 'H0935' }]);
  prisma.studyWord.findMany.mockResolvedValue([{
    surfaceText: 'Returned / Came',
    contextualMeaning: 'Coming or returning into a place',
    sortOrder: 0,
    strongLinks: [{ strongsId: 'H0935' }],
    study: {
      bibleEditionId: 'BSB',
      passage: { startChapter: 6, startVerse: 4, endChapter: 6, endVerse: 4, book: { name: 'Genesis' } },
      themes: [{ text: 'Return' }],
    },
  }]);
  translateSearchPage.mockImplementation(async entries => entries.map(entry => ({ ...entry, contentLanguage: 'en' })));
  const result = await getRandomWords(6, 'en', 'all', 'preview');
  expect(result.data.data[0]).toMatchObject({
    strongsId: 'H0935',
    hasDictionaryEntry: true,
    contextualStudyCount: 1,
    contextualStudies: [expect.objectContaining({
      surfaceText: 'Returned / Came',
      customDefinition: 'Coming or returning into a place',
    })],
  });
});

it('skips dictionary rows whose ids are outside the canonical Strong ranges', async () => {
  prisma.strongsDictionary.count.mockResolvedValue(3);
  prisma.strongsDictionary.findMany.mockResolvedValue([
    { strongsId: 'G24423' },
    { strongsId: 'H7225' },
    { strongsId: 'junk' },
  ]);
  translateSearchPage.mockImplementation(async entries => entries.map(entry => ({ ...entry, contentLanguage: 'en' })));
  const result = await getRandomWords(6, 'en', 'all', 'preview');
  expect(result.data.data.map(entry => entry.strongsId)).toEqual(['H7225']);
});

it('returns an empty random page without querying rows when the dictionary is empty', async () => {
  prisma.strongsDictionary.count.mockResolvedValue(0);
  const result = await getRandomWords(6, 'hi', 'all', 'preview');
  expect(prisma.strongsDictionary.findMany).not.toHaveBeenCalled();
  expect(result.data).toEqual({ data: [], total: 0, hasNext: false, contentLanguage: 'hi', nextOffset: null });
});
