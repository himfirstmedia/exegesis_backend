jest.mock('../../services/objectStorage.js', () => ({
  readHeadingPackObject: jest.fn(), writeHeadingPackObject: jest.fn(),
  resolveHeadingPackUrl: jest.fn(key => `https://cdn.example.com/${key}`),
  getHeadingPackObjectStream: jest.fn(),
}));
jest.mock('../../utils/translator.js', () => ({ translateMany: jest.fn() }));

import {
  requestHeadingPack, requestHeadingPackManifest, HEADING_PACK_REVISION, downloadHeadingPack, downloadHeadingPackFile,
} from './heading-packs.js';
import { readHeadingPackObject, writeHeadingPackObject, getHeadingPackObjectStream } from '../../services/objectStorage.js';
import { translateMany } from '../../utils/translator.js';

const manifest = language => ({ headingSet: 'bsb', language, revision: HEADING_PACK_REVISION, totalBooks: 66 });
beforeEach(() => {
  jest.clearAllMocks();
  readHeadingPackObject.mockResolvedValue(null);
});

test('legacy English endpoint is bundled without storage or translation', async () => {
  expect((await requestHeadingPack('en')).data.books.Genesis['1'][0].heading).toBe('The Creation');
  expect((await requestHeadingPack('en', HEADING_PACK_REVISION)).data.unchanged).toBe(true);
  expect(translateMany).not.toHaveBeenCalled();
  expect(readHeadingPackObject).not.toHaveBeenCalled();
});

test('rejects unsupported/path-traversal languages before storage access', async () => {
  expect((await requestHeadingPackManifest('../fr')).code).toBe(400);
  expect((await requestHeadingPack('zzz')).code).toBe(400);
  expect(readHeadingPackObject).not.toHaveBeenCalled();
});

test('missing languages never generate translations in response to a user request', async () => {
  expect((await requestHeadingPackManifest('es')).code).toBe(404);
  expect((await requestHeadingPack('es')).code).toBe(404);
  expect(translateMany).not.toHaveBeenCalled();
  expect(writeHeadingPackObject).not.toHaveBeenCalled();
});

test('returns a tiny manifest pointing at a complete whole-Bible CDN file', async () => {
  readHeadingPackObject.mockResolvedValue(manifest('fr'));
  const result = await requestHeadingPackManifest('fr');
  expect(result.code).toBe(200);
  expect(result.data).toMatchObject({ status: 'ready', language: 'fr', unchanged: false,
    url: `https://cdn.example.com/heading-packs/bsb-${HEADING_PACK_REVISION}/fr.json`,
  });
  expect(result.data.books).toBeUndefined();
  expect(translateMany).not.toHaveBeenCalled();
});

test('recognizes an installed revision without downloading the pack', async () => {
  readHeadingPackObject.mockResolvedValue(manifest('sw'));
  expect((await requestHeadingPackManifest('sw', HEADING_PACK_REVISION)).data.unchanged).toBe(true);
  expect(readHeadingPackObject).toHaveBeenCalledWith(`heading-packs/bsb-${HEADING_PACK_REVISION}/sw-manifest.json`);
});

test('storage outages return a retryable HTTP status', async () => {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  readHeadingPackObject.mockRejectedValue(new Error('R2 down'));
  const res = { set: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn() };
  await downloadHeadingPack({ params: { language: 'pt' }, query: {} }, res);
  expect(res.status).toHaveBeenCalledWith(503);
  spy.mockRestore();
});

test('private bucket fallback streams gzip with immutable caching and no translation', async () => {
  const body = { on: jest.fn(), pipe: jest.fn() };
  getHeadingPackObjectStream.mockResolvedValue({ body, contentEncoding: 'gzip', contentLength: 123 });
  const res = { set: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn() };
  await downloadHeadingPackFile({ params: { language: 'fr' }, query: { revision: HEADING_PACK_REVISION } }, res);
  expect(res.set).toHaveBeenCalledWith('Content-Encoding', 'gzip');
  expect(res.set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=31536000, immutable');
  expect(body.pipe).toHaveBeenCalledWith(res);
});

test('file fallback rejects invalid revision paths', async () => {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  await downloadHeadingPackFile({ params: { language: 'fr' }, query: { revision: '../secret' } }, res);
  expect(res.status).toHaveBeenCalledWith(400);
  expect(getHeadingPackObjectStream).not.toHaveBeenCalled();
});
