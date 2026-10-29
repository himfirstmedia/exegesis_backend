import 'dotenv/config';
import fs from 'node:fs';
import { numberLocales, makeNumberPack, numberPackKey, numberManifestKey } from '../src/modules/text-to-text-translation/number-packs.js';
import { writeHeadingPackObject, isObjectStorageConfigured } from '../src/services/objectStorage.js';

const args = process.argv.slice(2);
if (args.some(arg => !['--dry-run', '--help'].includes(arg))) throw new Error('Unknown option; use --help');
if (args.includes('--help')) {
  console.log('Usage: npm run build:number-packs -- [--dry-run] (all 39 languages; deterministic static data, no translation provider)');
} else {
  const appSource = new URL('../../app/src/services/numberLocale/number-locales.json', import.meta.url);
  if (fs.existsSync(appSource) && JSON.stringify(JSON.parse(fs.readFileSync(appSource, 'utf8'))) !== JSON.stringify(numberLocales)) throw new Error('App/backend number catalogs differ');
  if (!args.includes('--dry-run') && !isObjectStorageConfigured()) throw new Error('R2 is not configured');
  for (const language of Object.keys(numberLocales)) {
    const { pack, manifest } = makeNumberPack(language);
    if (!args.includes('--dry-run')) {
      await writeHeadingPackObject(numberPackKey(language, manifest.revision), pack, { compress: true, cacheControl: 'public, max-age=31536000, immutable' });
      await writeHeadingPackObject(numberManifestKey(language), manifest, { cacheControl: 'no-cache' });
    }
    console.log(`${language}: ${manifest.revision}, ${manifest.bytes} bytes${args.includes('--dry-run') ? ' (dry run)' : ' published'}`);
  }
}
