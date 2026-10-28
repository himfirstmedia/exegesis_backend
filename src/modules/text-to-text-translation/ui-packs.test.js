jest.mock('../../services/objectStorage.js', () => ({ readUiPackObject: jest.fn(), resolveUiPackUrl: jest.fn(() => 'https://cdn.example/ui.json'), getHeadingPackObjectStream: jest.fn() }));
import { getUiPackManifest, downloadUiPack } from './ui-packs.js';
import { uiSource } from './ui-pack-data.js';
import { readUiPackObject, getHeadingPackObjectStream } from '../../services/objectStorage.js';
const response = () => { const res = { status: jest.fn(), json: jest.fn(), set: jest.fn() }; res.status.mockReturnValue(res); return res; };
beforeEach(() => jest.clearAllMocks());
test('ready manifest supplies immutable file URL and unchanged revision', async () => {
  readUiPackObject.mockResolvedValue({ language: 'fr', revision: uiSource.revision, totalTexts: uiSource.texts.length });
  const res = response();
  await getUiPackManifest({ params: { language: 'fr' }, query: { sourceRevision: uiSource.revision, revision: uiSource.revision } }, res);
  expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'ready', unchanged: true, url: 'https://cdn.example/ui.json' }));
});
test('unpublished language, incompatible app sources and invalid language never trigger generation', async () => {
  readUiPackObject.mockResolvedValue(null);
  for (const [language, sourceRevision, status] of [['fr', uiSource.revision, 404], ['fr', 'old-source', 409], ['../fr', uiSource.revision, 400]]) {
    const res = response(); await getUiPackManifest({ params: { language }, query: { sourceRevision } }, res);
    expect(res.status).toHaveBeenCalledWith(status);
  }
});
test('rejects unsafe file revisions before touching storage', async () => {
  const res = response(); await downloadUiPack({ params: { language: 'fr' }, query: { revision: '../private' } }, res);
  expect(res.status).toHaveBeenCalledWith(400);
  expect(getHeadingPackObjectStream).not.toHaveBeenCalled();
});
