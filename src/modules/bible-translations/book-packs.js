import { readHeadingPackObject, getHeadingPackObjectStream, resolveHeadingPackUrl } from '../../services/objectStorage.js';

export async function getBookPackManifest(req, res) {
  try {
    const manifest = await readHeadingPackObject('book-packs/manifest.json');
    res.set('Cache-Control', 'no-store');
    if (!manifest || !/^[a-f0-9]{12}$/.test(manifest.revision)) return res.status(404).json({ status: 'not-published' });
    return res.json({ ...manifest, status: 'ready', unchanged: req.query.revision === manifest.revision,
      url: resolveHeadingPackUrl(`book-packs/${manifest.revision}/catalog.json`, 'en', manifest.revision) });
  } catch { return res.status(503).json({ status: 'unavailable' }); }
}

export async function downloadBookPack(req, res) {
  const revision = req.query.revision;
  if (typeof revision !== 'string' || !/^[a-f0-9]{12}$/.test(revision)) return res.status(400).json({ status: 'invalid-revision' });
  try {
    const file = await getHeadingPackObjectStream(`book-packs/${revision}/catalog.json`);
    if (!file) return res.status(404).json({ status: 'not-published' });
    res.set('Content-Type', 'application/json; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    if (file.contentEncoding) res.set('Content-Encoding', file.contentEncoding);
    file.body.on('error', error => res.destroy(error));
    file.body.pipe(res);
  } catch { return res.status(503).json({ status: 'unavailable' }); }
}
