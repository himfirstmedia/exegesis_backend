jest.mock('../../services/cacheService.js', () => ({ cache: { acquireLock: jest.fn() } }));
jest.mock('../../services/objectStorage.js', () => ({
  readHeadingPackObject: jest.fn(), writeHeadingPackObject: jest.fn(),
}));
jest.mock('../../utils/translator.js', () => ({ translateMany: jest.fn() }));

import { buildHeadingPack } from './heading-pack-builder.js';
import { headingSource, makeHeadingPack, headingPackKeys, HEADING_PACK_REVISION, headingCarryKey, headingTexts } from './heading-pack-data.js';
import { cache } from '../../services/cacheService.js';
import { readHeadingPackObject, writeHeadingPackObject } from '../../services/objectStorage.js';
import { translateMany } from '../../utils/translator.js';

beforeEach(() => {
  jest.clearAllMocks();
  readHeadingPackObject.mockResolvedValue(null);
  writeHeadingPackObject.mockResolvedValue(undefined);
  cache.acquireLock.mockResolvedValue({ acquired: true, release: jest.fn() });
  translateMany.mockImplementation(async texts => texts.map(text => `translated:${text}`));
});

test('builds 66 books, compresses the final file and publishes the manifest last', async () => {
  const result = await buildHeadingPack('fr');
  expect(result.totalBooks).toBe(66);
  expect(translateMany).toHaveBeenCalledTimes(66);
  const calls = writeHeadingPackObject.mock.calls;
  const final = calls.find(([key, , options]) => key === headingPackKeys('fr').final && options?.compress);
  expect(final[1]).toEqual(expect.objectContaining({ books: expect.objectContaining({ Genesis: expect.any(Object) }) }));
  expect(calls.at(-1)).toEqual([headingPackKeys('fr').manifest, expect.objectContaining({ totalBooks: 66 })]);
});

test('publishes previously generated packs without translating them again', async () => {
  readHeadingPackObject.mockResolvedValue(makeHeadingPack('fr', headingSource));
  expect((await buildHeadingPack('fr')).reused).toBe(true);
  expect(translateMany).not.toHaveBeenCalled();
  expect(writeHeadingPackObject).toHaveBeenCalledTimes(3);
});

test('resumes completed books from checkpoints', async () => {
  readHeadingPackObject.mockImplementation(async key => key.endsWith('-partial.json')
    ? { revision: HEADING_PACK_REVISION, books: { Genesis: headingSource.Genesis } } : null);
  await buildHeadingPack('sw');
  expect(translateMany).toHaveBeenCalledTimes(65);
});

test('repairs incomplete checkpoint books instead of publishing corrupt data', async () => {
  readHeadingPackObject.mockImplementation(async key => key.endsWith('-partial.json')
    ? { revision: HEADING_PACK_REVISION, books: { Genesis: {} } } : null);
  await buildHeadingPack('sw');
  expect(translateMany).toHaveBeenCalledTimes(66);
});

test('provider failures never publish a complete pack or manifest', async () => {
  translateMany.mockRejectedValue(new Error('provider unavailable'));
  await expect(buildHeadingPack('es')).rejects.toThrow('provider unavailable');
  expect(writeHeadingPackObject).not.toHaveBeenCalled();
});

test('never publishes a manifest if uploading the final file fails', async () => {
  readHeadingPackObject.mockResolvedValue(makeHeadingPack('de', headingSource));
  writeHeadingPackObject.mockRejectedValue(new Error('upload failed'));
  await expect(buildHeadingPack('de')).rejects.toThrow('upload failed');
  expect(writeHeadingPackObject).toHaveBeenCalledTimes(1);
});

test('English publishes in two writes without provider translation', async () => {
  await buildHeadingPack('en');
  expect(translateMany).not.toHaveBeenCalled();
  expect(writeHeadingPackObject).toHaveBeenCalledTimes(2);
});

test('duplicate builders fail clearly rather than claiming a pack was published', async () => {
  cache.acquireLock.mockResolvedValue({ acquired: false });
  await expect(buildHeadingPack('it')).rejects.toThrow('Another builder');
  expect(translateMany).not.toHaveBeenCalled();
});

test('reuses unchanged headings from the previous revision and translates only the rest', async () => {
  const book = Object.keys(headingSource)[0];
  const chapter = Object.keys(headingSource[book])[0];
  const carriedHeading = headingSource[book][chapter][0].heading;
  const carry = { schemaVersion: 1, revision: '000000000000', language: 'fr',
    texts: [carriedHeading], translations: ['CARRIED'] };
  readHeadingPackObject.mockImplementation(async key => key === headingCarryKey('fr') ? carry : null);
  await buildHeadingPack('fr');
  const sent = translateMany.mock.calls.flatMap(([texts]) => texts);
  expect(sent).not.toContain(carriedHeading);
  const pack = writeHeadingPackObject.mock.calls.find(([key]) => key === headingPackKeys('fr').final)[1];
  expect(pack.books[book][chapter][0].heading).toBe('CARRIED');
});

test('records a per-language carry so future heading revisions reuse translations', async () => {
  await buildHeadingPack('fr');
  const call = writeHeadingPackObject.mock.calls.find(([key]) => key === headingCarryKey('fr'));
  expect(call).toBeTruthy();
  expect(call[1]).toMatchObject({ schemaVersion: 1, revision: HEADING_PACK_REVISION, language: 'fr', texts: headingTexts() });
  expect(call[1].translations).toHaveLength(headingTexts().length);
});

test('English publishes no heading carry object', async () => {
  await buildHeadingPack('en');
  expect(writeHeadingPackObject.mock.calls.some(([key]) => key === headingCarryKey('en'))).toBe(false);
});
