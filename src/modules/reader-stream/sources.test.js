jest.mock('../bible/service.js', () => ({ getTodaysVerse: jest.fn(), getTodaysDevotion: jest.fn(),
  getTodaysExegesis: jest.fn(), getVerseExplanation: jest.fn(), getAllDailyExegesisPublic: jest.fn() }));
jest.mock('../book-prologues/service.js', () => ({ getBookPrologue: jest.fn(), getAllBookPrologues: jest.fn() }));
jest.mock('../verse-resources/service.js', () => ({ getVerseResources: jest.fn() }));
jest.mock('../../config/db.js', () => ({ prisma: { dailyExegesis: { findFirst: jest.fn() } } }));
import * as bible from '../bible/service.js';
import * as books from '../book-prologues/service.js';
import * as resources from '../verse-resources/service.js';
import { prisma } from '../../config/db.js';
import { loadReaderSource, loadBookIndex, loadExegesisIndex } from './sources.js';

beforeEach(() => jest.resetAllMocks());
it.each([
  ['daily-verse', 'getTodaysVerse'], ['daily-devotion', 'getTodaysDevotion'], ['daily-exegesis', 'getTodaysExegesis'],
  ['verse-explanation', 'getVerseExplanation'],
])('loads %s source internally in English, never a pretranslated article', async (kind, method) => {
  bible[method].mockResolvedValue({ status: 200, data: { id: '1', title: 'Source title' } });
  await loadReaderSource({ kind, params: { bookName: 'Genesis', chapter: 1, verseNumber: 1 } });
  expect(bible[method]).toHaveBeenCalledWith(expect.objectContaining({ lang: 'en' }));
});
it('keeps exegesis ID lookup restricted to published records', async () => {
  prisma.dailyExegesis.findFirst.mockResolvedValue({ id: 7n, title: 'Published title' });
  const result = await loadReaderSource({ kind: 'daily-exegesis', params: { id: '7' } });
  expect(prisma.dailyExegesis.findFirst).toHaveBeenCalledWith({ where: { id: 7n, isPublished: true } });
  expect(result.source.id).toBe(7);
});
it('selects only the requested resource scope and returns availability without English content', async () => {
  resources.getVerseResources.mockResolvedValue({ status: 200, data: { commentaries: [{ text: 'Commentary' }], dictionaryTerms: [{ definition: 'Definition' }] } });
  const result = await loadReaderSource({ kind: 'verse-resources', scope: 'dictionary', params: { bookName: 'Genesis', chapter: 1, verseNumber: 1 } });
  expect(result.fields).toEqual(['dictionaryTerms', 'studyTools']);
  expect(result.availableScopes).toEqual(['commentaries', 'dictionary']);
});
it('returns metadata-only library and series indexes', async () => {
  books.getAllBookPrologues.mockResolvedValue({ status: 200, data: { data: [{ id: '1', bookName: 'Genesis', summary: 'English summary' }], total: 1 } });
  bible.getAllDailyExegesisPublic.mockResolvedValue({ status: 200, data: { content: [{ id: '1', passageReference: 'Genesis 1:1', teachingBody: 'English teaching' }], totalElements: 1 } });
  expect((await loadBookIndex({ lang: 'fr' })).data.data).toEqual([{ id: '1', bookName: 'Genesis' }]);
  expect((await loadBookIndex({ lang: 'en' })).data.data[0]).toMatchObject({
    id: '1', bookName: 'Genesis', keyTheme: 'English summary', contentLanguage: 'en',
  });
  expect((await loadExegesisIndex({})).data.content[0].teachingBody).toBeUndefined();
});
