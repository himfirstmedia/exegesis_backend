jest.mock('../bible/service.js', () => ({ getTodaysVerse: jest.fn(), getTodaysDevotion: jest.fn(),
  getTodaysExegesis: jest.fn(), getVerseExplanation: jest.fn(), getAllDailyExegesisPublic: jest.fn() }));
jest.mock('../book-prologues/service.js', () => ({ getBookPrologue: jest.fn(), getAllBookPrologues: jest.fn() }));
jest.mock('../verse-resources/service.js', () => ({ getVerseResources: jest.fn() }));
jest.mock('../strongs/service.js', () => ({ getStrongsEntry: jest.fn() }));
jest.mock('../bible-translations/service.js', () => ({ getBookHeadings: jest.fn() }));
jest.mock('../../config/db.js', () => ({ prisma: { dailyExegesis: { findFirst: jest.fn() } } }));
import * as bible from '../bible/service.js';
import * as books from '../book-prologues/service.js';
import * as resources from '../verse-resources/service.js';
import * as strongs from '../strongs/service.js';
import * as translations from '../bible-translations/service.js';
import { prisma } from '../../config/db.js';
import { loadReaderSource, loadBookIndex, loadExegesisIndex, splitSurfaceText } from './sources.js';

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
it('uses a numeric book ordinal so providers cannot misread hyphenated ordinals', async () => {
  books.getBookPrologue.mockResolvedValue({ status: 200, data: { bookName: 'Isaiah' } });
  const result = await loadReaderSource({ kind: 'book-overview', params: { bookName: 'Isaiah' } });
  expect(result.source.designation).toBe('The 23rd Book of the Bible');
});

it('streams every rich verse-action field, including nested Strongs data', async () => {
  bible.getVerseExplanation.mockResolvedValue({ status: 200, data: {
    id: '1', exegesis: { explanationText: 'Explanation' }, studyMetadata: { introduction: 'Intro' },
    wordStudies: [{ surfaceText: 'λόγος', strongs: { shortDefinition: 'word' } }],
    practicalApps: [{ applicationText: 'Apply' }], crossReferences: [{ commentary: 'Commentary' }],
    themes: [{ themeName: 'Grace' }], explanation: 'Legacy duplicate',
  } });
  const result = await loadReaderSource({ kind: 'verse-explanation', params: { bookName: 'John', chapter: 1, verseNumber: 1 } });
  expect(bible.getVerseExplanation).toHaveBeenCalledWith(expect.objectContaining({ lang: 'en' }));
  expect(result.fields).toEqual(['exegesis', 'studyMetadata', 'wordStudies', 'practicalApps', 'crossReferences', 'themes']);
});

it('splits an admin word gloss from its canonical original-language text', () => {
  expect(splitSurfaceText('Give Thanks — יָדָה (yadah)')).toEqual({
    gloss: 'Give Thanks', original: 'יָדָה (yadah)',
  });
  expect(splitSurfaceText('LORD')).toEqual({ gloss: 'LORD', original: '' });
  expect(splitSurfaceText('λόγος')).toEqual({ gloss: '', original: 'λόγος' });
});

it('streams an English gloss beside the canonical word-study text', async () => {
  bible.getVerseExplanation.mockResolvedValue({ status: 200, data: {
    id: '137', exegesis: { explanationText: 'Explanation' },
    wordStudies: [{
      surfaceText: 'Give Thanks — יָדָה (yadah)',
      strongs: { shortDefinition: 'to give thanks',
        verseReferences: [{ surfaceText: 'LORD', bookName: 'Psalms' }] },
    }],
  } });
  const result = await loadReaderSource({
    kind: 'verse-explanation',
    params: { bookName: 'Psalms', chapter: 1, verseNumber: 3 },
  });
  expect(result.source.wordStudies[0]).toMatchObject({
    surfaceText: 'Give Thanks — יָדָה (yadah)',
    surfaceTextGloss: 'Give Thanks',
    surfaceTextOriginal: 'יָדָה (yadah)',
    strongs: { verseReferences: [{ surfaceText: 'LORD', surfaceTextGloss: 'LORD', surfaceTextOriginal: '', bookName: 'Psalms' }] },
  });
});

it('loads a Strongs entry by canonical id in English and streams grammar fields', async () => {
  strongs.getStrongsEntry.mockResolvedValue({ status: 200, data: {
    id: 9n, strongsId: 'H3068', shortDefinition: 'LORD', partOfSpeech: 'noun',
    gender: 'masculine', number: 'singular',
    contextualStudies: [{ customDefinition: 'A study' }],
    verseReferences: [{ bookName: 'Psalms', chapter: 1, verse: 3, surfaceText: 'LORD' }],
  } });
  const result = await loadReaderSource({ kind: 'strongs-entry', params: { strongsId: 'h3068' } });
  expect(strongs.getStrongsEntry).toHaveBeenCalledWith('H3068', 'en');
  expect(result.source.id).toBe(9);
  expect(result.fields).toContain('shortDefinition');
  expect(result.fields).toContain('contextualStudies');
  expect(result.fields).toEqual(expect.arrayContaining([
    'partOfSpeech', 'grammaticalCase', 'gender', 'number',
  ]));
  expect(result.source.verseReferences[0]).toMatchObject({
    surfaceText: 'LORD', surfaceTextGloss: 'LORD', surfaceTextOriginal: '',
  });
});

it('loads chapter headings as reader content', async () => {
  translations.getBookHeadings.mockResolvedValue({ status: 200, data: {
    bookName: 'Psalms', chapters: { 1: [{ verse: 1, heading: 'The Two Paths' }] },
  } });
  const result = await loadReaderSource({
    kind: 'book-headings', params: { bookName: 'Psalms' },
  });
  expect(translations.getBookHeadings).toHaveBeenCalledWith({ bookName: 'Psalms' });
  expect(result.source).toEqual({
    bookName: 'Psalms', chapters: { 1: [{ verse: 1, heading: 'The Two Paths' }] },
  });
  expect(result.fields).toEqual(['chapters']);
  expect(result.atomicFields).toEqual(['heading']);
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
