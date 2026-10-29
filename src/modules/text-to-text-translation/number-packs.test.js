jest.mock('../../services/objectStorage.js', () => ({ readHeadingPackObject: jest.fn(), getHeadingPackObjectStream: jest.fn(), resolveHeadingPackUrl: jest.fn(() => 'https://cdn.example/number.json') }));
import { createHash } from 'node:crypto';
import { numberLocales, makeNumberPack, getNumberPackManifest, downloadNumberPack } from './number-packs.js';
import { readHeadingPackObject, getHeadingPackObjectStream } from '../../services/objectStorage.js';
import { uiLanguages } from './ui-pack-data.js';
const response = () => { const res = { status: jest.fn(), json: jest.fn(), set: jest.fn(), send: jest.fn() }; res.status.mockReturnValue(res); return res; };
beforeEach(() => jest.clearAllMocks());
test('all 39 languages have complete deterministic revisioned packs, without translation', () => {
  expect(Object.keys(numberLocales).sort()).toEqual([...uiLanguages].sort());
  for (const language of uiLanguages) {
    const result = makeNumberPack(language);
    expect(new Set(Array.from(result.pack.digits)).size).toBe(10);
    expect(result.manifest.sha256).toBe(createHash('sha256').update(result.text).digest('hex'));
    expect(makeNumberPack(language)).toEqual(result);
  }
});
test('bundled fallback is downloadable without R2 publication or provider calls', async () => {
  readHeadingPackObject.mockRejectedValue(new Error('R2 unavailable'));
  const res = response(); const current = makeNumberPack('bn');
  await getNumberPackManifest({ params: { language: 'bn' }, query: {} }, res);
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'ready', sha256: current.manifest.sha256, url: expect.stringContaining('/translation/number-packs/bn/file') }));
  await downloadNumberPack({ params: { language: 'bn' }, query: { revision: current.manifest.revision } }, res);
  expect(res.send).toHaveBeenCalledWith(current.text);
  expect(getHeadingPackObjectStream).not.toHaveBeenCalled();
});
test('unsafe language/revision cannot read private storage keys', async () => {
  const res = response();
  await downloadNumberPack({ params: { language: 'bn' }, query: { revision: '../private' } }, res);
  expect(res.status).toHaveBeenCalledWith(400);
  expect(makeNumberPack('__proto__')).toBeNull();
  expect(getHeadingPackObjectStream).not.toHaveBeenCalled();
});
