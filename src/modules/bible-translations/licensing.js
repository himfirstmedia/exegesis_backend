/**
 * Licence registry for the Bible translations the backend ships.
 *
 * Every translation the API serves must carry a licence record so that:
 *   1. the catalogue can tell clients who to credit, and
 *   2. `scripts/check-bible-licenses.mjs` can fail the build if a
 *      translation is added without a reviewed licence record.
 *
 * The licence text is taken from the `<bible>` header of each XML file
 * (see BIBLE_LICENSE_AUDIT.md for the full audit of the 1048-file source
 * corpus this was derived from).
 */

/** Public-domain / freely-redistributable, no attribution required. */
export const PUBLIC_DOMAIN = 'public-domain';
/** Redistributable, but the client must display the attribution. */
export const ATTRIBUTION = 'attribution';
/** Redistributable only under an agreement with the rights holder. */
export const PERMISSION = 'permission';

export const LICENSE_TYPES = {
  PUBLIC_DOMAIN,
  ATTRIBUTION,
  PERMISSION,
};

/**
 * Translations that ship under a permission agreement rather than a public
 * licence. Each one needs a signed agreement on file before release, and the
 * attribution text must be shown to users.
 */
export const REVIEWED_PERMISSION_TRANSLATIONS = new Set([
  'HindiBible',
  'IndonesianBible',
  'KonkaniBible',
  'KoreanBible',
  'MaithiliBible',
  'MeiteiBible',
  'Nepali2012Bible',
  'SantaliCommonBible',
  'SwahiliBible',
  'SindhiMuslimBible',
  'TagalogBible',
  'TeluguBible',
]);

/**
 * fileId → licence record.
 *
 * `attribution` is the text a client should display next to the translation.
 * `source` is where the text came from, for provenance.
 */
export const TRANSLATION_LICENSES = {
  // ── Public domain ─────────────────────────────────────────────────────────
  EnglishASVBible: {
    license: PUBLIC_DOMAIN,
    attribution: '',
    source: 'American Standard Version (1901)',
  },
  EnglishBereanBible: {
    license: PUBLIC_DOMAIN,
    attribution: 'The Berean Bible has been dedicated to the public domain.',
    source: 'Berean Bible Translation Committee',
  },
  EnglishDarbyBible: {
    license: PUBLIC_DOMAIN,
    attribution: '',
    source: 'J. N. Darby (1890)',
  },
  EnglishKJBible: {
    license: PUBLIC_DOMAIN,
    attribution: '',
    source: 'King James Version (1611)',
  },
  EnglishTyndale1537Bible: {
    license: PUBLIC_DOMAIN,
    attribution: '',
    source: 'William Tyndale (1537)',
  },
  EnglishYLTBible: {
    license: PUBLIC_DOMAIN,
    attribution: '',
    source: "Young's Literal Translation (1898)",
  },
  FrenchBible: {
    license: PUBLIC_DOMAIN,
    attribution: '',
    source: 'Louis Segond (1910)',
  },
  GreekModern1904Bible: {
    license: PUBLIC_DOMAIN,
    attribution: '',
    source: 'Greek Modern Bible (1904)',
  },
  ItalianBible: {
    license: PUBLIC_DOMAIN,
    attribution: '',
    source: 'CEI (1974)',
  },
  JapaneseBible: {
    license: PUBLIC_DOMAIN,
    attribution: '',
    source: 'Colloquial Japanese Bible (1955)',
  },
  RussianBible: {
    license: PUBLIC_DOMAIN,
    attribution: '',
    source: 'Russian Synodal (1876)',
  },
  SpanishBible: {
    license: PUBLIC_DOMAIN,
    attribution: 'Reina-Valera 1909 — Dominio público.',
    source: 'Sociedades Bíblicas Unidas (1909)',
  },
  PortugueseBible: {
    license: PUBLIC_DOMAIN,
    attribution: 'Almeida Revista e Atualizada — versão original em domínio público.',
    source: 'Sociedades Bíblicas Unidas',
  },
  ArabicSVDBible: {
    license: PUBLIC_DOMAIN,
    attribution: '',
    source: 'Arabic SVD (1865)',
  },
  ChineseTraditionalBible: {
    license: PUBLIC_DOMAIN,
    attribution: '',
    source: 'Chinese Union Version (1919)',
  },
  Romanian1928Bible: {
    license: PUBLIC_DOMAIN,
    attribution: 'Public Domain — Unbound Bible, Biola University.',
    source: 'Dumitru Cornilescu (1928)',
  },
  GermanLuther1912Bible: {
    license: PUBLIC_DOMAIN,
    attribution: '',
    source: 'Lutherbibel 1912',
  },
  PolishGdanskBible: {
    license: PUBLIC_DOMAIN,
    attribution: '',
    source: 'Biblia Gdańska 1881-1910',
  },
  Ukrainian1903Bible: {
    license: PUBLIC_DOMAIN,
    attribution: '',
    source: 'Kulish and Puluy (1871)',
  },

  // ── Creative Commons — attribution required ───────────────────────────────
  AssameseBible: {
    license: ATTRIBUTION,
    attribution:
      'Indian Revised Version (IRV) — Assamese, 2019. Licensed under CC BY-SA 4.0.',
    source: 'Bridge Connectivity Solutions / VachanOnline',
  },
  BengaliBible: {
    license: ATTRIBUTION,
    attribution:
      'Indian Revised Version (IRV) — Bengali, 2019. Licensed under CC BY-SA 4.0.',
    source: 'Bridge Connectivity Solutions / VachanOnline',
  },
  DogriBible: {
    license: ATTRIBUTION,
    attribution: 'Licensed under CC BY-SA 4.0.',
    source: 'The Love Fellowship',
  },
  Gujarati2017Bible: {
    license: ATTRIBUTION,
    attribution:
      'Indian Revised Version (IRV) — Gujarati, 2019. Licensed under CC BY-SA 4.0.',
    source: 'Bridge Connectivity Solutions / VachanOnline',
  },
  KannadaIRVBible: {
    license: ATTRIBUTION,
    attribution:
      'Indian Revised Version (IRV) — Kannada, 2019. Licensed under CC BY-SA 4.0.',
    source: 'Bridge Connectivity Solutions / VachanOnline',
  },
  MalayalamBCSBible: {
    license: ATTRIBUTION,
    attribution:
      'Indian Revised Version (IRV) — Malayalam, 2019. Licensed under CC BY-SA 4.0.',
    source: 'Bridge Connectivity Solutions / VachanOnline',
  },
  MarathiIRVMARBible: {
    license: ATTRIBUTION,
    attribution:
      'Indian Revised Version (IRV) — Marathi, 2019. Licensed under CC BY-SA 4.0.',
    source: 'Bridge Connectivity Solutions / VachanOnline',
  },
  OdiaIRV2017Bible: {
    license: ATTRIBUTION,
    attribution:
      'Odia IRV 2017. Released under the Creative Commons Attribution-ShareAlike 4.0 licence.',
    source: 'Bridge Connectivity Solutions',
  },
  PunjabiIRVBible: {
    license: ATTRIBUTION,
    attribution:
      'Indian Revised Version (IRV) — Punjabi, 2019. Licensed under CC BY-SA 4.0.',
    source: 'Bridge Connectivity Solutions / VachanOnline',
  },
  SanskritDevanagariBible: {
    license: ATTRIBUTION,
    attribution:
      'Sanskrit Bible (NT) in Devanagari Script (सत्यवेद). © SanskritBible.in. Licensed under CC BY-SA 4.0.',
    source: 'SanskritBible.in',
  },
  TamilIRVBible: {
    license: ATTRIBUTION,
    attribution:
      'Indian Revised Version (IRV) — Tamil, 2019. Licensed under CC BY-SA 4.0.',
    source: 'Bridge Connectivity Solutions / VachanOnline',
  },
  UrduIRVURDBible: {
    license: ATTRIBUTION,
    attribution:
      'Indian Revised Version (IRV) — Urdu, 2019. Licensed under CC BY-SA 4.0.',
    source: 'Bridge Connectivity Solutions / VachanOnline',
  },
  TurkishYTCBible: {
    license: ATTRIBUTION,
    attribution:
      'Turkish Yorumsuz Türkçe Çeviri (YTC) © 2023-2024 İsmail Serinken and eBible.org. CC BY-ND.',
    source: 'İsmail Serinken / eBible.org',
  },
  EnglishEASYBible: {
    license: ATTRIBUTION,
    attribution:
      'EASY Bible © 2018-2024 Mission Assist. Free to copy and share with attribution.',
    source: 'Mission Assist',
  },
  EnglishGWBible: {
    license: ATTRIBUTION,
    attribution:
      "God's Word © 1995. Free to copy and distribute with attribution.",
    source: "God's Word Translation",
  },
  EnglishTLBible: {
    license: ATTRIBUTION,
    attribution:
      'The Living Bible © 1971 Tyndale House Foundation. Used with permission.',
    source: 'Tyndale House Foundation',
  },

  // ── Permission-based: require a signed agreement with the rights holder ──
  HindiBible: {
    license: PERMISSION,
    attribution: 'Hindi Bible (HHBD) © Bible Society of India.',
    source: 'Bible Society of India',
  },
  IndonesianBible: {
    license: PERMISSION,
    attribution: 'Alkitab Terjemahan Baru © Indonesian Bible Society 1974, 2018.',
    source: 'Indonesian Bible Society',
  },
  KonkaniBible: {
    license: PERMISSION,
    attribution: 'Konkani Goan NT — Novo Korar. © Bible Society of India (2010).',
    source: 'Bible Society of India',
  },
  KoreanBible: {
    license: PERMISSION,
    attribution: '개역한글 (Korean Revised Version) © Korean Bible Society 1961.',
    source: 'Korean Bible Society',
  },
  MaithiliBible: {
    license: PERMISSION,
    attribution:
      'Maithili — Jivən Səndesh © 2010 The Bible Society of India and Wycliffe Bible Translators.',
    source: 'Bible Society of India',
  },
  MeiteiBible: {
    license: PERMISSION,
    attribution:
      'Meitei New Testament (Roman Script) © 2022 The Word For The World International and NECTAR.',
    source: 'The Word For The World International',
  },
  Nepali2012Bible: {
    license: PERMISSION,
    attribution:
      'Nepali New Revised Version © Nepal Bible Society 1997, 2006, 2009, 2012.',
    source: 'Nepal Bible Society',
  },
  SantaliCommonBible: {
    license: PERMISSION,
    attribution:
      'Santali Common Language New Testament © Bangladesh Bible Society (2012).',
    source: 'Bangladesh Bible Society',
  },
  SindhiMuslimBible: {
    license: PERMISSION,
    attribution:
      'Muslim Sindhi Bible © The Pakistan Bible Society (2022). Used with permission.',
    source: 'The Pakistan Bible Society',
  },
  SwahiliBible: {
    license: PERMISSION,
    attribution:
      'Swahili Revised Union Version Bible © Bible Society of Kenya and Bible Society of Tanzania (2005).',
    source: 'Bible Society of Kenya / Tanzania',
  },
  TagalogBible: {
    license: PERMISSION,
    attribution: 'Ang Biblia © Philippine Bible Society (1982).',
    source: 'Philippine Bible Society',
  },
  TeluguBible: {
    license: PERMISSION,
    attribution: 'Telugu Bible (BSI) © Bible Society of India.',
    source: 'Bible Society of India',
  },
};

/**
 * Look up the licence record for a catalogue entry.
 * Returns null when the translation has not been reviewed yet.
 */
export const getTranslationLicense = (fileId) => TRANSLATION_LICENSES[fileId] || null;

/**
 * Whether a translation may be redistributed without a further agreement.
 */
export const isRedistributable = (fileId) => {
  const record = TRANSLATION_LICENSES[fileId];
  if (!record) return false;
  return (
    record.license === PUBLIC_DOMAIN ||
    record.license === ATTRIBUTION ||
    record.license === PERMISSION
  );
};
