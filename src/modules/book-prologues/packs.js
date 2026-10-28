// Read-only public delivery; no DB reads or translation in the download path.
import { readHeadingPackObject, getHeadingPackObjectStream, resolveHeadingPackUrl } from '../../services/objectStorage.js';
import { overviewLanguages, overviewManifestKey, overviewPackKey } from './pack-data.js';

export async function getOverviewPackManifest(req, res) {
  const { language } = req.params;
  if (!overviewLanguages.includes(language)) return res.status(400).json({ status: 'unsupported' });
  res.set('Cache-Control', 'no-store');
  try {
    const manifest = await readHeadingPackObject(overviewManifestKey(language));
    if (!manifest || manifest.language !== language || !/^[a-f0-9]{12}$/.test(manifest.revision)) return res.status(404).json({ status: 'not-published' });
    return res.json({ ...manifest, status: 'ready', unchanged: req.query.revision === manifest.revision,
      url: resolveHeadingPackUrl(overviewPackKey(manifest.revision, language), language, manifest.revision) });
  } catch { return res.status(503).json({ status: 'unavailable' }); }
}

export async function downloadOverviewPack(req, res) {
  const { language } = req.params;
  const revision = req.query.revision;
  if (!overviewLanguages.includes(language) || typeof revision !== 'string' || !/^[a-f0-9]{12}$/.test(revision)) return res.status(400).json({ status: 'invalid-request' });
  try {
    const file = await getHeadingPackObjectStream(overviewPackKey(revision, language));
    if (!file) return res.status(404).json({ status: 'not-published' });
    res.set('Content-Type', 'application/json; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    if (file.contentEncoding) res.set('Content-Encoding', file.contentEncoding);
    file.body.on('error', error => res.destroy(error));
    file.body.pipe(res);
  } catch { return res.status(503).json({ status: 'unavailable' }); }
}
