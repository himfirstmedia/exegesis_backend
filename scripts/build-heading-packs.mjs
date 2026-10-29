import 'dotenv/config';
import { getGoogleTranslateMode, translateWithGoogle } from './google-translate.mjs';

const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log('Usage: npm run build:heading-packs -- [--languages en,fr,sw | --all] [--concurrency 2]');
  console.log('Pre-generates and publishes complete packs. Existing packs/checkpoints are reused, and unchanged headings are carried across revisions so only new or edited headings are translated. Default: all languages, concurrency 2.');
} else {
  let cache;
  try {
    const [{ headingLanguages }, { buildHeadingPack }, cacheModule] = await Promise.all([
      import('../src/modules/bible-translations/heading-pack-data.js'),
      import('../src/modules/bible-translations/heading-pack-builder.js'),
      import('../src/services/cacheService.js'),
    ]);
    cache = cacheModule.cache;
    let languages = headingLanguages;
    let concurrency = 2;
    for (let index = 0; index < args.length; index++) {
      const arg = args[index];
      if (arg === '--all') continue;
      if (arg === '--languages') {
        languages = [...new Set((args[++index] || '').split(',').map(code => code.trim()).filter(Boolean))];
        if (!languages.length || languages.some(code => !headingLanguages.includes(code))) throw new Error('Choose supported language codes, e.g. --languages en,fr,sw');
      } else if (arg === '--concurrency') {
        concurrency = Number(args[++index]);
        if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 8) throw new Error('Concurrency must be between 1 and 8');
      } else throw new Error(`Unknown argument: ${arg}`);
    }
    const pending = [...languages];
    // Google Translate (free widget endpoint by default) translates up to 128
    // headings per request, so building packs is much faster than the runtime
    // provider chain and writes results straight to R2.
    const googleMode = getGoogleTranslateMode();
    const builderOptions = {
      translate: (texts, language) => translateWithGoogle(texts, language),
    };
    console.log(`Translation provider: Google Translate (${googleMode} mode)`);
    if (!(await cache.waitUntilReady())) {
      console.warn('Redis unavailable: run only one builder process to avoid duplicate generation.');
    }
    let failed = 0;
    await Promise.all(Array.from({ length: Math.min(concurrency, pending.length) }, async () => {
      while (pending.length) {
        const language = pending.shift();
        try {
          const result = await buildHeadingPack(language, progress => {
            console.log(`[${language}] ${progress.completedBooks}/${progress.totalBooks}: ${progress.book}`);
          }, builderOptions);
          console.log(`[${language}] Published ${result.totalBooks} books (${result.bytes} bytes), revision ${result.revision}${result.reused ? ' — reused existing translations' : ''}`);
        } catch (error) {
          failed++;
          console.error(`[${language}] FAILED: ${error.message}`);
        }
      }
    }));
    console.log(`Heading packs: ${languages.length - failed} published, ${failed} failed. Re-run to resume failures.`);
    if (failed) process.exitCode = 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    cache?.disconnect();
  }
}
