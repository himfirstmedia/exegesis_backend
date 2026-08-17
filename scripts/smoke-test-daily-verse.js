/**
 * Smoke test for the daily-verse "Translation not found" fix.
 *
 * Verifies:
 *  1. Aliased ids (NKJV → NKJ) resolve and fetch real verse text.
 *  2. Case variants (kjv, DARBY) resolve.
 *  3. Unbundled translations (WEB) fall back to KJV text instead of empty.
 *  4. Repeated fallback calls warn only once (no log spam).
 *
 * Run: node scripts/smoke-test-daily-verse.js
 */
const translations = await import('../src/modules/bible-translations/service.js');
const bible = await import('../src/modules/bible/service.js');

let failures = 0;
const check = (name, cond, extra = '') => {
  if (cond) {
    console.log(`  PASS  ${name}`);
  } else {
    failures += 1;
    console.log(`  FAIL  ${name} ${extra}`);
  }
};

console.log('1) Alias resolution — NKJV must fetch real text:');
{
  const verse = await translations.getVerse('NKJV', 'Genesis', 1, 1);
  check('NKJV Genesis 1:1 returns text', verse.text.length > 0, `got "${verse.text}"`);
  check('NKJV is the KJV XML content', verse.text.includes('In the beginning'));
}

console.log('2) Case-insensitive ids:');
{
  const verse = await translations.getVerse('kjv', 'John', 3, 16);
  check('lowercase kjv resolves', verse.text.length > 0);
  const darby = await translations.getVerse('DARBY', 'Psalms', 23, 1);
  check('uppercase DARBY resolves', darby.text.length > 0);
}

console.log('3) Unbundled translation (WEB) falls back to KJV text:');
{
  const result = await bible.fetchVerseTextWithFallback(
    'WEB',
    'Genesis',
    1,
    1,
  );
  check('WEB returns KJV fallback text (not empty)', result.text.length > 0, `got "${result.text}"`);
  check(
    'WEB reports effective translation KJV',
    result.translation === 'KJV',
    `got "${result.translation}"`,
  );
}

console.log('4) Fallback warns only once per missing translation:');
{
  // Use a fresh unbundled translation (WEBSTER) so WEB's earlier warning
  // doesn't consume this check's one-time warn.
  const warnSpy = [];
  const originalWarn = console.warn;
  console.warn = (...args) => warnSpy.push(args.join(' '));
  try {
    await bible.fetchVerseTextWithFallback('WEBSTER', 'Genesis', 1, 1);
    await bible.fetchVerseTextWithFallback('WEBSTER', 'John', 1, 1);
    await bible.fetchVerseTextWithFallback('WEBSTER', 'Psalms', 1, 1);
  } finally {
    console.warn = originalWarn;
  }
  const warnings = warnSpy.filter((w) => w.includes('unavailable'));
  check(
    'WEBSTER warned exactly once across 3 calls',
    warnings.length === 1,
    `warned ${warnings.length} time(s): ${warnings.join(' | ')}`,
  );
}

console.log('5) Known translation reports its own id (no fallback label):');
{
  const result = await bible.fetchVerseTextWithFallback(
    'NKJ',
    'Acts',
    16,
    10,
  );
  check('NKJ keeps its translation id', result.translation === 'NKJ', `got "${result.translation}"`);
  check('NKJ Acts 16:10 returns text', result.text.length > 0);
}

console.log('6) Existing seeded translation (NKJ) still fetches via getVerse:');
{
  const verse = await translations.getVerse('NKJ', 'Acts', 16, 10);
  check('NKJ Acts 16:10 returns text', verse.text.length > 0);
}

console.log('7) getTranslationDisplayName for stored id:');
{
  const name = translations.getTranslationDisplayName('NKJV');
  check('NKJV displays as "New King James Version"', name === 'New King James Version', `got "${name}"`);
}

console.log('');
if (failures > 0) {
  console.log(`SMOKE TEST FAILED — ${failures} failure(s)`);
  process.exit(1);
}
console.log('SMOKE TEST PASSED — all daily-verse translation checks OK');
process.exit(0);
