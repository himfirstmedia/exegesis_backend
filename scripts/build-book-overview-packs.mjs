import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';

config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });
const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log('Usage: npm run build:book-overview-packs -- [--all | --languages en,fr] [--concurrency 2] [--provider google-free|runtime] [--dry-run]');
  console.log('Reads backend/.env and DB prologues directly. Default: all 39 languages, Google free. Dry run reads source only, with no translations/R2 writes.');
} else {
  let cache; let prisma;
  const controller = new AbortController();
  const stop = () => {
    if (controller.signal.aborted) process.exit(130);
    console.warn('Stopping; completed book translations/checkpoints are retained.');
    controller.abort();
  };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
  try {
    const data = await import('../src/modules/book-prologues/pack-data.js');
    prisma = (await import('../src/config/db.js')).prisma;
    let languages = data.overviewLanguages, concurrency = 2, provider = process.env.BOOK_OVERVIEW_PACK_PROVIDER || 'google-free', dryRun = false;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--all') languages = data.overviewLanguages;
      else if (args[i] === '--languages') languages = [...new Set((args[++i] || '').split(',').map(value => value.trim()).filter(Boolean))];
      else if (args[i] === '--concurrency') concurrency = Number(args[++i]);
      else if (args[i] === '--provider') provider = args[++i];
      else if (args[i] === '--dry-run') dryRun = true;
      else throw new Error('Unknown argument; use --help');
    }
    if (!languages.length || languages.some(language => !data.overviewLanguages.includes(language))) throw new Error('Unsupported overview language');
    if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 4) throw new Error('Concurrency must be 1–4');
    if (!['google-free', 'runtime'].includes(provider)) throw new Error('Provider must be google-free or runtime');
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
    const snapshot = await data.readOverviewSnapshot();
    console.log(`DB source: ${Object.keys(snapshot.books).length} overviews; ${snapshot.missingBooks.length} missing; revision ${snapshot.revision}`);
    if (snapshot.missingBooks.length) console.log(`Missing source books: ${snapshot.missingBooks.join(', ')}`);
    if (!dryRun) {
      const storage = await import('../src/services/objectStorage.js');
      if (!storage.isObjectStorageConfigured()) throw new Error('Configure R2 in backend/.env before publishing');
      cache = (await import('../src/services/cacheService.js')).cache;
      if (!(await cache.waitUntilReady())) console.warn('Redis unavailable: use one backend/publisher process only.');
      const { overviewTranslator } = await import('../src/modules/book-prologues/pack-worker.js');
      const { buildOverviewPack, overviewFailureReason } = await import('../src/modules/book-prologues/pack-builder.js');
      const translate = await overviewTranslator(provider);
      const { runOverviewBuildQueue } = await import('./overview-build-queue.mjs');
      const result = await runOverviewBuildQueue({ languages, concurrency, signal: controller.signal,
        waitForCooldown: translate?.waitForCooldown,
        onProviderWait: item => console.warn(`Google free cooldown ${item.cooldown}/${item.maxCooldowns}: ${item.reason}; waiting ${Math.ceil(item.milliseconds / 1000)} seconds before retrying. No requests during cooldown. Ctrl+C is safe.`),
        build: language => buildOverviewPack(language, { snapshot, translate, signal: controller.signal,
          onProgress: item => console.log(`[${language}] ${item.bookName}: ${item.completed}/${item.total}`),
          onRetry: item => console.log(`[${language}] ${item.bookName}: retry ${item.attempt}/3 for chunk #${item.index} ${item.field}.${item.key} (${item.reason})`),
          onWarning: item => console.warn(`[${language}] ${item.bookName}: chunk #${item.index} ${item.field}.${item.key} — ${item.reason}`),
        }),
        onResult: (language, value) => console.log(`[${language}] Published ${value.bookCount} overviews; ${value.revision}${value.reused ? ' (reused)' : ''}`),
        onFailure: (language, error, details) => {
          if (details?.cooldownExhausted) console.error(`[${language}] PROVIDER_COOLDOWN: provider still unavailable after bounded cooldowns. Checkpoints retained; retry later, not in a tight loop.`);
          else console.error(`[${language}] FAILED: ${overviewFailureReason(error)}; checkpoint retained. Retry the same command.`);
        },
      });
      if (result.providerStopped) console.error(`${result.unattempted} language(s) remain after provider shutdown. Re-run the same command later to resume.`);
      if (result.failed) process.exitCode = 1;
    }
  } catch {
    // DB/provider errors can embed connection strings. Never echo raw errors.
    console.error('Overview build failed. Check DB/R2 connectivity and arguments (--help). No incomplete pack was advertised.');
    process.exitCode = 1;
  } finally {
    cache?.disconnect();
    await prisma?.$disconnect();
    process.off('SIGINT', stop); process.off('SIGTERM', stop);
    if (controller.signal.aborted) process.exit(130);
  }
}
