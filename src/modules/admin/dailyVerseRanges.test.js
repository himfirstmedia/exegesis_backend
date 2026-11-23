jest.mock('stripe', () => ({ __esModule: true, default: jest.fn().mockImplementation(() => ({})) }));
jest.mock('../../config/db.js', () => ({ prisma: {
  dailyVerse: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn() },
  dailyDevotion: { findFirst: jest.fn() },
  $transaction: jest.fn(),
} }));
jest.mock('../../services/cacheService.js', () => ({ cache: { del: jest.fn().mockResolvedValue(undefined), set: jest.fn().mockResolvedValue(undefined) } }));
jest.mock('../../utils/emailTemplates.js', () => ({ __esModule: true, default: {} }));
jest.mock('../bible-translations/service.js', () => ({ getVerse: jest.fn() }));
jest.mock('../shared-study/client.js', () => ({
  sharedStudyReaders: jest.fn(),
  writeDailyContent: jest.fn(),
}));
jest.mock('../shared-study/repository.js', () => ({
  SharedStudyError: class SharedStudyError extends Error {
    constructor(message, issues = [], status = 409) {
      super(message);
      this.status = status;
      this.issues = issues;
    }
  },
  writeStudy: jest.fn().mockResolvedValue(null),
  hydrateStudies: jest.requireActual('../shared-study/repository.js').hydrateStudies,
}));

const { prisma } = require('../../config/db.js');
const { cache } = require('../../services/cacheService.js');
const { getVerse } = require('../bible-translations/service.js');
const { addDailyVerse, addDailyDevotion, checkDailyVerseDate } = require('./service.js');
const { addVerseExplanation, fetchVerseTextWithFallback, getVerseExplanationForEdit } = require('../bible/service.js');
const { validVerseRange, verseEndData } = require('../../utils/verseRange.js');

beforeEach(() => {
  jest.clearAllMocks();
  prisma.dailyVerse.create.mockImplementation(async ({ data }) => ({ id: 1n, ...data }));
  prisma.dailyVerse.update.mockImplementation(async ({ data }) => ({ id: 1n, ...data }));
  prisma.dailyVerse.findUnique.mockResolvedValue(null);
  prisma.dailyVerse.findFirst.mockResolvedValue(null);
  getVerse.mockImplementation(async (_version, _book, _chapter, verse) => ({ text: `Verse ${verse}` }));
});

const verse = { bookName: 'Genesis', chapter: 3, verseNumber: 6, verseEnd: 10, displayDate: '2026-11-18', explanation: 'Explanation' };

test.each([undefined, 9])('daily verse create/edit preserves range (id: %s)', async id => {
  const result = await addDailyVerse({ ...verse, id }, 'admin-1');
  expect(result.status).toBe(200);
  expect(Number(result.data.verseEnd)).toBe(10);
  expect((id ? prisma.dailyVerse.update : prisma.dailyVerse.create)).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ verseNumber: 6n, verseEnd: 10n }) }));
});

test('daily verse create/edit writes directly to prisma without touching shared study', async () => {
  await addDailyVerse({ ...verse, id: 9 }, 'admin-1');
  expect(prisma.dailyVerse.update).toHaveBeenCalled();
  // shared-study layer must not be involved
  const { writeStudy } = require('../shared-study/repository.js');
  expect(writeStudy).not.toHaveBeenCalled();
});

test('rejects a daily verse when another verse already occupies the date', async () => {
  prisma.dailyVerse.findFirst.mockResolvedValueOnce({
    id: 42n, displayDate: new Date('2026-11-18T00:00:00Z'),
    bookName: 'John', chapter: 3n, verseNumber: 16n,
  });
  const result = await addDailyVerse(verse, 'admin-1');
  expect(result.status).toBe(409);
  expect(result.data.conflicts[0]).toMatchObject({
    type: 'date',
    existing: { id: 42, bookName: 'John', chapter: 3, verseNumber: 16 },
  });
  expect(prisma.dailyVerse.create).not.toHaveBeenCalled();
});

test('editing a verse excludes its own id from the date-conflict check', async () => {
  const result = await addDailyVerse({ ...verse, id: 9 }, 'admin-1');
  expect(result.status).toBe(200);
  expect(prisma.dailyVerse.findFirst).toHaveBeenCalledWith(expect.objectContaining({
    where: expect.objectContaining({ id: { not: 9n } }),
  }));
});

test('editing a verse without moving its date skips the conflict check', async () => {
  prisma.dailyVerse.findUnique.mockResolvedValueOnce({
    id: 9n, displayDate: new Date('2026-11-18T00:00:00Z'),
    bookName: 'Genesis', chapter: 3n, verseNumber: 6n,
  });
  const result = await addDailyVerse({ ...verse, id: 9 }, 'admin-1');
  expect(result.status).toBe(200);
  expect(prisma.dailyVerse.findFirst).not.toHaveBeenCalled();
});

test('preflight date check returns the existing verse for a taken date', async () => {
  prisma.dailyVerse.findFirst.mockResolvedValueOnce({
    id: 42n, displayDate: new Date('2026-11-18T00:00:00Z'),
    bookName: 'John', chapter: 3n, verseNumber: 16n,
  });
  const result = await checkDailyVerseDate({ date: '2026-11-18', excludeId: 9 });
  expect(result.status).toBe(200);
  expect(result.data.existing).toMatchObject({
    id: 42, bookName: 'John', chapter: 3, verseNumber: 16,
  });
  expect(prisma.dailyVerse.findFirst).toHaveBeenCalledWith(expect.objectContaining({
    where: expect.objectContaining({ id: { not: 9n } }),
  }));
});

test('preflight date check reports a free date', async () => {
  const result = await checkDailyVerseDate({ date: '2026-11-18' });
  expect(result.status).toBe(200);
  expect(result.data.existing).toBeNull();
});

test('rejects a daily devotion when another devotion already occupies the date', async () => {
  prisma.dailyDevotion.findFirst.mockResolvedValueOnce({
    id: 4n, displayDate: new Date('2026-11-18T00:00:00Z'),
    title: 'Existing devotion', content: 'Body',
  });
  const result = await addDailyDevotion({
    title: 'New devotion', explanation: 'New body', reflectionQuestions: ['Question?'], prayer: 'Amen',
    practicalApplications: ['Act'], learningPoints: ['One', 'Two', 'Three'], displayDate: '2026-11-18',
  }, 'admin-1');
  expect(result.status).toBe(409);
  expect(result.data.conflicts[0]).toMatchObject({
    type: 'date', existing: { id: 4, title: 'Existing devotion' },
  });
  const { writeDailyContent } = require('../shared-study/client.js');
  expect(writeDailyContent).not.toHaveBeenCalled();
});

test('stores the structured devotional fields and exactly three learning points', async () => {
  const { writeDailyContent } = require('../shared-study/client.js');
  writeDailyContent.mockImplementationOnce(async (_client, _model, request) => ({ id: 8n, ...request.data }));
  const result = await addDailyDevotion({
    title: 'The Church Must Take Holiness Seriously',
    explanation: 'Paul calls the church to humble, restorative accountability.',
    reflectionQuestions: ['What needs correction in my own life?'],
    prayer: 'Father, give us truth, grace, and humility. Amen.',
    practicalApplications: ['Examine your own life before criticizing culture.'],
    learningPoints: ['Unbelievers need the gospel.', 'The church must pursue holiness.', 'Correction should seek restoration.'],
    displayDate: '2026-11-19',
  }, 'admin-1');
  expect(result.status).toBe(200);
  expect(result.data).toMatchObject({
    explanation: 'Paul calls the church to humble, restorative accountability.',
    prayer: 'Father, give us truth, grace, and humility. Amen.',
  });
  expect(JSON.parse(result.data.reflectionQuestions)).toHaveLength(1);
  expect(JSON.parse(result.data.learningPoints)).toHaveLength(3);
  expect(result.data).not.toHaveProperty('content');
  expect(result.data).not.toHaveProperty('takeaways');
});

test('rejects a devotion unless it has exactly three learning points', async () => {
  const result = await addDailyDevotion({
    title: 'Devotion', explanation: 'Body', reflectionQuestions: ['Question?'],
    prayer: 'Amen.', practicalApplications: ['Act'], learningPoints: ['Only one'],
    displayDate: '2026-11-19',
  }, 'admin-1');
  expect(result).toMatchObject({ status: 400, message: 'learningPoints must contain exactly three items' });
});

test.each([
  { bookName: 'John' },
  { bookName: 'John', chapter: 3 },
  { chapter: 3, verseNumber: 16 },
])('rejects an incomplete devotion Bible reference: %p', async reference => {
  const result = await addDailyDevotion({
    title: 'Devotion', content: 'Body', displayDate: '2026-11-18', ...reference,
  }, 'admin-1');
  expect(result).toMatchObject({
    status: 400,
    message: 'bookName, chapter, and verseNumber must be provided together',
  });
  const { writeDailyContent } = require('../shared-study/client.js');
  expect(writeDailyContent).not.toHaveBeenCalled();
});

test.each([[10, 6], ['6-10', undefined], [0, 10], [6, 177]])('rejects invalid range %s-%s before database writes', async (start, end) => {
  expect((await addDailyVerse({ ...verse, verseNumber: start, verseEnd: end }, 'admin-1')).status).toBe(400);
  expect(prisma.dailyVerse.create).not.toHaveBeenCalled();
});

test('old clients do not accidentally clear an existing range', () => {
  expect(validVerseRange(6, undefined)).toBe(true);
  expect(verseEndData(undefined)).toEqual({});
  expect(verseEndData(null)).toEqual({ verseEnd: null });
});

test('range reader returns the complete text, not just the starting verse', async () => {
  const result = await fetchVerseTextWithFallback('BSB', 'Genesis', 3, 6, 10);
  expect(result).toEqual({ translation: 'BSB', text: '6. Verse 6\n7. Verse 7\n8. Verse 8\n9. Verse 9\n10. Verse 10' });
  expect(getVerse).toHaveBeenCalledTimes(5);
});

test('explanations store the main range and cross-reference ranges', async () => {
  const table = () => ({ deleteMany: jest.fn().mockResolvedValue({}), createMany: jest.fn().mockResolvedValue({}) });
  const tx = {
    verseExplanation: {
      upsert: jest.fn().mockImplementation(async ({ create }) => ({ id: 1n, ...create })),
      findUnique: jest.fn().mockResolvedValue({ id: 1n, verseEnd: 10n }),
    },
    verseExegesis: { upsert: jest.fn().mockResolvedValue({}) },
    verseWordStudyEntry: table(), versePracticalApplication: table(), verseCrossReference: table(), verseTheme: table(),
  };
  prisma.$transaction.mockImplementation(fn => fn(tx));
  const result = await addVerseExplanation({ ...verse, crossReferences: [{ bookName: 'Romans', chapter: 5, verseNumber: 1, verseEnd: 3, referenceText: 'Quote' }] }, 'admin-1');
  expect(result.status).toBe(200);
  const { create, update } = tx.verseExplanation.upsert.mock.calls[0][0];
  expect(create).toMatchObject({ verseEnd: 10n, createdBy: 'admin-1', createdOn: expect.any(Date) });
  expect(create.updatedOn).toEqual(create.createdOn);
  expect(update).toMatchObject({ updatedBy: 'admin-1', updatedOn: expect.any(Date) });
  expect(update).not.toHaveProperty('createdOn');
  expect(tx.verseCrossReference.createMany).toHaveBeenCalledWith({ data: [expect.objectContaining({ verseNumber: 1n, verseEnd: 3n })] });
});

test('explanation saves pass the expected shared version into the transaction', async () => {
  const table = () => ({ deleteMany: jest.fn().mockResolvedValue({}), createMany: jest.fn().mockResolvedValue({}) });
  const tx = {
    verseExplanation: {
      upsert: jest.fn().mockResolvedValue({ id: 1n, sharedStudyId: 7n }),
      update: jest.fn().mockResolvedValue({ id: 1n, sharedStudyId: 7n }),
      findUnique: jest.fn().mockResolvedValue({ id: 1n, sharedStudyId: 7n }),
    },
    verseExegesis: { upsert: jest.fn().mockResolvedValue({}) },
    verseWordStudyEntry: table(), versePracticalApplication: table(), verseCrossReference: table(), verseTheme: table(),
  };
  prisma.$transaction.mockImplementation(fn => fn(tx));
  await addVerseExplanation({ ...verse, id: 1, sharedStudyVersion: 5 }, 'admin-1');
  expect(tx.verseExplanation.update).toHaveBeenCalledWith(expect.objectContaining({
    where: { id: 1n },
    data: expect.objectContaining({ updatedBy: 'admin-1', updatedOn: expect.any(Date) }),
  }));
  expect(tx.verseExplanation.update.mock.calls[0][0].data).not.toHaveProperty('createdOn');
  const { writeStudy } = require('../shared-study/repository.js');
  expect(writeStudy).toHaveBeenCalledWith(tx, 'explanation', expect.objectContaining({ id: 1n }), {
    allowSharedEdit: true,
    expectedVersion: 5,
  });
});

test('saves and reopens Strong’s IDs when the dictionary has no matching entries', async () => {
  const { writeStudy } = require('../shared-study/repository.js');
  const { sharedStudyReaders } = require('../shared-study/client.js');
  writeStudy.mockImplementationOnce(jest.requireActual('../shared-study/repository.js').writeStudy);
  sharedStudyReaders.mockImplementationOnce(() => jest.requireActual('../shared-study/client.js').sharedStudyReaders(tx));
  const rows = () => ({ deleteMany: jest.fn(), createMany: jest.fn() });
  const tx = {
    bibleBook: { upsert: jest.fn() },
    bibleEdition: { upsert: jest.fn() },
    scripturePassage: { upsert: jest.fn().mockResolvedValue({ id: 10n }) },
    strongsDictionary: { findMany: jest.fn().mockResolvedValue([]) },
    strongsIdentifier: { upsert: jest.fn() },
    studyWord: { create: jest.fn() },
    passageStudy: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 12n, version: 1 }),
      // Hydrate from the links actually written by the repository.
      findMany: jest.fn(async () => [{
        id: 12n, version: 1, explanation: verse.explanation,
        takeaways: [], practicalApplications: [], themes: [], crossReferences: [],
        words: tx.studyWord.create.mock.calls.map(([{ data }]) => ({
          ...data, strongLinks: data.strongLinks.create.map(link => ({ ...link, strongs: { dictionary: null } })),
        })),
      }]),
    },
    verseExplanation: {
      upsert: jest.fn().mockResolvedValue({ id: 1n }),
      update: jest.fn(),
      findUnique: jest.fn(async () => ({
        ...verse, id: 1n, exegesis: { explanationText: verse.explanation },
        sharedStudyId: tx.verseExplanation.update.mock.calls[0]?.[0].data.sharedStudyId ?? null,
        wordStudies: tx.verseWordStudyEntry.createMany.mock.calls[0][0].data,
      })),
    },
    verseExegesis: { upsert: jest.fn() },
    verseWordStudyEntry: rows(), versePracticalApplication: rows(), verseCrossReference: rows(), verseTheme: rows(),
  };
  prisma.$transaction.mockImplementation(fn => fn(tx));
  const result = await addVerseExplanation({ ...verse, wordStudies: [
    { surfaceText: 'Word', strongsId: ' h03045a ', customDefinition: 'Editorial meaning' },
    { surfaceText: 'Phrase', strongsId: 'H589/H0430', customDefinition: 'Editorial phrase' },
  ] }, 'admin-1');
  expect(result.status).toBe(200);
  expect(tx.verseWordStudyEntry.createMany.mock.calls[0][0].data.map(row => row.strongsId)).toEqual([null, null]);
  expect(tx.strongsIdentifier.upsert.mock.calls.map(([{ create }]) => create)).toEqual([
    { id: 'H03045A', dictionaryId: null }, { id: 'H0430', dictionaryId: null }, { id: 'H589', dictionaryId: null },
  ]);
  const expected = [
    expect.objectContaining({ strongsId: 'H03045A', strongsIds: ['H03045A'], strongs: null, customDefinition: 'Editorial meaning' }),
    expect.objectContaining({ strongsId: 'H0430/H589', strongsIds: ['H0430', 'H589'], strongs: null, customDefinition: 'Editorial phrase' }),
  ];
  expect(result.data.wordStudies).toEqual(expected);
  const reopened = await getVerseExplanationForEdit({ id: 1 });
  expect(reopened.status).toBe(200);
  expect(reopened.data.wordStudies).toEqual(expected);
});

test('rejects invalid Strong’s IDs instead of silently dropping them', async () => {
  const result = await addVerseExplanation({ ...verse, wordStudies: [
    { surfaceText: 'Word', strongsId: 'CH3045', customDefinition: 'Editorial meaning' },
  ] }, 'admin-1');
  expect(result).toMatchObject({ status: 400, message: "Word study 1: invalid Strong's ID" });
  expect(prisma.$transaction).not.toHaveBeenCalled();
});

test('daily verse saves invalidate every dependent view and the landing cache', async () => {
  await addDailyVerse({ ...verse, id: 9, sharedStudyVersion: 2 }, 'admin-1');
  const bibleKeys = cache.del.mock.calls
    .filter(([namespace]) => namespace === 'bible')
    .map(([, key]) => key);
  expect(bibleKeys).toEqual(expect.arrayContaining([
    'todays-verse:v2',
    'todays-verse:v2:en',
    'verse-by-date:v2:2026-11-18',
  ]));
  expect(cache.del).toHaveBeenCalledWith('landing', expect.stringContaining('daily-verse:'));
});

test('explanation saves invalidate explanation, resource and AI caches', async () => {
  const table = () => ({ deleteMany: jest.fn().mockResolvedValue({}), createMany: jest.fn().mockResolvedValue({}) });
  const tx = {
    verseExplanation: {
      upsert: jest.fn().mockResolvedValue({ id: 1n, sharedStudyId: 7n }),
      update: jest.fn().mockResolvedValue({ id: 1n, sharedStudyId: 7n }),
      findUnique: jest.fn().mockResolvedValue({ id: 1n, sharedStudyId: 7n }),
    },
    verseExegesis: { upsert: jest.fn().mockResolvedValue({}) },
    verseWordStudyEntry: table(), versePracticalApplication: table(), verseCrossReference: table(), verseTheme: table(),
  };
  prisma.$transaction.mockImplementation(fn => fn(tx));
  await addVerseExplanation({ ...verse, id: 1, sharedStudyVersion: 5 }, 'admin-1');
  expect(cache.del).toHaveBeenCalledWith('bible', 'explanation-detailed:v4:Genesis:3:6');
  expect(cache.del).toHaveBeenCalledWith('verse-resources', 'Genesis:3:6');
  expect(cache.del).toHaveBeenCalledWith('verse-resources-counts', 'Genesis:3:6');
  expect(cache.del).toHaveBeenCalledWith('ai', expect.stringContaining('Genesis:3:6'));
});

test('incomplete cross references return a clear validation error', async () => {
  const result = await addVerseExplanation({ ...verse, crossReferences: [{ bookName: '', chapter: 0, verseNumber: 0 }] }, 'admin-1');
  expect(result.status).toBe(400);
  expect(prisma.$transaction).not.toHaveBeenCalled();
});
