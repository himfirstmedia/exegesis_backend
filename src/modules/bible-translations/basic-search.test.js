jest.mock('./service.js', () => ({ searchXmlVerses: jest.fn(), BOOK_NAMES: { 1: 'Genesis', 43: 'John' } }));
jest.mock('../../config/db.js', () => ({ prisma: {} }));
jest.mock('../../utils/translator.js', () => ({ translateText: jest.fn() }));
jest.mock('./translation.js', () => ({}));
import { basicSearch } from './controller.js';
import { searchXmlVerses } from './service.js';
const response = () => { const res = { status: jest.fn(), json: jest.fn() }; res.status.mockReturnValue(res); return res; };
beforeEach(() => jest.clearAllMocks());
test('free basic search has bounded filters and pagination without account lookup', async () => {
  searchXmlVerses.mockResolvedValue({ total: 12, data: [{ book_name: 'John', verse_text: 'love' }] });
  const res = response();
  await basicSearch({ body: { translationId: 'KJV', query: ' love ', bookName: 'John', covenant: 'nt', limit: 5, offset: 5 } }, res);
  expect(searchXmlVerses).toHaveBeenCalledWith('KJV', 'love', { bookName: 'John', covenant: 'nt', limit: 5, offset: 5 });
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ returnCode: 200, returnData: expect.objectContaining({ total: 12, page: 2 }) }));
});
test.each([{ query: 'a' }, { translationId: '../KJV' }, { limit: 1000 }, { offset: -1 }, { covenant: 'bad' }, { bookName: 'unknown' }])('invalid requests do not scan XML: %j', patch => {
  const res = response();
  return basicSearch({ body: { translationId: 'KJV', query: 'love', ...patch } }, res).then(() => {
    expect(res.status).toHaveBeenCalledWith(400); expect(searchXmlVerses).not.toHaveBeenCalled();
  });
});
