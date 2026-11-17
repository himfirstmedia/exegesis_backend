const { sharedStudyReaders, writeDailyContent } = require('./client.js');
const { hydrateStudies, writeStudy } = require('./repository.js');

jest.mock('./repository.js', () => ({ hydrateStudies: jest.fn(), writeStudy: jest.fn() }));
beforeEach(() => jest.clearAllMocks());

test('selected-field readers fetch the link but do not leak extra fields into the DTO', async () => {
  const row = { sharedStudyId: 7n, exegesis: { explanationText: 'Old' } };
  const client = { verseExplanation: { findUnique: jest.fn().mockResolvedValue(row) } };
  hydrateStudies.mockResolvedValue({ ...row, sharedStudyVersion: 3, exegesis: { explanationText: 'Shared', applicationText: 'Private to another select' }, wordStudies: [] });
  const select = { exegesis: { select: { explanationText: true } } };
  const result = await sharedStudyReaders(client).verseExplanation.findUnique({ where: { id: 1n }, select });
  expect(client.verseExplanation.findUnique).toHaveBeenCalledWith({ where: { id: 1n }, select: { ...select, sharedStudyId: true } });
  expect(result).toEqual({ exegesis: { explanationText: 'Shared' } });
  expect(select.sharedStudyId).toBeUndefined();
});

test('selected list readers project each row and preserve null relations', async () => {
  const client = { verseExplanation: { findMany: jest.fn().mockResolvedValue([]) } };
  hydrateStudies.mockResolvedValue([{ id: 1n, exegesis: null }, { id: 2n, exegesis: { explanationText: 'Shared' } }]);
  const result = await sharedStudyReaders(client).verseExplanation.findMany({ select: { exegesis: { select: { explanationText: true } } } });
  expect(result).toEqual([{ exegesis: null }, { exegesis: { explanationText: 'Shared' } }]);
});

test('daily partial writes use current shared content, not the stale compatibility columns', async () => {
  const old = { id: 1n, sharedStudyId: 7n, explanation: 'Stale legacy', application: 'Legacy application' };
  const tx = { dailyVerse: {
    findUnique: jest.fn().mockResolvedValue(old),
    update: jest.fn().mockResolvedValue({ ...old, reflection: 'Updated reflection' }),
  } };
  const client = { $transaction: jest.fn(callback => callback(tx)) };
  hydrateStudies.mockResolvedValueOnce({ ...old, explanation: 'Current shared', application: 'Current application', sharedStudyVersion: 4 })
    .mockResolvedValueOnce({ id: 1n, explanation: 'Current shared', reflection: 'Updated reflection' });
  const data = { reflection: 'Updated reflection', explanation: undefined };
  const result = await writeDailyContent(client, 'dailyVerse', { id: 1, data });
  expect(writeStudy).toHaveBeenCalledWith(tx, 'verse', expect.objectContaining({ id: 1n, explanation: 'Current shared', application: 'Current application', reflection: 'Updated reflection' }),
    { allowSharedEdit: true, expectedVersion: 4 });
  expect(result.reflection).toBe('Updated reflection');
});

test('write failures propagate through the transaction, not a separate post-save shared update', async () => {
  const tx = { dailyVerse: { create: jest.fn().mockResolvedValue({ id: 2n }), findUnique: jest.fn() } };
  const client = { $transaction: jest.fn(callback => callback(tx)) };
  writeStudy.mockRejectedValueOnce(new Error('conflict'));
  await expect(writeDailyContent(client, 'dailyVerse', { data: { explanation: 'Different' } })).rejects.toThrow('conflict');
  expect(tx.dailyVerse.findUnique).not.toHaveBeenCalled();
});

test('explicit client versions take precedence over the freshly read version', async () => {
  const tx = { dailyDevotion: { findUnique: jest.fn().mockResolvedValue({ id: 2n, sharedStudyId: 7n }), update: jest.fn().mockResolvedValue({ id: 2n, sharedStudyId: 7n }) } };
  const client = { $transaction: jest.fn(callback => callback(tx)) };
  hydrateStudies.mockResolvedValue({ id: 2n, sharedStudyId: 7n, sharedStudyVersion: 5 });
  await writeDailyContent(client, 'dailyDevotion', { id: 2, data: { title: 'Title' }, expectedVersion: 3 });
  expect(writeStudy.mock.calls[0][3]).toEqual({ allowSharedEdit: true, expectedVersion: 3 });
});
