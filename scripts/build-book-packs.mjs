import 'dotenv/config';

if (process.argv.includes('--help')) {
  console.log('Rebuilds all catalogued editions and localized names using existing .env R2 settings. An already published revision is reused instead of rewritten.');
} else {
  let cache;
  try {
    if (process.argv.length > 2) throw new Error('Unknown argument; use --help');
    const storage = await import('../src/services/objectStorage.js');
    if (!storage.isObjectStorageConfigured()) throw new Error('R2 storage is not configured; check backend/.env');
    cache = (await import('../src/services/cacheService.js')).cache;
    const { buildBookPack } = await import('../src/modules/bible-translations/book-pack-builder.js');
    const result = await buildBookPack((id, count) => console.log(`[${id}] ${count} books`));
    console.log(`Published ${result.editionCount} editions; revision ${result.revision}`);
  } catch (error) {
    console.error(`Book pack build failed: ${error.message}`);
    process.exitCode = 1;
  } finally { cache?.disconnect(); }
}
