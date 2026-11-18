jest.mock('../../config/db.js', () => ({ prisma: {
  studyWord: { findMany: jest.fn() },
  verseWordStudy: { findMany: jest.fn() },
  verseWordStudyEntry: { findMany: jest.fn() },
  verseResource: { findMany: jest.fn() },
} }));
import { prisma } from '../../config/db.js';
import { getEditorialReferences, withEditorialReferences, editionKey } from './editorialWords.js';

beforeEach(() => {
  jest.resetAllMocks();
  prisma.studyWord.findMany.mockResolvedValue([]);
  prisma.verseWordStudy.findMany.mockResolvedValue([]);
  prisma.verseWordStudyEntry.findMany.mockResolvedValue([]);
  prisma.verseResource.findMany.mockResolvedValue([]);
});

it('reads standalone links, normalized explanations and legacy resource words without a corpus mapping', async () => {
  prisma.verseWordStudy.findMany.mockResolvedValue([{ strongsId: 'H7225', bookName: 'Genesis', chapter: 1, verse: 1, translation: 'BSB', adminExplanation: 'standalone' }]);
  prisma.verseWordStudyEntry.findMany.mockResolvedValue([{ strongsId: 'H7225', sortOrder: 1, customDefinition: 'context', explanation: { bookName: 'Genesis', chapter: 1n, verseNumber: 1n, bibleVersion: 'Berean', themes: [{ themeName: 'Creation' }] } }]);
  prisma.verseResource.findMany.mockResolvedValue([{ bookName: 'Genesis', chapter: 1n, verseStart: 1n, wordStudies: JSON.stringify([{ strongs: 'H7225', word: 'beginning', meaning: 'legacy' }, { strongs: 'H0430', meaning: 'God' }]) }]);
  const refs = await getEditorialReferences({ bookName: 'Genesis' });
  const [entry] = withEditorialReferences([{ strongsId: 'H7225', shortDefinition: 'general' }], refs);
  expect(entry.shortDefinition).toBe('general');
  expect(entry.verseCount).toBe(1);
  expect(entry.verseReferences[0].adminExplanation).toBe('context');
  expect(entry.contextualStudies[0]).toMatchObject({ customDefinition: 'context', themes: ['Creation'] });
  expect(editionKey('Berean')).toBe(editionKey('BSB'));
});

it('filters source queries to the requested passage and rejects an unrelated legacy ID', async () => {
  prisma.verseResource.findMany.mockResolvedValue([{ bookName: 'John', chapter: 1, verseStart: 1, wordStudies: '[{"strongs":"G0026","meaning":"love"}]' }]);
  expect(await getEditorialReferences({ bookName: 'John', chapter: 1, verse: 1, strongsId: 'G3056' })).toEqual([]);
  expect(prisma.verseWordStudyEntry.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { strongsId: 'G3056', explanation: { bookName: 'John', chapter: 1, verseNumber: 1 } } }));
});

it('keeps different verses/editions separate and drops removed links rather than stale JSON', () => {
  const entry = { strongsId: 'G3056', verseReferences: [{ bookName: 'John', chapter: 9, verse: 1 }] };
  expect(withEditorialReferences([entry], [])[0]).toMatchObject({ verseReferences: [], verseCount: 0 });
  const refs = ['BSB', 'KJV'].map(translation => ({ strongsId: 'G3056', bookName: 'John', chapter: 1, verse: 1, translation }));
  expect(withEditorialReferences([entry], refs)[0].verseCount).toBe(2);
});

it('prefers canonical shared-study words over their legacy copies', async () => {
  prisma.studyWord.findMany.mockResolvedValue([{
    surfaceText: 'beginning', contextualMeaning: 'shared context', sortOrder: 0,
    strongLinks: [{ strongsId: 'H7225' }],
    study: { bibleEditionId: 'BSB', passage: { startChapter: 1, startVerse: 1, book: { name: 'Genesis' } }, themes: [{ text: 'Creation' }] },
  }]);
  prisma.verseWordStudyEntry.findMany.mockResolvedValue([{
    strongsId: 'H7225', sortOrder: 1, customDefinition: 'legacy context',
    explanation: { bookName: 'Genesis', chapter: 1n, verseNumber: 1n, bibleVersion: 'Berean', themes: [] },
  }]);
  const refs = await getEditorialReferences({ bookName: 'Genesis', chapter: 1, verse: 1 });
  const [entry] = withEditorialReferences([{ strongsId: 'H7225' }], refs);
  expect(entry.verseReferences).toHaveLength(1);
  expect(entry.verseReferences[0].adminExplanation).toBe('shared context');
  expect(entry.contextualStudies[0]).toMatchObject({ customDefinition: 'shared context', themes: ['Creation'] });
});

it('ignores malformed legacy JSON safely', async () => {
  prisma.verseResource.findMany.mockResolvedValue([{ wordStudies: '{broken' }]);
  expect(await getEditorialReferences({ bookName: 'John' })).toEqual([]);
});
