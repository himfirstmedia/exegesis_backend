jest.mock('../../services/objectStorage.js', () => ({ isObjectStorageConfigured: jest.fn(() => true), readHeadingPackObject: jest.fn() }));
jest.mock('../../services/cacheService.js', () => ({ cache: { waitUntilReady: jest.fn().mockResolvedValue(true) } }));
jest.mock('./pack-data.js', () => ({ overviewLanguages: ['en', 'fr'], overviewManifestKey: language => `manifest/${language}`,
  readOverviewSnapshot: jest.fn().mockResolvedValue({ revision: 'abcdef123456' }) }));
jest.mock('./pack-builder.js', () => ({ buildOverviewPack: jest.fn(), overviewFailureReason: () => 'PROVIDER_OR_STORAGE_ERROR' }));
let worker, storage, builder;
const oldProvider = process.env.BOOK_OVERVIEW_PACK_PROVIDER;
beforeEach(() => {
  jest.resetModules(); jest.useFakeTimers();
  process.env.BOOK_OVERVIEW_PACK_PROVIDER = 'runtime';
  storage = require('../../services/objectStorage.js');
  builder = require('./pack-builder.js');
  storage.readHeadingPackObject.mockResolvedValue(null);
  builder.buildOverviewPack.mockImplementation(async language => ({ language, bookCount: 46, revision: 'abcdef123456' }));
  worker = require('./pack-worker.js');
});
afterEach(async () => {
  await worker.stopOverviewPackPublisher(); jest.useRealTimers();
  if (oldProvider === undefined) delete process.env.BOOK_OVERVIEW_PACK_PROVIDER; else process.env.BOOK_OVERVIEW_PACK_PROVIDER = oldProvider;
});
test('startup reconciliation discovers unpublished DB revisions and skips up-to-date languages', async () => {
  storage.readHeadingPackObject.mockImplementation(async key => key === 'manifest/en' ? { revision: 'abcdef123456' } : null);
  await worker.publishPendingOverviewPacks();
  expect(builder.buildOverviewPack).toHaveBeenCalledTimes(1);
  expect(builder.buildOverviewPack).toHaveBeenCalledWith('fr', expect.objectContaining({ snapshot: { revision: 'abcdef123456' } }));
});
test('failed publications are retried on a later reconciliation rather than lost', async () => {
  builder.buildOverviewPack.mockRejectedValueOnce(new Error('provider down'));
  await worker.publishPendingOverviewPacks();
  await worker.publishPendingOverviewPacks();
  expect(builder.buildOverviewPack).toHaveBeenCalledTimes(4);
});
test('a new admin change aborts obsolete work and schedules the latest snapshot', async () => {
  let signal;
  builder.buildOverviewPack.mockImplementationOnce(async (_language, options) => {
    signal = options.signal;
    worker.requestOverviewPackPublication();
    return { bookCount: 46, revision: 'abcdef123456' };
  });
  await worker.publishPendingOverviewPacks();
  expect(signal.aborted).toBe(true);
});
