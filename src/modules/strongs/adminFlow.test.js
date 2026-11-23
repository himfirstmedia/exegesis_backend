jest.mock('../../config/db.js', () => ({ prisma: {
  strongsDictionary: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), findMany: jest.fn(), count: jest.fn() },
  studyWord: { findMany: jest.fn() },
  verseWordStudy: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  verseWordStudyEntry: { findMany: jest.fn() }, verseResource: { findMany: jest.fn() },
  verseWord: { findMany: jest.fn() }, searchIndex: { findMany: jest.fn() },
} }));
jest.mock('./translation.js', () => ({ translateStrongsData: jest.fn(async data => data), translateBibleTopics: jest.fn(async data => data) }));
jest.mock('./searchTranslation.js', () => ({ translateSearchPage: jest.fn(async data => data) }));
import { prisma } from '../../config/db.js';
import { adminUpdateEntry, adminDeleteEntry, upsertVerseWordStudy, deleteVerseWordStudy, getBookWords, getStrongsEntry, getVerseUniqueWords, searchStrongs } from './service.js';
import { adminUpdateEntrySchema, adminUpsertVerseWordStudySchema } from './validation.js';
import router from './route.js';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware.js';

beforeEach(() => {
  jest.clearAllMocks();
  for (const table of ['studyWord', 'verseWordStudy', 'verseWordStudyEntry', 'verseResource', 'verseWord', 'searchIndex']) prisma[table].findMany.mockResolvedValue([]);
  prisma.strongsDictionary.findUnique.mockResolvedValue(null);
  prisma.strongsDictionary.findMany.mockResolvedValue([]);
  prisma.strongsDictionary.count.mockResolvedValue(0);
});

it('creates a complete Hebrew entry with normalized ID and preserves grammar/pronunciation fields', async () => {
  prisma.strongsDictionary.create.mockImplementation(async ({ data }) => data);
  const response = await adminUpdateEntry('h430', { shortDefinition: 'God', pronunciation: 'el-o-heem', gender: 'masculine' });
  expect(response.data).toMatchObject({ strongsId: 'H0430', language: 'hebrew', pronunciation: 'el-o-heem', gender: 'masculine' });
});

it('rejects empty definitions and incorrect language rather than publishing a placeholder', async () => {
  expect((await adminUpdateEntry('G26', {})).status).toBe(400);
  expect((await adminUpdateEntry('G26', { shortDefinition: 'love', language: 'hebrew' })).status).toBe(400);
  expect(prisma.strongsDictionary.create).not.toHaveBeenCalled();
});

it('updates only supplied dictionary fields', async () => {
  prisma.strongsDictionary.findUnique.mockResolvedValue({ strongsId: 'G0026' });
  await adminUpdateEntry('G26', { adminExplanation: 'new note' });
  expect(prisma.strongsDictionary.update).toHaveBeenCalledWith({ where: { strongsId: 'G0026' }, data: { adminExplanation: 'new note', language: 'greek' } });
});

it('keeps attached dictionary entries and allows deletion only for unused entries', async () => {
  prisma.strongsDictionary.findUnique.mockResolvedValue({ _count: { verseWords: 1 } });
  expect((await adminDeleteEntry('G26')).status).toBe(409);
  expect(prisma.strongsDictionary.delete).not.toHaveBeenCalled();
  prisma.strongsDictionary.findUnique.mockResolvedValue({ _count: { verseWords: 0 } });
  expect((await adminDeleteEntry('G26')).status).toBe(200);
  expect(prisma.strongsDictionary.delete).toHaveBeenCalledWith({ where: { strongsId: 'G0026' } });
});

it('refuses to attach a missing dictionary entry', async () => {
  const response = await upsertVerseWordStudy({ strongsId: 'H1', bookName: 'Genesis', chapter: 1, verse: 1 });
  expect(response.status).toBe(400);
  expect(prisma.verseWordStudy.create).not.toHaveBeenCalled();
});

it('creates/updates an attachment without changing general definitions', async () => {
  prisma.strongsDictionary.findUnique.mockResolvedValue({ strongsId: 'H7225' });
  prisma.verseWordStudy.findUnique.mockResolvedValue(null);
  prisma.verseWordStudy.create.mockImplementation(async ({ data }) => data);
  const input = { strongsId: 'H7225', bookName: 'Genesis', chapter: 1, verse: 1, translation: 'Berean', adminExplanation: 'in the beginning', createdBy: 'editor' };
  const response = await upsertVerseWordStudy(input);
  expect(response.data).toMatchObject({ translation: 'BSB', createdBy: 'editor', adminExplanation: 'in the beginning' });
  expect(prisma.strongsDictionary.update).toHaveBeenCalledWith(expect.objectContaining({ data: { verseReferences: null } }));
  prisma.verseWordStudy.findUnique.mockResolvedValue({ id: 12n });
  await upsertVerseWordStudy({ ...input, adminExplanation: 'updated' });
  expect(prisma.verseWordStudy.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 12n }, data: expect.objectContaining({ adminExplanation: 'updated', updatedBy: 'editor' }) }));
});

it('does not delete a missing attachment or its dictionary entry', async () => {
  prisma.verseWordStudy.findUnique.mockResolvedValue(null);
  expect((await deleteVerseWordStudy(99)).status).toBe(404);
  expect(prisma.verseWordStudy.delete).not.toHaveBeenCalled();
  expect(prisma.strongsDictionary.delete).not.toHaveBeenCalled();
});

it('joins a padded dictionary word to its study and paginates study-only words with it', async () => {
  prisma.verseWordStudy.findMany.mockResolvedValue([{ strongsId: 'G0026', bookName: 'John', chapter: 3, verse: 16, translation: 'BSB', adminExplanation: 'love here' }]);
  prisma.studyWord.findMany.mockResolvedValue([{
    surfaceText: 'love', contextualMeaning: 'another love', strongLinks: [{ strongsId: 'G25' }],
    study: { bibleEditionId: 'BSB', passage: { startChapter: 13, startVerse: 34, book: { name: 'John' } }, themes: [] },
  }]);
  prisma.strongsDictionary.findMany.mockResolvedValue([{ strongsId: 'G0026', shortDefinition: 'love' }]);
  const first = await getBookWords('John', 1, 0, 'en', 'Greek');
  const second = await getBookWords('John', 1, 1, 'en', 'Greek');
  const args = prisma.strongsDictionary.findMany.mock.calls[0][0];
  expect(args.where.language).toEqual({ equals: 'greek', mode: 'insensitive' });
  expect(args.where.OR[1].strongsId.in).toEqual(expect.arrayContaining(['G0025', 'G25', 'G0026', 'G26']));
  expect(first.data).toMatchObject({ total: 2, hasNext: true, contentLanguage: 'en', data: [{
    strongsId: 'G25', hasDictionaryEntry: false, shortDefinition: '',
    contextualStudies: [{ customDefinition: 'another love', reference: { bookName: 'John', verseNumber: 34 } }],
  }] });
  expect(second.data).toMatchObject({ total: 2, hasNext: false, data: [{
    strongsId: 'G0026', hasDictionaryEntry: true, shortDefinition: 'love',
    contextualStudies: [{ customDefinition: 'love here' }],
  }] });
});

it('opens and finds a study-only ID without inventing a dictionary definition', async () => {
  prisma.studyWord.findMany.mockResolvedValue([{
    surfaceText: 'sons', contextualMeaning: 'Gad’s descendants', strongLinks: [{ strongsId: 'H1121' }],
    study: { bibleEditionId: 'BSB', passage: { startChapter: 1, startVerse: 24, book: { name: 'Numbers' } }, themes: [] },
  }]);
  const detail = await getStrongsEntry('H1121', 'en');
  expect(detail.data).toMatchObject({ strongsId: 'H1121', shortDefinition: '', hasDictionaryEntry: false,
    contextualStudies: [{ customDefinition: 'Gad’s descendants', reference: { bookName: 'Numbers', verseNumber: 24 } }],
  });
  const search = await searchStrongs('h1121', 2, 0, 'en', 'Hebrew');
  expect(search.data).toMatchObject({ total: 1, hasNext: false, data: [detail.data] });
  expect((await searchStrongs('H1121', 2, 0, 'en', 'Greek')).data.total).toBe(0);
});

it('loads current detail attachments and includes editorial-only words in Study Verse', async () => {
  const word = { strongsId: 'G0026', shortDefinition: 'love', verseExplanationWordStudies: [] };
  prisma.strongsDictionary.findUnique.mockResolvedValue(word);
  prisma.strongsDictionary.findMany.mockResolvedValue([word]);
  prisma.verseWordStudy.findMany.mockResolvedValue([{ strongsId: 'G0026', bookName: 'John', chapter: 3, verse: 16, translation: 'BSB', adminExplanation: 'first' }]);
  expect((await getStrongsEntry('G26', 'en')).data.verseReferences[0].adminExplanation).toBe('first');
  prisma.verseWordStudy.findMany.mockResolvedValue([{ strongsId: 'G0026', bookName: 'John', chapter: 3, verse: 16, translation: 'BSB', adminExplanation: 'edited' }]);
  expect((await getStrongsEntry('G26', 'en')).data.verseReferences[0].adminExplanation).toBe('edited');
  expect((await getVerseUniqueWords('John', 3, 16, 'Berean', 0, 50, 'en')).data.data[0].strongsId).toBe('G0026');
});

it('validates Strong’s IDs and canonical passage inputs', () => {
  expect(adminUpdateEntrySchema.safeParse({ strongsId: 'not-an-id' }).success).toBe(false);
  expect(adminUpsertVerseWordStudySchema.safeParse({ strongsId: 'H1', bookName: 'Fake book', chapter: 1, verse: 1 }).success).toBe(false);
  expect(adminUpsertVerseWordStudySchema.safeParse({ strongsId: 'H1', bookName: 'Genesis', chapter: 0, verse: 1 }).success).toBe(false);
});

it('protects every admin route and rejects member/guest writes', async () => {
  for (const layer of router.stack.filter(layer => layer.route?.path.startsWith('/admin/'))) {
    expect(layer.route.stack[0].handle).toBe(authenticate);
    expect(layer.route.stack[1].handle).toBe(requireAdmin);
  }
  for (const user of [undefined, { userRole: 2 }]) {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    await requireAdmin({ user }, res, next);
    expect(res.status).toHaveBeenCalledWith(403); expect(next).not.toHaveBeenCalled();
  }
  const next = jest.fn(); await requireAdmin({ user: { userRole: 1 } }, {}, next);
  expect(next).toHaveBeenCalled();
});
