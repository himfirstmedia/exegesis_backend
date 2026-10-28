jest.mock('../../config/db.js', () => ({ prisma: {} }));
jest.mock('../../services/objectStorage.js', () => ({ readHeadingPackObject: jest.fn(), getHeadingPackObjectStream: jest.fn(), resolveHeadingPackUrl: jest.fn(() => 'https://cdn.example/overview.json') }));
import { readHeadingPackObject, getHeadingPackObjectStream } from '../../services/objectStorage.js';
import { getOverviewPackManifest, downloadOverviewPack } from './packs.js';
const response = () => { const res = {}; for (const name of ['set', 'status', 'json']) res[name] = jest.fn(() => res); return res; };
beforeEach(() => jest.clearAllMocks());
test('public manifest advertises only published data and supports revision checks', async () => {
  readHeadingPackObject.mockResolvedValue({ language: 'fr', revision: 'abcdef123456', bookCount: 46 });
  const res = response();
  await getOverviewPackManifest({ params: { language: 'fr' }, query: { revision: 'abcdef123456' } }, res);
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'ready', unchanged: true, url: 'https://cdn.example/overview.json' }));
  expect(res.set).toHaveBeenCalledWith('Cache-Control', 'no-store');
});
test('missing packs and storage outages are explicit; path traversal is rejected', async () => {
  const res = response();
  readHeadingPackObject.mockResolvedValue(null);
  await getOverviewPackManifest({ params: { language: 'fr' }, query: {} }, res);
  expect(res.status).toHaveBeenLastCalledWith(404);
  readHeadingPackObject.mockRejectedValue(new Error('secret storage URL'));
  await getOverviewPackManifest({ params: { language: 'fr' }, query: {} }, res);
  expect(res.json).toHaveBeenLastCalledWith({ status: 'unavailable' });
  await downloadOverviewPack({ params: { language: '../en' }, query: { revision: 'abcdef123456' } }, res);
  expect(res.status).toHaveBeenLastCalledWith(400);
  expect(getHeadingPackObjectStream).not.toHaveBeenCalled();
});
