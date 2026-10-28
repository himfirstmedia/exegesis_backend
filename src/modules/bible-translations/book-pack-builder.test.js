jest.mock('./service.js', () => ({ getCatalog: jest.fn(), getBooksWithMaxChapters: jest.fn() }));
jest.mock('../../services/objectStorage.js', () => ({ writeHeadingPackObject: jest.fn() }));
import { buildBookPack } from './book-pack-builder.js';
import { getCatalog, getBooksWithMaxChapters } from './service.js';
import { writeHeadingPackObject } from '../../services/objectStorage.js';

const book = (bookNumber, maxChapter) => ({ bookNumber, bookName: bookNumber === 1 ? 'Genesis' : 'Matthew',
  testament: bookNumber === 1 ? 'Old' : 'New', chaptersCount: maxChapter, maxChapter, totalVerses: 100 });
beforeEach(() => {
  jest.clearAllMocks();
  getCatalog.mockReturnValue([{ id: 'full', fileId: 'FullBible' }, { id: 'nt', fileId: 'NTBible' }]);
  getBooksWithMaxChapters.mockImplementation(async id => id === 'nt' ? [book(40, 28)] : [book(1, 50), book(40, 28)]);
  writeHeadingPackObject.mockResolvedValue(undefined);
});
test('preserves edition availability, names and chapter counts; publishes manifest last', async () => {
  const result = await buildBookPack();
  const calls = writeHeadingPackObject.mock.calls;
  expect(calls[0][0]).toBe(`book-packs/${result.revision}/catalog.json`);
  expect(calls[0][2].compress).toBe(true);
  expect(calls[0][1].editions[1].books).toEqual([book(40, 28)]);
  expect(Object.keys(calls[0][1].names)).toHaveLength(39);
  expect(calls[1][0]).toBe('book-packs/manifest.json');
});
test('revision is stable and changes when edition counts change', async () => {
  const first = await buildBookPack();
  expect((await buildBookPack()).revision).toBe(first.revision);
  getBooksWithMaxChapters.mockResolvedValue([book(40, 27)]);
  expect((await buildBookPack()).revision).not.toBe(first.revision);
});
test('invalid edition metadata never publishes', async () => {
  getBooksWithMaxChapters.mockResolvedValue([]);
  await expect(buildBookPack()).rejects.toThrow('Invalid edition');
  expect(writeHeadingPackObject).not.toHaveBeenCalled();
});
test('failed immutable upload never replaces the manifest', async () => {
  writeHeadingPackObject.mockRejectedValueOnce(new Error('storage unavailable'));
  await expect(buildBookPack()).rejects.toThrow('storage unavailable');
  expect(writeHeadingPackObject).toHaveBeenCalledTimes(1);
});
