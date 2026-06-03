// Test: verify LibreTranslate fallback works for French
import { translateText } from './src/utils/translator.js';
import { cache } from './src/services/cacheService.js';

const hashStr = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
};

// Clear cache for tested texts
const texts = [
  'The Life of David: A Heart After God',
  'David and Goliath',
  'What made David a good king in his early years?',
  'The Gospel of John: Knowing Jesus',
];

for (const t of texts) {
  const key = hashStr(t) + ':fr';
  await cache.set('translations', key, null, 1);
}

for (const text of texts) {
  const start = Date.now();
  const result = await translateText(text, 'fr');
  const elapsed = Date.now() - start;
  console.log(`FR: "${text.slice(0, 45).padEnd(46)}" → "${result.slice(0, 60)}" (${elapsed}ms)`);
  if (result === text) {
    console.log('  ⚠️  NOT translated - both providers failed!');
  }
}

console.log('\nDone!');
process.exit(0);
