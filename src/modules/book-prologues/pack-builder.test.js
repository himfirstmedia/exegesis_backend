jest.mock('../../config/db.js', () => ({ prisma: { bookPrologue: { findMany: jest.fn() } } }));
jest.mock('../../services/cacheService.js', () => ({ cache: { acquireLock: jest.fn() } }));
jest.mock('../../services/objectStorage.js', () => ({ readHeadingPackObject: jest.fn(), writeHeadingPackObject: jest.fn() }));
jest.mock('../text-to-text-translation/service.js', () => ({ translateBatch: jest.fn() }));
import { prisma } from '../../config/db.js';
import { cache } from '../../services/cacheService.js';
import { readHeadingPackObject, writeHeadingPackObject } from '../../services/objectStorage.js';
import { makeOverviewSnapshot, overviewManifestKey, overviewPackKey } from './pack-data.js';
import { buildOverviewPack } from './pack-builder.js';

let objects;
const row = (bookName = 'Genesis', summary = 'The creation of the world.') => ({ bookName, summary, author: 'Moses',
  structure: [{ range: '1-2', title: 'Creation' }], applications: ['Trust God.'],
  keyScripture: [{ bookName: 'Genesis', chapter: 1, verse: 1, translation: 'KJV', text: 'In the beginning God created.' }],
  keyVerses: ['Genesis 1:1'], createdBy: 'private-user-id' });
const translate = jest.fn(async texts => texts.map(text => `traduit:${text}`));
beforeEach(() => {
  jest.clearAllMocks(); objects = new Map();
  prisma.bookPrologue.findMany.mockResolvedValue([row()]);
  cache.acquireLock.mockResolvedValue({ acquired: true, release: jest.fn() });
  readHeadingPackObject.mockImplementation(async key => objects.get(key) || null);
  writeHeadingPackObject.mockImplementation(async (key, data) => { objects.set(key, JSON.parse(JSON.stringify(data))); });
});
test('reads DB directly, omits private columns, preserves quoted Scripture and publishes manifest last', async () => {
  const result = await buildOverviewPack('fr', { translate });
  const pack = objects.get(overviewPackKey(result.revision, 'fr'));
  expect(pack.books.Genesis.summary).toBe('traduit:The creation of the world.');
  expect(pack.books.Genesis.keyScripture).toEqual(row().keyScripture);
  expect(pack.books.Genesis.keyVerses).toEqual(row().keyVerses);
  expect(pack.books.Genesis.createdBy).toBeUndefined();
  expect(pack.missingBooks).toHaveLength(65);
  expect(translate.mock.calls.flatMap(([texts]) => texts).join(' ')).not.toContain('In the beginning');
  expect(writeHeadingPackObject.mock.calls.at(-1)[0]).toBe(overviewManifestKey('fr'));
  expect(cache.acquireLock.mock.calls[0][0]).toBe('book-overview-pack:fr');
});
test('English copies source without a provider and identical builds reuse immutable content', async () => {
  const first = await buildOverviewPack('en', { translate });
  expect(translate).not.toHaveBeenCalled();
  expect((await buildOverviewPack('en', { translate })).reused).toBe(true);
  expect(objects.get(overviewPackKey(first.revision, 'en')).books.Genesis.summary).toBe(row().summary);
});
test('publishes when valid person-name headings/genealogy are unchanged, without accepting prose echoes', async () => {
  prisma.bookPrologue.findMany.mockResolvedValue([{ ...row(), summary: 'Abraham → Isaac → Jacob → Joseph',
    keyPeople: ['Abraham and Sarah', 'Isaac and Rebekah', 'Jacob and Esau', 'Joseph'],
    structure: [{ range: '12-25', title: 'Abraham' }, { range: '26-27', title: 'Isaac' }, { range: '28-36', title: 'Jacob' }] }]);
  const names = jest.fn(async texts => texts.map(text => ['Abraham', 'Isaac', 'Jacob', 'Abraham → Isaac → Jacob → Joseph'].includes(text) ? text : `traduit:${text}`));
  const result = await buildOverviewPack('fr', { translate: names });
  const pack = objects.get(overviewPackKey(result.revision, 'fr'));
  expect(pack.books.Genesis.summary).toBe('Abraham → Isaac → Jacob → Joseph');
  expect(pack.books.Genesis.structure[0].title).toBe('Abraham');
  expect(result.bookCount).toBe(1);
});
test('new books change the revision but reuse completed unchanged-book translations', async () => {
  const first = await buildOverviewPack('fr', { translate });
  translate.mockClear();
  prisma.bookPrologue.findMany.mockResolvedValue([row(), row('Exodus', 'God delivers Israel.')]);
  const next = await buildOverviewPack('fr', { translate });
  expect(next.revision).not.toBe(first.revision);
  expect(next.bookCount).toBe(2);
  expect(translate.mock.calls.flatMap(([texts]) => texts)).not.toContain(row().summary);
});
test('failed translations save successful chunks without replacing the live manifest', async () => {
  const partial = jest.fn(async texts => texts.map(text => text.includes('creation of the world') ? '' : `traduit:${text}`));
  await expect(buildOverviewPack('fr', { translate: partial, retryDelayMs: 0 })).rejects.toThrow('Incomplete overview translation: Genesis');
  expect(writeHeadingPackObject.mock.calls.some(([key]) => key.endsWith('-partial.json'))).toBe(true);
  expect(objects.has(overviewManifestKey('fr'))).toBe(false);
  expect((await cache.acquireLock.mock.results[0].value).release).toHaveBeenCalled();
});
test('checkpoints successful batch items before recovery and uses the free-mode retry adapter only for failures', async () => {
  const primary = jest.fn(async texts => texts.map(text => text === row().summary ? '' : `traduit:${text}`));
  primary.retry = jest.fn(async texts => texts.map(text => `traduit:${text}`));
  const result = await buildOverviewPack('fr', { translate: primary, retryDelayMs: 0 });
  expect(primary.retry).toHaveBeenCalledWith([row().summary], 'fr');
  expect(writeHeadingPackObject.mock.invocationCallOrder[0]).toBeLessThan(primary.retry.mock.invocationCallOrder[0]);
  expect(objects.has(overviewManifestKey('fr'))).toBe(true);
  expect(result.bookCount).toBe(1);
});
test('a persistently failing book does not prevent caching later books, but no incomplete language manifest is published', async () => {
  prisma.bookPrologue.findMany.mockResolvedValue([row(), row('Exodus', 'God delivers Israel.')]);
  const translate = jest.fn(async texts => texts.map(text => text === row().summary ? '' : `traduit:${text}`));
  await expect(buildOverviewPack('fr', { translate, retryDelayMs: 0 })).rejects.toThrow('Incomplete overview translation: Genesis');
  expect([...objects.values()].some(value => value.complete === true && value.data?.bookName === 'Exodus')).toBe(true);
  expect(objects.has(overviewManifestKey('fr'))).toBe(false);
});
test('an outage cooldown stops the language after its checkpoint instead of hammering later books', async () => {
  prisma.bookPrologue.findMany.mockResolvedValue([row(), row('Exodus', 'God delivers Israel.')]);
  const primary = jest.fn(async texts => texts.map(text => text === row().summary ? '' : `traduit:${text}`));
  primary.retry = jest.fn().mockRejectedValue(Object.assign(new Error('cooldown'), { code: 'FREE_PROVIDER_COOLDOWN', providerReason: 'HTTP_429' }));
  await expect(buildOverviewPack('fr', { translate: primary, retryDelayMs: 0 })).rejects.toMatchObject({ code: 'FREE_PROVIDER_COOLDOWN' });
  expect(primary.retry).toHaveBeenCalledTimes(1);
  expect(primary).toHaveBeenCalledTimes(1);
  expect([...objects.keys()].some(key => key.endsWith('-partial.json'))).toBe(true);
  expect(objects.has(overviewManifestKey('fr'))).toBe(false);
  expect((await cache.acquireLock.mock.results[0].value).release).toHaveBeenCalled();
});
test('a DB edit during translation never publishes the obsolete snapshot manifest', async () => {
  const snapshot = makeOverviewSnapshot([row()]);
  prisma.bookPrologue.findMany.mockResolvedValue([row('Genesis', 'Edited source.')]);
  await expect(buildOverviewPack('fr', { snapshot, translate })).rejects.toThrow('Prologues changed');
  expect(objects.has(overviewManifestKey('fr'))).toBe(false);
});
test('deletions, including the last book, publish explicit missing-source lists', async () => {
  await buildOverviewPack('en');
  prisma.bookPrologue.findMany.mockResolvedValue([]);
  const result = await buildOverviewPack('en');
  expect(result.bookCount).toBe(0);
  expect(result.missingBooks).toHaveLength(66);
});
test('storage failure never advertises a partial pack and cancellation releases owned locks', async () => {
  writeHeadingPackObject.mockRejectedValueOnce(new Error('storage failed'));
  await expect(buildOverviewPack('en')).rejects.toThrow('storage failed');
  expect(objects.has(overviewManifestKey('en'))).toBe(false);
  const controller = new AbortController(); controller.abort();
  await expect(buildOverviewPack('fr', { signal: controller.signal, translate })).rejects.toThrow('interrupted');
  expect((await cache.acquireLock.mock.results[1].value).release).toHaveBeenCalled();
});
test('source revisions ignore private/admin-only changes but include edits and removals', () => {
  const first = makeOverviewSnapshot([row()]);
  expect(makeOverviewSnapshot([{ ...row(), createdBy: 'different', updatedOn: new Date() }]).revision).toBe(first.revision);
  expect(makeOverviewSnapshot([row('Genesis', 'Changed')]).revision).not.toBe(first.revision);
  expect(makeOverviewSnapshot([]).revision).not.toBe(first.revision);
});
