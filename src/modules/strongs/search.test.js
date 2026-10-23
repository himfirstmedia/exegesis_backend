jest.mock('../../config/db.js', () => ({ prisma: { strongsDictionary: { findMany: jest.fn(), count: jest.fn() } } }));
jest.mock('../../services/cacheService.js', () => ({ cache: {} }));
jest.mock('./translation.js', () => ({ translateStrongsData: jest.fn(), translateBibleTopics: jest.fn() }));
jest.mock('./searchTranslation.js', () => ({ translateSearchPage: jest.fn() }));
import { prisma } from '../../config/db.js';
import { translateSearchPage } from './searchTranslation.js';
import { searchStrongs } from './service.js';

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
