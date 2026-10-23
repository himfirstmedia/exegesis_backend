import { BIBLE_BOOK_NAMES } from '../modules/bible/bookNames.js';

/**
 * English book names that are legitimate aliases in authored prose. The
 * canonical key is the form stored in the database and used by the app.
 */
const BOOK_ALIASES = {
  Psalm: 'Psalms',
  'Song of Songs': 'Song of Solomon',
  Canticles: 'Song of Solomon',
  'Revelation of John': 'Revelation',
};

const canonical = name => BOOK_ALIASES[name] || name;

const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Longest names first so "1 John" is replaced before "John", and "Psalms"
// before "Psalm". Word boundaries keep "Markets" and "Actors" untouched.
const NAMES = [...new Set([
  ...Object.keys(BIBLE_BOOK_NAMES.en),
  ...Object.keys(BOOK_ALIASES),
])].sort((a, b) => b.length - a.length);

const PATTERNS = new Map(NAMES.map(name => [
  name,
  new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(name)}(?=$|[^\\p{L}\\p{N}])`, 'gu'),
]));

/**
 * Replace English book names that the translation provider left behind in
 * translated reader prose (for example "Psalm 105" or "1 Chronicles 16:8").
 *
 * Only call this on translated prose. Canonical metadata, scripture text and
 * original-language values are never passed through this helper.
 */
export function localizeBookNames(text, language) {
  if (typeof text !== 'string' || !text) return text;
  const code = String(language || 'en').trim().toLowerCase().split(/[-_]/)[0];
  if (!code || code === 'en') return text;

  const names = BIBLE_BOOK_NAMES[code];
  if (!names) return text;

  let result = text;
  for (const name of NAMES) {
    const key = canonical(name);
    const localized = names[key] || BIBLE_BOOK_NAMES.en[key] || name;
    if (!localized || localized === name) continue;
    result = result.replace(PATTERNS.get(name), (_match, prefix) => `${prefix}${localized}`);
  }
  return result;
}
