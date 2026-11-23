/**
 * Admin word studies combine a reader-language gloss with the original-language
 * word and a transliteration, for example:
 *
 *   "Give Thanks — יָדָה (yadah)"
 *   "Returned / Came בּוֹא – bo"
 *
 * The gloss is the part that may be translated; the original script and the
 * transliteration are canonical and must be preserved verbatim. Splitting here
 * (before the reader stream) keeps every surface consistent across Browse
 * lists, Browse details and the Study tab.
 */

// Hebrew (incl. points) and Greek (incl. extended) blocks are canonical words,
// never reader prose.
const ORIGINAL_SCRIPT = /[\u0370-\u03FF\u1F00-\u1FFF\u0590-\u05FF]+/gu;
const LATIN_TEXT = /^[\p{Script=Latin}\p{Script=Common}\p{M}\p{N}\p{P}\p{S}\s]+$/u;

/** Drop an original-language word that was saved inside the English gloss. */
const stripOriginalScript = value => value
  .replace(ORIGINAL_SCRIPT, ' ')
  .replace(/\s+/g, ' ')
  .replace(/^[\s,;:/|·-]+|[\s,;:/|·-]+$/g, '')
  .trim();

export function splitSurfaceText(value) {
  const text = String(value || '').trim();
  if (!text) return { gloss: '', original: '' };
  const split = text.match(/^(.+?)\s+[—–-]\s+(.+)$/u);
  if (split) {
    const leading = split[1].trim();
    const trailing = split[2].trim();
    const gloss = stripOriginalScript(leading);
    // Keep the raw leading text if stripping removed everything, so a card is
    // never left without a label.
    return gloss ? { gloss, original: trailing } : { gloss: leading, original: trailing };
  }
  return LATIN_TEXT.test(text)
    ? { gloss: text, original: '' }
    : { gloss: '', original: text };
}

export const withSurfaceGloss = item => {
  if (!item || typeof item !== 'object' || typeof item.surfaceText !== 'string') return item;
  const { gloss, original } = splitSurfaceText(item.surfaceText);
  return { ...item, surfaceTextGloss: gloss, surfaceTextOriginal: original };
};

export const withStrongsGloss = data => {
  if (!data || typeof data !== 'object') return data;
  const next = { ...data };
  if (Array.isArray(next.contextualStudies)) {
    next.contextualStudies = next.contextualStudies.map(withSurfaceGloss);
  }
  if (Array.isArray(next.verseReferences)) {
    next.verseReferences = next.verseReferences.map(withSurfaceGloss);
  } else if (typeof next.verseReferences === 'string' && next.verseReferences.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(next.verseReferences);
      if (Array.isArray(parsed)) next.verseReferences = JSON.stringify(parsed.map(withSurfaceGloss));
    } catch { /* Keep malformed legacy JSON canonical. */ }
  }
  return next;
};
