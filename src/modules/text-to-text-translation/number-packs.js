import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { readHeadingPackObject, getHeadingPackObjectStream, resolveHeadingPackUrl } from '../../services/objectStorage.js';

const dir = (() => { try { return path.dirname(fileURLToPath(import.meta.url)); } catch { return __dirname; } })();
export const numberLocales = JSON.parse(fs.readFileSync(path.join(dir, 'number-locales.json'), 'utf8'));
const hash = value => createHash('sha256').update(value).digest('hex');
export function makeNumberPack(language) {
  if (!Object.hasOwn(numberLocales, language)) return null;
  const [locale, numberingSystem, digits] = numberLocales[language];
  if (Array.from(digits).length !== 10 || new Set(Array.from(digits)).size !== 10) throw new Error('Invalid digit mapping');
  const config = { schemaVersion: 1, language, locale, numberingSystem, digits };
  const revision = hash(JSON.stringify(config)).slice(0, 12);
  const pack = { ...config, revision };
  const text = JSON.stringify(pack);
  return { pack, text, manifest: { schemaVersion: 1, language, revision, sha256: hash(text), bytes: Buffer.byteLength(text) } };
}
export const numberPackKey = (language, revision) => `number-packs/${revision}/${language}.json`;
export const numberManifestKey = language => `number-packs/manifests/${language}.json`;

export async function getNumberPackManifest(req, res) {
  const current = makeNumberPack(req.params.language);
  if (!current) return res.status(400).json({ status: 'unsupported' });
  const { language, revision } = current.manifest;
  let url = `/translation/number-packs/${language}/file?revision=${revision}`;
  // Bundled deterministic data is immediately downloadable even before its
  // optional CDN publication. Never call a translator or write to R2 here.
  try {
    const published = await readHeadingPackObject(numberManifestKey(language));
    if (published?.revision === revision && published.sha256 === current.manifest.sha256) url = resolveHeadingPackUrl(numberPackKey(language, revision), language, revision);
  } catch { /* The packaged static fallback remains usable during R2 outages. */ }
  res.set('Cache-Control', 'no-store');
  return res.json({ ...current.manifest, status: 'ready', unchanged: req.query.revision === revision, url });
}
export async function downloadNumberPack(req, res) {
  const current = makeNumberPack(req.params.language);
  const revision = req.query.revision;
  if (!current || typeof revision !== 'string' || !/^[a-f0-9]{12}$/.test(revision)) return res.status(400).json({ status: 'invalid-request' });
  res.set('Content-Type', 'application/json; charset=utf-8');
  if (revision === current.manifest.revision) {
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    return res.send(current.text);
  }
  try {
    const file = await getHeadingPackObjectStream(numberPackKey(req.params.language, revision));
    if (!file) return res.status(404).json({ status: 'not-published' });
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    if (file.contentEncoding) res.set('Content-Encoding', file.contentEncoding);
    file.body.on('error', error => res.destroy(error));
    file.body.pipe(res);
  } catch { return res.status(503).json({ status: 'unavailable' }); }
}
