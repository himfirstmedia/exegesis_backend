// Read-only delivery. Translation is deliberately absent from the request path.
import {
  readHeadingPackObject, getHeadingPackObjectStream, resolveHeadingPackUrl,
} from '../../services/objectStorage.js';
import {
  HEADING_PACK_REVISION, headingLanguages, headingPackKeys, headingSource, makeHeadingPack,
} from './heading-pack-data.js';

export { HEADING_PACK_REVISION } from './heading-pack-data.js';
const supported = language => headingLanguages.includes(language);
const unsupported = { code: 400, data: { status: 'unsupported', message: 'Unsupported heading language' } };
const missing = { code: 404, data: {
  status: 'not-published', message: 'This heading language pack has not been published yet', retryAfterSeconds: 300,
} };
const manifests = new Map();

export const requestHeadingPackManifest = async (language, revision) => {
  if (!supported(language)) return unsupported;
  const cached = manifests.get(language);
  const manifest = cached && cached.until > Date.now()
    ? cached.value : await readHeadingPackObject(headingPackKeys(language).manifest);
  if (!manifest || manifest.revision !== HEADING_PACK_REVISION) return missing;
  manifests.set(language, { value: manifest, until: Date.now() + 60000 });
  return { code: 200, data: {
    ...manifest, status: 'ready', unchanged: revision === manifest.revision,
    url: resolveHeadingPackUrl(headingPackKeys(language).final, language, manifest.revision),
  } };
};

// Compatibility endpoint for older apps. It never schedules generation.
export const requestHeadingPack = async (language, revision) => {
  if (!supported(language)) return unsupported;
  const result = language === 'en' ? makeHeadingPack('en', headingSource)
    : await readHeadingPackObject(headingPackKeys(language).final);
  if (!result) return missing;
  return { code: 200, data: revision === HEADING_PACK_REVISION
    ? { status: 'ready', language, revision, unchanged: true }
    : { status: 'ready', ...result } };
};

const jsonHandler = request => async (req, res) => {
  try {
    const result = await request(req.params.language, req.query.revision);
    res.set('Cache-Control', 'no-store');
    return res.status(result.code).json(result.data);
  } catch (error) {
    console.error('[heading-packs] Download failed:', error.message);
    return res.status(503).json({ status: 'unavailable', message: 'Heading pack storage unavailable' });
  }
};

export const downloadHeadingPack = jsonHandler(requestHeadingPack);
export const getHeadingPackManifest = jsonHandler(requestHeadingPackManifest);

/** Private-bucket/local fallback. Public R2 CDN downloads bypass this route. */
export const downloadHeadingPackFile = async (req, res) => {
  const language = req.params.language;
  const revision = req.query.revision || HEADING_PACK_REVISION;
  if (!supported(language) || typeof revision !== 'string' || !/^[a-f0-9]{12}$/.test(revision)) {
    return res.status(400).json(unsupported.data);
  }
  try {
    const file = await getHeadingPackObjectStream(headingPackKeys(language, revision).final);
    if (!file) return res.status(404).json(missing.data);
    res.set('Content-Type', 'application/json; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    if (file.contentEncoding) res.set('Content-Encoding', file.contentEncoding);
    if (file.contentLength !== undefined) res.set('Content-Length', String(file.contentLength));
    file.body.on('error', error => { res.destroy(error); });
    file.body.pipe(res);
  } catch (error) {
    console.error('[heading-packs] File download failed:', error.message);
    return res.status(503).json({ status: 'unavailable' });
  }
};
