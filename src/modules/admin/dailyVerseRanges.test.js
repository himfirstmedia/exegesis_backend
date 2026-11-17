jest.mock('stripe', () => ({ __esModule: true, default: jest.fn().mockImplementation(() => ({})) }));
jest.mock('../../config/db.js', () => ({ prisma: {
  dailyVerse: { create: jest.fn(), update: jest.fn() },
  $transaction: jest.fn(),
} }));
jest.mock('../../services/cacheService.js', () => ({ cache: { del: jest.fn().mockResolvedValue(undefined) } }));
jest.mock('../../utils/emailTemplates.js', () => ({ __esModule: true, default: {} }));
jest.mock('../bible-translations/service.js', () => ({ getVerse: jest.fn() }));

const { prisma } = require('../../config/db.js');
const { getVerse } = require('../bible-translations/service.js');
const { addDailyVerse } = require('./service.js');
const { addVerseExplanation, fetchVerseTextWithFallback } = require('../bible/service.js');
const { validVerseRange, verseEndData } = require('../../utils/verseRange.js');

beforeEach(() => {
  jest.clearAllMocks();
  prisma.dailyVerse.create.mockImplementation(async ({ data }) => ({ id: 1n, ...data }));
  prisma.dailyVerse.update.mockImplementation(async ({ data }) => ({ id: 1n, ...data }));
  getVerse.mockImplementation(async (_version, _book, _chapter, verse) => ({ text: `Verse ${verse}` }));
});

const verse = { bookName: 'Genesis', chapter: 3, verseNumber: 6, verseEnd: 10, displayDate: '2026-11-18', explanation: 'Explanation' };

test.each([undefined, 9])('daily verse create/edit preserves range (id: %s)', async id => {
  const result = await addDailyVerse({ ...verse, id }, 'admin-1');
  expect(result.status).toBe(200);
  expect(Number(result.data.verseEnd)).toBe(10);
  expect((id ? prisma.dailyVerse.update : prisma.dailyVerse.create)).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ verseNumber: 6n, verseEnd: 10n }) }));
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
    verseExplanation: { upsert: jest.fn().mockImplementation(async ({ create }) => ({ id: 1n, ...create })) },
    verseExegesis: { upsert: jest.fn().mockResolvedValue({}) },
    verseWordStudyEntry: table(), versePracticalApplication: table(), verseCrossReference: table(), verseTheme: table(),
  };
  prisma.$transaction.mockImplementation(fn => fn(tx));
  const result = await addVerseExplanation({ ...verse, crossReferences: [{ bookName: 'Romans', chapter: 5, verseNumber: 1, verseEnd: 3, referenceText: 'Quote' }] }, 'admin-1');
  expect(result.status).toBe(200);
  expect(tx.verseExplanation.upsert.mock.calls[0][0].create.verseEnd).toBe(10n);
  expect(tx.verseCrossReference.createMany).toHaveBeenCalledWith({ data: [expect.objectContaining({ verseNumber: 1n, verseEnd: 3n })] });
});

test('incomplete cross references return a clear validation error', async () => {
  const result = await addVerseExplanation({ ...verse, crossReferences: [{ bookName: '', chapter: 0, verseNumber: 0 }] }, 'admin-1');
  expect(result.status).toBe(400);
  expect(prisma.$transaction).not.toHaveBeenCalled();
});
