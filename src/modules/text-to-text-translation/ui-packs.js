import { readUiPackObject, resolveUiPackUrl, getHeadingPackObjectStream } from '../../services/objectStorage.js';
import { uiSource, uiLanguages, uiPackKeys } from './ui-pack-data.js';

// Public authored copy only. Browsers use this revisioned index to consume the
// same published packs as native clients without coupling their release dates.
export function getUiPackSource(_req, res) {
  res.set('Cache-Control', 'public, max-age=300');
  return res.json(uiSource);
}

export async function getUiPackManifest(req, res) {
  const { language } = req.params;
  if (!uiLanguages.includes(language)) return res.status(400).json({ status: 'unsupported' });
  if (req.query.sourceRevision !== uiSource.revision) return res.status(409).json({ status: 'source-mismatch' });
  try {
    const manifest = await readUiPackObject(uiPackKeys(language).manifest);
    if (manifest?.revision !== uiSource.revision || manifest.language !== language || manifest.totalTexts !== uiSource.texts.length) return res.status(404).json({ status: 'not-published' });
    res.set('Cache-Control', 'no-store');
    return res.json({ ...manifest, status: 'ready', unchanged: req.query.revision === manifest.revision,
      url: resolveUiPackUrl(uiPackKeys(language).final, language, manifest.revision) });
  } catch { return res.status(503).json({ status: 'unavailable' }); }
}
export async function downloadUiPack(req, res) {
  const { language } = req.params;
  const { revision } = req.query;
  if (!uiLanguages.includes(language) || typeof revision !== 'string' || !/^[a-f0-9]{12}$/.test(revision)) return res.status(400).json({ status: 'unsupported' });
  try {
    const file = await getHeadingPackObjectStream(uiPackKeys(language, revision).final);
    if (!file) return res.status(404).json({ status: 'not-published' });
    res.set('Content-Type', 'application/json; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    if (file.contentEncoding) res.set('Content-Encoding', file.contentEncoding);
    if (file.contentLength !== undefined) res.set('Content-Length', String(file.contentLength));
    file.body.on('error', error => res.destroy(error));
    file.body.pipe(res);
  } catch { return res.status(503).json({ status: 'unavailable' }); }
}
