import 'dotenv/config';

const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log('Usage: npm run build:ui-packs -- --languages en,fr,sw [--concurrency 2] [--provider runtime|google-free]');
  console.log('Explicit --all builds all languages. Runtime uses the /translation/batch service chain. Existing checkpoints are resumed.');
} else {
  let cache;
  const controller = new AbortController();
  let interrupted = false;
  const stop = () => {
    if (interrupted) process.exit(130);
    interrupted = true;
    console.warn('Stopping builders and releasing owned locks; checkpoints are retained. Press Ctrl+C again to force exit.');
    controller.abort();
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  try {
    const [{ uiLanguages }, { buildUiPack }, cacheModule] = await Promise.all([
      import('../src/modules/text-to-text-translation/ui-pack-data.js'),
      import('../src/modules/text-to-text-translation/ui-pack-builder.js'),
      import('../src/services/cacheService.js'),
    ]);
    cache = cacheModule.cache;
    let languages = [], concurrency = 2, provider = 'runtime';
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--all') languages = uiLanguages;
      else if (args[i] === '--languages') languages = [...new Set((args[++i] || '').split(',').map(code => code.trim()).filter(Boolean))];
      else if (args[i] === '--concurrency') concurrency = Number(args[++i]);
      else if (args[i] === '--provider') provider = args[++i];
      else throw new Error(`Unknown argument: ${args[i]}`);
    }
    if (!languages.length || languages.some(code => !uiLanguages.includes(code))) throw new Error('Specify supported --languages or --all');
    if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 8) throw new Error('Concurrency must be 1–8');
    if (!['runtime', 'google-free'].includes(provider)) throw new Error('Provider must be runtime or google-free');
    let options = { signal: controller.signal, onWarning: item => console.warn(`[source #${item.index}] ${JSON.stringify(item.source)} — ${item.reason}`) };
    if (provider === 'google-free') {
      // Explicit offline build option only; never changes runtime provider order.
      process.env.GOOGLE_TRANSLATE_MODE = 'free';
      const { translateWithGoogle } = await import('./google-translate.mjs');
      options.translate = (texts, language) => translateWithGoogle(texts, language);
    }
    if (!(await cache.waitUntilReady())) console.warn('Redis unavailable: use one builder process only.');
    const pending = [...languages];
    let failed = 0;
    await Promise.all(Array.from({ length: Math.min(concurrency, pending.length) }, async () => {
      while (pending.length && !controller.signal.aborted) {
        const language = pending.shift();
        try {
          const result = await buildUiPack(language, progress => console.log(`[${language}] ${progress.completed}/${progress.total}`), options);
          console.log(`[${language}] Published ${result.totalTexts} UI strings; revision ${result.revision}${result.reused ? ' (reused)' : ''}`);
        } catch (error) { failed++; console.error(`[${language}] FAILED: ${error.message}`); }
      }
    }));
    if (failed || interrupted) process.exitCode = interrupted ? 130 : 1;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
  finally {
    cache?.disconnect();
    process.off('SIGINT', stop); process.off('SIGTERM', stop);
    // A provider may still have an uncancellable request/timer after abortable
    // released the builder lock. Do not leave that abandoned work running.
    if (interrupted) process.exit(130);
  }
}
