jest.mock('../../config/db.js', () => ({ prisma: {
  strongsDictionary: { findMany: jest.fn(), count: jest.fn() },
  verseWord: { findMany: jest.fn() },
} }));
jest.mock('../../services/cacheService.js', () => ({ cache: {} }));
jest.mock('./translation.js', () => ({ translateStrongsData: jest.fn(), translateBibleTopics: jest.fn() }));
jest.mock('./searchTranslation.js', () => ({ translateSearchPage: jest.fn() }));
import { prisma } from '../../config/db.js';
import { translateSearchPage } from './searchTranslation.js';
import { searchStrongs, getBookWords } from './service.js';

beforeEach(() => jest.resetAllMocks());

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
  prisma.verseWord.findMany.mockResolvedValueOnce(ids.map(strongsId => ({ strongsId })))
    .mockResolvedValueOnce(Array.from({ length: 12 }, (_, i) => ({ strongsId: `H${i + 1}` })));
  prisma.strongsDictionary.findMany.mockResolvedValue(ids.map(strongsId => ({ strongsId, verseExplanationWordStudies: [] })));
  translateSearchPage.mockImplementation(async entries => entries.map(entry => ({ ...entry, contentLanguage: 'hi' })));
  const result = await getBookWords('Psalms', 100, 4, 'hi');
  expect(prisma.verseWord.findMany).toHaveBeenNthCalledWith(1, expect.objectContaining({ take: 4, skip: 4 }));
  expect(result.data).toMatchObject({ total: 12, hasNext: true, contentLanguage: 'hi' });
  expect(result.data.data).toHaveLength(4);
  expect(translateSearchPage).toHaveBeenCalledWith(expect.any(Array), 'hi');
});

it('keeps Browse totals and the language marker on an empty last page', async () => {
  prisma.verseWord.findMany.mockResolvedValueOnce([])
    .mockResolvedValueOnce([{ strongsId: 'H1' }]);
  const result = await getBookWords('Psalms', 4, 4, 'hi');
  expect(result.data).toEqual({ data: [], total: 1, hasNext: false, contentLanguage: 'hi' });
});
