// These grammar terms genuinely have the same spelling in English and the
// target language. Do not generalize this exception to prose or other targets:
// accepting e.g. unchanged "plural" for Hindi would expose an English fallback.
const COGNATES = {
  es: { number: ['singular', 'plural'] },
  pt: { number: ['singular', 'plural'] },
  fr: { gender: ['masculine'] },
  ro: { number: ['singular', 'plural'], partOfSpeech: ['verb', 'adverb'] },
  de: { number: ['singular', 'plural'] },
};

export function isGrammarCognate(key, text, language) {
  return COGNATES[language]?.[key]?.includes(text.trim().toLowerCase()) === true;
}
