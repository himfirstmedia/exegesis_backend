import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseString } from 'xml2js';
import { cache } from '../../services/cacheService.js';
import { discoverBibles } from './discovery.js';
import {
  getTranslationLicense,
  isRedistributable,
} from './licensing.js';

// Module directory — resolves via import.meta in ESM (production) and falls
// back to the CJS-native __dirname under jest's CommonJS transform.
const MODULE_DIR = (() => {
  try {
    return path.dirname(fileURLToPath(import.meta.url));
  } catch {
    return __dirname;
  }
})();
const XML_DIR = path.join(MODULE_DIR, 'Holy-Bible-XML-Format');
const XML_CACHE_VERSION = 'v3';

// Persisted precomputed books/chapters metadata (books, chapter counts, verse
// counts). Built once per translation by scanning the XML, then written to disk
// so subsequent reads (and server restarts) never re-scan the multi-MB files.
const COMMITTED_BOOKS_INDEX_DIR = path.join(MODULE_DIR, 'index');
const GENERATED_BOOKS_INDEX_DIR = process.env.BIBLE_INDEX_CACHE_DIR
  ? path.resolve(process.env.BIBLE_INDEX_CACHE_DIR)
  : path.resolve(MODULE_DIR, '../../../.cache/bible-indexes');
export const __booksIndexDirectories = {
  committed: COMMITTED_BOOKS_INDEX_DIR,
  generated: GENERATED_BOOKS_INDEX_DIR,
};
const booksIndexPromise = new Map(); // fullId -> Promise<books[]>
const booksIndexLoaded = new Map();  // fullId -> books[] (cached copy)
const BOOKS_INDEX_VERSIONS = { BengaliBible: XML_CACHE_VERSION };

const readBooksIndexFromDisk = (filePath) => {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const __persistBooksIndex = async (filePath, books) => {
  try {
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, JSON.stringify(books));
    return true;
  } catch (err) {
    console.error('[BooksIndex] Failed to persist generated index:', err?.message || err);
    return false;
  }
};

/** Returns the precomputed books array for a translation, building + persisting it once. */
const getPrecomputedBooks = async (id, buildFn) => {
  const fullId = toFullId(id);
  if (booksIndexLoaded.has(fullId)) return booksIndexLoaded.get(fullId);
  if (booksIndexPromise.has(fullId)) return booksIndexPromise.get(fullId);

  const indexVersion = BOOKS_INDEX_VERSIONS[fullId];
  const fileName = `${fullId}${indexVersion ? `.${indexVersion}` : ''}.books.json`;
  const generatedPath = path.join(GENERATED_BOOKS_INDEX_DIR, fileName);
  const committedPath = path.join(COMMITTED_BOOKS_INDEX_DIR, fileName);
  const onDisk = readBooksIndexFromDisk(committedPath) || readBooksIndexFromDisk(generatedPath);
  if (onDisk) {
    booksIndexLoaded.set(fullId, onDisk);
    return onDisk;
  }

  const promise = buildFn().then((books) => {
    booksIndexLoaded.set(fullId, books);
    booksIndexPromise.delete(fullId);
    void __persistBooksIndex(generatedPath, books);
    return books;
  });
  booksIndexPromise.set(fullId, promise);
  return promise;
};

// In-memory cache for parsed XML documents — avoids re-parsing the same translation
// XML file on every getVerses/getChapters call. Keyed by full translation ID.
// LRU eviction: keeps the most recently used entries to cap memory.
const PARSED_XML_CACHE_MAX = 5;
const parsedXmlCache = new Map();
const parsedXmlCacheOrder = []; // LRU order, most recent at end

const cacheParsedXml = (fullId, parsed) => {
  if (parsedXmlCache.has(fullId)) return;
  if (parsedXmlCache.size >= PARSED_XML_CACHE_MAX) {
    const oldest = parsedXmlCacheOrder.shift();
    parsedXmlCache.delete(oldest);
  }
  parsedXmlCache.set(fullId, parsed);
  parsedXmlCacheOrder.push(fullId);
};

export const BOOK_NAMES = {
  1: 'Genesis', 2: 'Exodus', 3: 'Leviticus', 4: 'Numbers', 5: 'Deuteronomy',
  6: 'Joshua', 7: 'Judges', 8: 'Ruth', 9: '1 Samuel', 10: '2 Samuel',
  11: '1 Kings', 12: '2 Kings', 13: '1 Chronicles', 14: '2 Chronicles',
  15: 'Ezra', 16: 'Nehemiah', 17: 'Esther', 18: 'Job', 19: 'Psalms',
  20: 'Proverbs', 21: 'Ecclesiastes', 22: 'Song of Solomon', 23: 'Isaiah',
  24: 'Jeremiah', 25: 'Lamentations', 26: 'Ezekiel', 27: 'Daniel',
  28: 'Hosea', 29: 'Joel', 30: 'Amos', 31: 'Obadiah', 32: 'Jonah',
  33: 'Micah', 34: 'Nahum', 35: 'Habakkuk', 36: 'Zephaniah', 37: 'Haggai',
  38: 'Zechariah', 39: 'Malachi',
  40: 'Matthew', 41: 'Mark', 42: 'Luke', 43: 'John', 44: 'Acts',
  45: 'Romans', 46: '1 Corinthians', 47: '2 Corinthians', 48: 'Galatians',
  49: 'Ephesians', 50: 'Philippians', 51: 'Colossians', 52: '1 Thessalonians',
  53: '2 Thessalonians', 54: '1 Timothy', 55: '2 Timothy', 56: 'Titus',
  57: 'Philemon', 58: 'Hebrews', 59: 'James', 60: '1 Peter', 61: '2 Peter',
  62: '1 John', 63: '2 John', 64: '3 John', 65: 'Jude', 66: 'Revelation'
};

export const BOOK_NAME_TO_NUMBER = Object.fromEntries(
  Object.entries(BOOK_NAMES).map(([num, name]) => [name.toLowerCase(), parseInt(num)])
);

// Backwards-compatible hardcoded English short-id map — preserved for tests
// and external consumers that expect a synchronous snapshot of the legacy
// 28 English translations. The auto-discovered catalog (via discovery.js)
// is the source of truth and exposes 1,048 translations.
const LEGACY_HARDCODED_SHORT_IDS = {
  'ASV': 'EnglishASVBible',
  'Amplified': 'EnglishAmplifiedBible',
  'AmplifiedClassic': 'EnglishAmplifiedClassicBible',
  'Berean': 'EnglishBereanBible',
  'CSB': 'EnglishCSBBible',
  'Darby': 'EnglishDarbyBible',
  'EASY': 'EnglishEASYBible',
  'ERV': 'EnglishERVBible',
  'ESV': 'EnglishESVBible',
  'GNT': 'EnglishGNTBible',
  'GW': 'EnglishGWBible',
  'HCSB': 'EnglishHCSBBible',
  'KJV': 'EnglishKJBible',
  'LSB': 'EnglishLSBBible',
  'MEV': 'EnglishMEVBible',
  'NASB': 'EnglishNASBBible',
  'NASU': 'EnglishNASUBible',
  'NET': 'EnglishNETBible',
  'NIRV': 'EnglishNIRVBible',
  'NIV': 'EnglishNIVBible',
  'NLT': 'EnglishNLTBible',
  'NRSV': 'EnglishNRSVBible',
  'Passion': 'EnglishPassionBible',
  'RSV': 'EnglishRSVBible',
  'TL': 'EnglishTLBible',
  'Tyndale': 'EnglishTyndale1537Bible',
  'YLT': 'EnglishYLTBible',
};

// Build the dynamic catalog from the XML directory on module load.
let _catalogCache = null;
let _catalogById = new Map();
let _catalogByFile = new Map();
let _catalogByShortId = new Map();

const buildCatalog = () => {
  if (_catalogCache) return _catalogCache;
  const entries = discoverBibles(XML_DIR);
  _catalogCache = entries;
  for (const e of entries) {
    _catalogById.set(e.shortId, e);
    _catalogByFile.set(e.fileId, e);
    // Maintain a mapping from fileId -> shortId
    _catalogByShortId.set(e.fileId, e.shortId);
  }
  // Merge in the legacy hardcoded shortIds so tests/external consumers
  // that reference "KJV" or "NKJ" still resolve correctly.
  for (const [shortId, fileId] of Object.entries(LEGACY_HARDCODED_SHORT_IDS)) {
    if (!_catalogById.has(shortId)) {
      const entry = _catalogByFile.get(fileId);
      if (entry) {
        _catalogById.set(shortId, entry);
      }
    }
  }
  return entries;
};

buildCatalog();

/** Backwards-compatible SHORT_IDS: a proxy that lazily looks up the dynamic
 *  catalog. Reads like a normal object, but reflects all 1,048 discovered
 *  translations plus the legacy English shortIds. */
export const SHORT_IDS = new Proxy({}, {
  get: (_, shortId) => {
    const entry = _catalogById.get(shortId);
    return entry ? entry.fileId : undefined;
  },
  has: (_, shortId) => _catalogById.has(shortId),
  ownKeys: () => Array.from(_catalogById.keys()),
  getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
});

/** ISO 639-1 language code for a given shortId. */
export const LANGUAGE_CODE = new Proxy({}, {
  get: (_, shortId) => _catalogById.get(shortId)?.language,
  has: (_, shortId) => _catalogById.has(shortId),
});

/** Legacy translation display names + years for the original 28 English versions. */
export const TRANSLATION_DISPLAY_NAMES = {
  'ASV': { name: 'American Standard Version', year: '1901' },
  'Amplified': { name: 'Amplified Bible', year: '2015' },
  'AmplifiedClassic': { name: 'Amplified Classic', year: '1987' },
  'Berean': { name: 'Berean Standard Bible', year: '2016' },
  'CSB': { name: 'Christian Standard Bible', year: '2017' },
  'Darby': { name: "Darby Translation", year: '1890' },
  'EASY': { name: 'Easy-to-Read Version', year: '2024' },
  'ERV': { name: 'English Revised Version', year: '2006' },
  'ESV': { name: 'English Standard Version', year: '2016' },
  'GNT': { name: 'Good News Translation', year: '1992' },
  'GW': { name: "God's Word", year: '1995' },
  'HCSB': { name: 'Holman Christian Standard', year: '2004' },
  'KJV': { name: 'King James Version', year: '1769' },
  'LSB': { name: 'Legacy Standard Bible', year: '2021' },
  'MEV': { name: 'Modern English Version', year: '2014' },
  'NASB': { name: 'New American Standard Bible', year: '1995' },
  'NASU': { name: 'New American Standard Update', year: '1989' },
  'NET': { name: 'NET Bible', year: '2005' },
  'NIRV': { name: 'New International Reader\'s Version', year: '1996' },
  'NIV': { name: 'New International Version', year: '2011' },
  'NLT': { name: 'New Living Translation', year: '2004' },
  'NRSV': { name: 'New Revised Standard Version', year: '1989' },
  'Passion': { name: 'The Passion Translation', year: '2020' },
  'RSV': { name: 'Revised Standard Version', year: '1971' },
  'TL': { name: 'The Living Bible', year: '1971' },
  'Tyndale': { name: 'Tyndale Bible', year: '1537' },
  'YLT': { name: "Young's Literal Translation", year: '1898' },
  'Bengali': { name: 'Indian Revised Version - Bengali', year: '2019' },
  'Arabic': { name: 'Arabic SVD 1865', year: '1865' },
  'ChineseSimplified': { name: 'Chinese Union Version 1919', year: '1919' },
  'German': { name: 'German Luther 1912', year: '1912' },
  'Polish': { name: 'Polish Gdansk 1881-1910', year: '1910' },
  'Romanian': { name: 'Romanian Cornilescu 1928', year: '1928' },
  'Tamil2017': { name: 'Indian Revised Version - Tamil', year: '2019' },
  'Turkish': { name: 'Turkish Yorumsuz Turkce Ceviri', year: '2024' },
  'Ukrainian': { name: 'Ukrainian 1871', year: '1871' },
};

// Curated catalog labels. Several source XML files only expose a partial
// <bible> header, which used to produce labels such as "Holy Bible", "1961",
// "Bible HHBD =" and "BSI) 1880". Keep the publication name in the translation
// language so the library never shows a malformed or English-only label for a
// non-English Bible. English versions keep their established names.
const CATALOG_PRESENTATION_OVERRIDES = {
  Arabic: { name: 'الكتاب المقدس (SVD 1865)', abbreviation: 'SVD', year: '1865' },
  Assamese: { name: 'ইণ্ডিয়ান ৰিভাইচ ভাৰচন (IRV) 2019', abbreviation: 'IRV', year: '2019' },
  Bengali: { name: 'ইন্ডিয়ান রিভাইজড ভার্সন (IRV-BEN)', abbreviation: 'IRV-BEN', year: '2019' },
  ChineseSimplified: { name: '和合本 1919 (CUV1919)', abbreviation: 'CUV1919', year: '1919' },
  Dogri: { name: 'डोगरी नवां नियम', abbreviation: 'DOGRI', year: null },
  French: { name: 'La Sainte Bible par Louis Segond 1910', abbreviation: 'LSG', year: '1910' },
  German: { name: 'Luther 1912 (LUT1912)', abbreviation: 'LUT1912', year: '1912' },
  GreekModern1904: { name: 'Νεοελληνική Μετάφραση 1904 (Modern1904)', abbreviation: 'Modern1904', year: '1904' },
  Gujarati2017: { name: 'ઇન્ડિયન રિવાઇઝ્ડ વર્ઝન (IRVGUJ)', abbreviation: 'IRVGUJ', year: '2017' },
  Hindi: { name: 'पवित्र बाइबल (HHBD)', abbreviation: 'HHBD', year: null },
  Indonesian: { name: 'Alkitab Terjemahan Baru', abbreviation: 'TB', year: null },
  Italian: { name: 'Bibbia CEI 1974', abbreviation: 'CEI', year: '1974' },
  Japanese: { name: '口語訳聖書 1955', abbreviation: 'JCB', year: '1955' },
  KannadaIRV: { name: 'ಇಂಡಿಯನ್ ರಿವೈಜ್ಡ್ ವರ್ಶನ್ (IRV) 2019', abbreviation: 'IRV', year: '2019' },
  Konkani: { name: 'बायबल नवो करार (BSI)', abbreviation: 'BSI', year: null },
  Korean: { name: '개역한글 1961', abbreviation: 'KRV', year: '1961' },
  Maithili: { name: 'मैथिली बाइबल 2010', abbreviation: 'MTH', year: '2010' },
  MalayalamBCS: { name: 'മലയാളം ബൈബിൾ (IRV) 2019', abbreviation: 'IRV', year: '2019' },
  MarathiIRVMAR: { name: 'मराठी इंडियन रिवाइज्ड वर्जन (IRV)', abbreviation: 'IRV', year: null },
  Meitei: { name: 'ꯃꯤꯇꯩ ꯕꯥꯏꯕꯦꯜ (ꯑꯅꯧꯕ ꯋꯥꯔꯦꯞꯅꯕ) 2022', abbreviation: 'MNI', year: '2022' },
  Nepali2012: { name: 'नेपाली नयाँ संशोधित संस्करण (NNRV) 2012', abbreviation: 'NNRV', year: '2012' },
  OdiaIRV2017: { name: 'ଇଣ୍ଡିଆନ ରିଭାଇଜଡ ଭର୍ସନ (IRV) 2017', abbreviation: 'IRV', year: '2017' },
  Polish: { name: 'Biblia Gdańska 1881-1910 (PDG)', abbreviation: 'PDG', year: '1910' },
  Portuguese: { name: 'Almeida Revista e Atualizada 1993 (ARA)', abbreviation: 'ARA', year: '1993' },
  PunjabiIRV: { name: 'ਇੰਡੀਅਨ ਰਿਵਾਇਜ਼ਡ ਵਰਜ਼ਨ (IRV) - ਪੰਜਾਬੀ', abbreviation: 'IRV', year: null },
  Romanian: { name: 'Biblia Cornilescu 1928 (COR1928)', abbreviation: 'COR1928', year: '1928' },
  Russian: { name: 'Синодальный перевод 1876', abbreviation: 'SYNO', year: '1876' },
  SanskritDevanagari: { name: 'संस्कृत बाइबल (नवीन नियम)', abbreviation: 'SKT', year: null },
  SantaliCommon: { name: 'ᱥᱟᱱᱛᱟᱲᱤ ᱵᱟᱭᱵᱮᱞ (ᱥᱟᱫᱷᱟᱨᱚᱱ)', abbreviation: 'SAT', year: null },
  SindhiMuslim: { name: 'سنڌي مقدس ڪلام (مسلم)', abbreviation: 'MSB', year: '2022' },
  Spanish: { name: 'Reina-Valera 1909 (RVR)', abbreviation: 'RVR', year: '1909' },
  Swahili: { name: 'Biblia ya Kiswahili (SRUV)', abbreviation: 'SRUV', year: null },
  Tagalog: { name: 'Ang Biblia 1905/1982 (TLAB)', abbreviation: 'TLAB', year: '1982' },
  Tamil2017: { name: 'இந்தியன் ரிவைஸ்டு வேர்ஷன் - தமிழ் (IRV-TAM)', abbreviation: 'IRV-TAM', year: '2019' },
  Telugu: { name: 'తెలుగు బైబిల్ (BSI) 1880', abbreviation: 'BSI', year: '1880' },
  Turkish: { name: 'Yorumsuz Türkçe Çeviri (YTC)', abbreviation: 'YTC', year: '2024' },
  Ukrainian: { name: 'Українська Біблія 1871 (KUL1871)', abbreviation: 'KUL1871', year: '1871' },
  Urdu: { name: 'اردو بائبل (IRV) 2019', abbreviation: 'IRV', year: '2019' },
};

const DISPLAY_ABBREVIATIONS = {
  Amplified: 'AMP',
  AmplifiedClassic: 'AMPC',
  Berean: 'BSB',
  Darby: 'DARBY',
  EASY: 'EASY',
  Passion: 'TPT',
  TL: 'TLB',
  Tyndale: 'TYNDALE',
  Arabic: 'SVD',
  ChineseSimplified: 'CUV1919',
  German: 'LUT1912',
  Polish: 'PDG',
  Romanian: 'COR1928',
  Tamil2017: 'IRV-TAM',
  Turkish: 'YTC',
  Ukrainian: 'KUL1871',
  Bengali: 'IRV-BEN',
};

const getCatalogVersionCode = (entry) => {
  const known = DISPLAY_ABBREVIATIONS[entry.shortId];
  if (known) return known;
  if (TRANSLATION_DISPLAY_NAMES[entry.shortId]) return entry.shortId;

  const cleanedDisplayName = stripLanguagePrefixFromDisplayName(entry, entry.displayName || '');
  const acronymVersionMatch = cleanedDisplayName.match(/\b[A-Z]{2,}\s*\d{2,}\b/);
  if (acronymVersionMatch) return acronymVersionMatch[0].replace(/\s+/g, ' ');

  const acronymMatch = cleanedDisplayName.match(/\b[A-Z]{2,}\b/);
  if (acronymMatch) return acronymMatch[0];

  const titleVersionMatch = cleanedDisplayName.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+\d{4}\b/);
  if (titleVersionMatch) return titleVersionMatch[0];

  const base = entry.fileId.replace(/Bible$/, '');
  const withoutLanguage =
    entry.prefix && base.startsWith(entry.prefix)
      ? base.slice(entry.prefix.length)
      : base;
  return withoutLanguage || (entry.shortId === base ? 'Bible' : entry.shortId);
};

const humanizeVersionCode = (code) =>
  code
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Za-z])(\d)/g, '$1 $2')
    .replace(/(\d)([A-Za-z])/g, '$1 $2')
    .trim();

const escapeRegExp = (text = '') =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const stripLanguagePrefixFromDisplayName = (entry, name) => {
  if (!name) return name;
  const prefixes = [entry.languageName, entry.prefix];
  for (const prefix of prefixes) {
    if (!prefix) continue;
    const cleaned = name.replace(new RegExp(`^${escapeRegExp(prefix)}\\s*`, 'i'), '').trim();
    if (cleaned && cleaned !== name) return cleaned;
  }
  return name;
};

const getCatalogPresentation = (entry) => {
  const override = CATALOG_PRESENTATION_OVERRIDES[entry.shortId];
  if (override) {
    return {
      abbreviation: override.abbreviation,
      name: override.name,
      fileName: entry.fileName,
      year: override.year ?? null,
    };
  }

  const abbreviation = getCatalogVersionCode(entry);
  const displayInfo = TRANSLATION_DISPLAY_NAMES[entry.shortId];
  const rawName = displayInfo?.name || entry.displayName ||
    (abbreviation === 'Bible' ? 'Holy Bible' : humanizeVersionCode(abbreviation));
  const baseName = stripLanguagePrefixFromDisplayName(entry, rawName)
    .replace(/^[\s(]+/, '')
    .replace(/\s*\([^)]*\)\s*$/, '')
    .replace(/[\s)]+$/g, '');
  const shouldAppendAbbreviation =
    abbreviation &&
    abbreviation !== 'Bible' &&
    !baseName.toLowerCase().includes(abbreviation.toLowerCase());
  const name = shouldAppendAbbreviation ? `${baseName} (${abbreviation})` : baseName;
  const safeAbbreviation = abbreviation === 'Bible' ? entry.shortId : abbreviation;
  return {
    abbreviation: safeAbbreviation,
    name,
    fileName: entry.fileName,
    year: displayInfo?.year || null,
  };
};

// Alias map: alternate spellings / abbreviations that must resolve to a
// canonical SHORT_IDS key. Daily-verse seed data and admin submissions
// historically stored values like "NKJV" while the canonical id is "NKJ",
// which made getVerse throw "Translation not found" and daily verses
// silently return empty text.
const TRANSLATION_ALIASES = {
  // NKJ was retired (the New King James Version is copyrighted); the free
  // Tyndale 1537 replaced it and old references still resolve.
  'NKJV': 'Tyndale',
  'NKJ': 'Tyndale',
  'TL': 'Tyndale',
  'LivingBible': 'Tyndale',
  'LIVING': 'Tyndale',
  'BSB': 'Berean',
  'BereanStandardBible': 'Berean',
  'DARBY': 'Darby',
  'DarbyTranslation': 'Darby',
  'AMP': 'Amplified',
  'AMPC': 'AmplifiedClassic',
  'TPT': 'Passion',
};

/**
 * Resolve any user-facing translation identifier to its canonical SHORT_IDS
 * key. Handles aliases (NKJV → NKJ), case variants (darby → Darby), full XML
 * file names, and display names. Returns the original id if unknown so the
 * caller can surface a precise "Translation not found".
 */
export const normalizeTranslationId = (id) => {
  if (typeof id !== 'string') return id;
  const trimmed = id.trim();
  if (!trimmed) return id;
  if (SHORT_IDS[trimmed]) return trimmed;
  if (TRANSLATION_ALIASES[trimmed]) return TRANSLATION_ALIASES[trimmed];

  const lower = trimmed.toLowerCase();
  const canonical = Object.keys(SHORT_IDS).find(
    (k) => k.toLowerCase() === lower,
  );
  if (canonical) return canonical;

  const byDisplay = Object.entries(TRANSLATION_DISPLAY_NAMES).find(
    ([, v]) => v.name.toLowerCase() === lower,
  );
  if (byDisplay) return byDisplay[0];

  const byFullFile = Object.entries(SHORT_IDS).find(
    ([, v]) => v.toLowerCase() === lower,
  );
  if (byFullFile) return byFullFile[0];

  return trimmed;
};

export const getTranslationDisplayName = (id) => {
  const canonical = normalizeTranslationId(id);
  const display = TRANSLATION_DISPLAY_NAMES[canonical];
  if (display) {
    return display.name;
  }
  return id;
};

const toShortId = (fileName) => {
  const fullName = fileName.replace('.xml', '');
  const entry = Object.entries(SHORT_IDS).find(([k, v]) => v === fullName);
  return entry ? entry[0] : fullName;
};

const toFullId = (id) => {
  const canonical = normalizeTranslationId(id);
  return SHORT_IDS[canonical] || id;
};

const parseXml = (xmlContent) => {
  return new Promise((resolve, reject) => {
    parseString(xmlContent, { explicitArray: false }, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

// Deduplicate concurrent parse requests for the same translation
const parsingPromises = new Map();

/** Parse or retrieve cached parsed XML for a translation. Avoids re-parsing the full file. */
const getParsedBible = async (id) => {
  const fullId = toFullId(id);
  if (parsedXmlCache.has(fullId)) {
    // Move to end (most recently used)
    const idx = parsedXmlCacheOrder.indexOf(fullId);
    if (idx !== -1) {
      parsedXmlCacheOrder.splice(idx, 1);
      parsedXmlCacheOrder.push(fullId);
    }
    return parsedXmlCache.get(fullId);
  }
  // Dedup concurrent parses — wait for the in-flight one instead of parsing again
  if (parsingPromises.has(fullId)) {
    return parsingPromises.get(fullId);
  }
  const promise = parseBibleXml(id).then((parsed) => {
    cacheParsedXml(fullId, parsed);
    parsingPromises.delete(fullId);
    return parsed;
  }).catch((err) => {
    parsingPromises.delete(fullId);
    throw err;
  });
  parsingPromises.set(fullId, promise);
  return promise;
};

const getXmlPath = (id) => {
  const fullId = toFullId(id);
  const filePath = path.join(XML_DIR, `${fullId}.xml`);
  if (!fs.existsSync(filePath)) {
    throw new Error('Translation not found');
  }
  return filePath;
};

// Reader requests only need one chapter, not a full object graph for a 5-7 MB
// Bible. Cache a few raw XML strings and parse only the requested fragment.
const RAW_XML_CACHE_MAX = 5;
const rawXmlCache = new Map();
const rawXmlCacheOrder = [];
const rawXmlPromises = new Map();

const touchRawXml = (fullId) => {
  const index = rawXmlCacheOrder.indexOf(fullId);
  if (index !== -1) rawXmlCacheOrder.splice(index, 1);
  rawXmlCacheOrder.push(fullId);
};

const cacheRawXml = (fullId, xml) => {
  if (rawXmlCache.size >= RAW_XML_CACHE_MAX && !rawXmlCache.has(fullId)) {
    const oldest = rawXmlCacheOrder.shift();
    if (oldest) rawXmlCache.delete(oldest);
  }
  rawXmlCache.set(fullId, xml);
  touchRawXml(fullId);
};

const getRawBibleXml = async (id) => {
  const fullId = toFullId(id);
  if (rawXmlCache.has(fullId)) {
    touchRawXml(fullId);
    return rawXmlCache.get(fullId);
  }
  if (rawXmlPromises.has(fullId)) return rawXmlPromises.get(fullId);

  const promise = fs.promises
    .readFile(getXmlPath(id), 'utf8')
    .then((xml) => {
      cacheRawXml(fullId, xml);
      rawXmlPromises.delete(fullId);
      return xml;
    })
    .catch((error) => {
      rawXmlPromises.delete(fullId);
      throw error;
    });
  rawXmlPromises.set(fullId, promise);
  return promise;
};

const extractBookXml = (xml, bookNumber) => {
  const match = xml.match(
    new RegExp(
      `<book\\b[^>]*\\bnumber=["']${bookNumber}["'][^>]*>[\\s\\S]*?<\\/book>`,
      'i',
    ),
  );
  if (!match) throw new Error('Book not found');
  return match[0];
};

const extractChapterXml = (bookXml, chapterNumber) => {
  const match = bookXml.match(
    new RegExp(
      `<chapter\\b[^>]*\\bnumber=["']${chapterNumber}["'][^>]*>[\\s\\S]*?<\\/chapter>`,
      'i',
    ),
  );
  if (!match) throw new Error('Chapter not found');
  return match[0];
};

const getVerseText = (verse) => {
  if (typeof verse === 'string') return verse;
  return typeof verse?._ === 'string' ? verse._ : '';
};

const parseChapterVerses = async (chapterXml) => {
  const parsed = await parseXml(chapterXml);
  const chapter = parsed.chapter;
  const verses = Array.isArray(chapter.verse) ? chapter.verse : [chapter.verse];
  return verses.filter(Boolean).map((verse) => ({
    verseNumber: parseInt(verse.$.number),
    text: getVerseText(verse),
  }));
};

const resolveBookContext = (id, bookName) => {
  const normalizedBookName = String(bookName || '').trim();
  const bookNumber = BOOK_NAME_TO_NUMBER[normalizedBookName.toLowerCase()];
  if (!bookNumber) throw new Error('Invalid book name');
  return {
    bookNumber,
    bookName: BOOK_NAMES[bookNumber],
    fullId: toFullId(id),
  };
};

const countMatches = (text, expression) => {
  expression.lastIndex = 0;
  let count = 0;
  while (expression.exec(text)) count += 1;
  return count;
};

const extractBooksFromRawXml = (xml) => {
  const books = [];
  const testamentExpression = /<testament\b[^>]*\bname=["']([^"']+)["'][^>]*>([\s\S]*?)<\/testament>/gi;
  let testamentMatch;
  while ((testamentMatch = testamentExpression.exec(xml))) {
    const testamentName = testamentMatch[1];
    const testamentXml = testamentMatch[2];
    const bookExpression = /<book\b[^>]*\bnumber=["'](\d+)["'][^>]*>([\s\S]*?)<\/book>/gi;
    let bookMatch;
    while ((bookMatch = bookExpression.exec(testamentXml))) {
      const bookNumber = parseInt(bookMatch[1]);
      books.push({
        bookNumber,
        bookName: BOOK_NAMES[bookNumber],
        testament: testamentName,
        chaptersCount: countMatches(bookMatch[2], /<chapter\b/gi),
        totalVerses: countMatches(bookMatch[2], /<verse\b/gi),
      });
    }
  }
  return books;
};

const parseBibleXml = async (id) => {
  const filePath = getXmlPath(id);
  const xmlContent = fs.readFileSync(filePath, 'utf-8');
  return parseXml(xmlContent);
};

const extractBooks = (testaments) => {
  const books = [];
  for (const testament of testaments) {
    const testamentName = testament.$.name;
    const testamentBooks = Array.isArray(testament.book) ? testament.book : [testament.book];
    
    for (const book of testamentBooks) {
      const chapters = Array.isArray(book.chapter) ? book.chapter : [book.chapter];
      const totalVerses = chapters.reduce((sum, ch) => {
        const verses = Array.isArray(ch.verse) ? ch.verse : [ch.verse];
        return sum + verses.length;
      }, 0);
      
      books.push({
        bookNumber: parseInt(book.$.number),
        bookName: BOOK_NAMES[parseInt(book.$.number)],
        testament: testamentName,
        chaptersCount: chapters.length,
        totalVerses
      });
    }
  }
  return books;
};

const findBook = (testaments, bookNumber) => {
  for (const testament of testaments) {
    const testamentBooks = Array.isArray(testament.book) ? testament.book : [testament.book];
    const book = testamentBooks.find(b => parseInt(b.$.number) === bookNumber);
    if (book) return book;
  }
  return null;
};

const findChapter = (book, chapterNumber) => {
  const chapters = Array.isArray(book.chapter) ? book.chapter : [book.chapter];
  return chapters.find(ch => parseInt(ch.$.number) === chapterNumber);
};

export const getAllTranslations = async () => {
  const cached = await cache.get('bible', `translations:all:${XML_CACHE_VERSION}`);
  if (cached) return cached;

  const entries = buildCatalog();
  const translations = entries.map((e) => {
    const displayInfo = TRANSLATION_DISPLAY_NAMES[e.shortId];
    const override = CATALOG_PRESENTATION_OVERRIDES[e.shortId];
    return {
      id: e.shortId,
      name: override?.name || (displayInfo ? displayInfo.name : e.fileId.replace(/Bible$/, '')),
      shortName: e.shortId,
      year: override?.year || displayInfo?.year || null,
      language: e.language,
      languageName: e.languageName,
      fileSize: e.fileSize,
      description: null,
      copyright: null,
      link: null,
    };
  });

  await cache.set('bible', `translations:all:${XML_CACHE_VERSION}`, translations);
  return translations;
};

export const getTranslationInfo = async (id) => {
  const cached = await cache.get('bible', `translation:${XML_CACHE_VERSION}:${id}`);
  if (cached) return cached;

  const parsed = await getParsedBible(id);
  const bible = parsed.bible;
  const shortId = toShortId(toFullId(id) + '.xml');

  const result = {
    id: shortId,
    name: bible.$.translation || bible.$.name || shortId,
    shortName: shortId,
    description: bible.$.title || bible.$.info || null,
    copyright: bible.$.status || bible.$.info || null,
    link: bible.$.link || null
  };

  await cache.set('bible', `translation:${XML_CACHE_VERSION}:${id}`, result);
  return result;
};

export const getBooks = async (id) => {
  const fullId = toFullId(id);
  const cacheKey = `books:${XML_CACHE_VERSION}:${fullId}`;
  const cached = await cache.get('bible', cacheKey);
  if (cached) return cached;

  const result = await getPrecomputedBooks(id, async () => {
    const xml = await getRawBibleXml(id);
    return extractBooksFromRawXml(xml);
  });

  await cache.set('bible', cacheKey, result);
  return result;
};

export const getBooksWithMaxChapters = async (id) => {
  const fullId = toFullId(id);
  const cacheKey = `books:${XML_CACHE_VERSION}:${fullId}:with-max`;
  const cached = await cache.get('bible', cacheKey);
  if (cached) return cached;

  const result = (await getBooks(id)).map(book => ({
    ...book,
    maxChapter: book.chaptersCount
  }));
  
  await cache.set('bible', cacheKey, result);
  return result;
};

export const getChapters = async (id, bookName) => {
  const context = resolveBookContext(id, bookName);
  const { bookNumber } = context;

  const cacheKey = `chapters:${XML_CACHE_VERSION}:${context.fullId}:${context.bookName}`;
  const cached = await cache.get('bible', cacheKey);
  if (cached) return cached;

  const xml = await getRawBibleXml(id);
  const bookXml = extractBookXml(xml, bookNumber);
  const chapters = [];
  const chapterExpression = /<chapter\b[^>]*\bnumber=["'](\d+)["'][^>]*>([\s\S]*?)<\/chapter>/gi;
  let chapterMatch;
  while ((chapterMatch = chapterExpression.exec(bookXml))) {
    chapters.push({
      chapterNumber: parseInt(chapterMatch[1]),
      versesCount: countMatches(chapterMatch[2], /<verse\b/gi),
    });
  }
  const result = {
    bookNumber,
    bookName: context.bookName,
    chapters,
  };
  
  await cache.set('bible', cacheKey, result);
  return result;
};

export const getVerses = async (id, bookName, chapterNumber) => {
  const context = resolveBookContext(id, bookName);
  const numericChapter = Number(chapterNumber);
  if (!Number.isInteger(numericChapter) || numericChapter < 1) {
    throw new Error('Invalid chapter number');
  }

  const cacheKey = `verses:${XML_CACHE_VERSION}:${context.fullId}:${context.bookName}:${numericChapter}`;
  const cached = await cache.get('bible', cacheKey);
  if (cached) return cached;

  const xml = await getRawBibleXml(id);
  const bookXml = extractBookXml(xml, context.bookNumber);
  const chapterXml = extractChapterXml(bookXml, numericChapter);
  const verses = await parseChapterVerses(chapterXml);
  const result = {
    bookNumber: context.bookNumber,
    bookName: context.bookName,
    chapterNumber: numericChapter,
    verses,
  };
  
  await cache.set('bible', cacheKey, result);
  return result;
};

export const getVerse = async (id, bookName, chapter, verseNumber) => {
  const verses = await getVerses(id, bookName, chapter);
  const verse = verses.verses.find(v => v.verseNumber === verseNumber);

  if (!verse) {
    throw new Error('Verse not found');
  }

  return {
    ...verse,
    bookNumber: verses.bookNumber,
    bookName,
    chapterNumber: chapter
  };
};

export const searchVerses = async (id, query, limit = 50) => {
  const parsed = await getParsedBible(id);
  const testaments = Array.isArray(parsed.bible.testament) 
    ? parsed.bible.testament 
    : [parsed.bible.testament];

  const results = [];
  const searchLower = query.toLowerCase();

  for (const testament of testaments) {
    if (results.length >= limit) break;
    
    const testamentBooks = Array.isArray(testament.book) ? testament.book : [testament.book];
    
    for (const book of testamentBooks) {
      if (results.length >= limit) break;
      
      const bookNum = parseInt(book.$.number);
      const chapters = Array.isArray(book.chapter) ? book.chapter : [book.chapter];
      
      for (const chapter of chapters) {
        if (results.length >= limit) break;
        
        const chapterNum = parseInt(chapter.$.number);
        const chapterVerses = Array.isArray(chapter.verse) ? chapter.verse : [chapter.verse];
        
        for (const verse of chapterVerses) {
          const text = getVerseText(verse);
          
          if (text && text.toLowerCase().includes(searchLower)) {
            results.push({
              bookNumber: bookNum,
              bookName: BOOK_NAMES[bookNum],
              chapter: chapterNum,
              verse: parseInt(verse.$.number),
              text
            });
          }
        }
      }
    }
  }

  return results;
};

// ── XML fallback search ──────────────────────────────────────────────────
// `search_index` only contains the English translations that were seeded into
// Postgres. Catalog translations (Tamil, Hindi, German, …) have no rows there,
// so searching them used to return an empty page. Build a compact offset index
// from the translation's XML once and serve substring search from it. The
// index stores offsets, not verse text, so a 31k-verse Bible costs little
// memory and pagination does not re-parse the document.
const XML_SEARCH_INDEX_MAX = 2;
const xmlSearchIndexCache = new Map();
const xmlSearchIndexOrder = [];

const rememberXmlSearchIndex = (key, xml, entries) => {
  if (xmlSearchIndexCache.has(key)) {
    const at = xmlSearchIndexOrder.indexOf(key);
    if (at !== -1) xmlSearchIndexOrder.splice(at, 1);
  } else if (xmlSearchIndexOrder.length >= XML_SEARCH_INDEX_MAX) {
    const oldest = xmlSearchIndexOrder.shift();
    if (oldest) xmlSearchIndexCache.delete(oldest);
  }
  xmlSearchIndexCache.set(key, { xml, entries });
  xmlSearchIndexOrder.push(key);
};

const buildXmlVerseIndex = (xml) => {
  const entries = [];
  const expression =
    /<book\b[^>]*\bnumber\s*=\s*["'](\d+)["'][^>]*>|<chapter\b[^>]*\bnumber\s*=\s*["'](\d+)["'][^>]*>|<verse\b[^>]*\bnumber\s*=\s*["'](\d+)["'][^>]*>([\s\S]*?)<\/verse>/gi;
  let book = 0;
  let chapter = 0;
  let match;

  while ((match = expression.exec(xml)) !== null) {
    if (match[1]) {
      book = parseInt(match[1], 10);
      chapter = 0;
      continue;
    }
    if (match[2]) {
      chapter = parseInt(match[2], 10);
      continue;
    }
    if (!match[3] || !book || !chapter) continue;

    const text = match[4] || '';
    const end = match.index + match[0].length - '</verse>'.length;
    entries.push({
      book,
      chapter,
      verse: parseInt(match[3], 10),
      start: end - text.length,
      end,
    });
  }

  return entries;
};

const decodeXmlEntities = (raw) =>
  raw
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, '&');

const normalizeBookKey = (name) =>
  String(name || '').toLowerCase().replace(/\s+/g, ' ').trim();

const findVerseEntryAt = (entries, position) => {
  let low = 0;
  let high = entries.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const entry = entries[mid];
    if (position < entry.start) high = mid - 1;
    else if (position >= entry.end) low = mid + 1;
    else return mid;
  }
  return -1;
};

const runXmlSearch = (xml, entries, query, options = {}) => {
  const term = String(query || '').trim();
  if (!term || entries.length === 0) return null;

  const limit = Math.max(1, Math.min(parseInt(options.limit, 10) || 50, 200));
  const offset = Math.max(0, parseInt(options.offset, 10) || 0);
  const covenant = options.covenant || 'all';
  const bookFilter = options.bookName
    ? normalizeBookKey(options.bookName)
    : null;
  const matcher = new RegExp(escapeRegExp(term), 'gi');
  const hits = [];
  let lastEntry = -1;
  let match;

  while ((match = matcher.exec(xml)) !== null) {
    if (match[0].length === 0) {
      matcher.lastIndex += 1;
      continue;
    }
    const entryIndex = findVerseEntryAt(entries, match.index);
    if (entryIndex < 0 || entryIndex === lastEntry) continue;
    lastEntry = entryIndex;

    const entry = entries[entryIndex];
    const bookName = BOOK_NAMES[entry.book] || '';
    if (bookFilter && normalizeBookKey(bookName) !== bookFilter) continue;
    if (covenant === 'ot' && (entry.book < 1 || entry.book > 39)) continue;
    if (covenant === 'nt' && (entry.book < 40 || entry.book > 66)) continue;
    hits.push(entry);
  }

  const data = hits.slice(offset, offset + limit).map((entry) => {
    const text = decodeXmlEntities(xml.slice(entry.start, entry.end))
      .replace(/\s+/g, ' ')
      .trim();
    return {
      book_number: entry.book,
      book_name: BOOK_NAMES[entry.book] || `Book ${entry.book}`,
      chapter: entry.chapter,
      verse: entry.verse,
      verse_text: text,
      rank: 0,
    };
  });

  return { total: hits.length, data };
};

/**
 * Search a Bible XML string directly. Exported for tests and for callers that
 * already hold the document in memory.
 */
export const searchXmlText = (xml, query, options = {}) => {
  const entries = buildXmlVerseIndex(xml);
  if (entries.length === 0) return null;
  return runXmlSearch(xml, entries, query, options);
};

/**
 * Search a translation's XML file, with a small LRU of offset indexes.
 * Returns null when the translation has no readable XML file.
 */
export const searchXmlVerses = async (id, query, options = {}) => {
  let xml;
  try {
    xml = await getRawBibleXml(id);
  } catch {
    return null;
  }
  if (!xml) return null;

  const key = toFullId(id);
  let cached = xmlSearchIndexCache.get(key);
  if (!cached || cached.xml !== xml) {
    const entries = buildXmlVerseIndex(xml);
    if (entries.length === 0) return null;
    rememberXmlSearchIndex(key, xml, entries);
    cached = { xml, entries };
  }

  return runXmlSearch(xml, cached.entries, query, options);
};

/** Fetch multiple chapters at once while reusing the canonical chapter cache. */
export const getVersesBatch = async (id, bookName, chapters) => {
  resolveBookContext(id, bookName);
  return Promise.all(
    chapters.map(async (chapter) => {
      const numericChapter = Number(chapter);
      try {
        return await getVerses(id, bookName, numericChapter);
      } catch (error) {
        if (error?.message === 'Chapter not found') {
          return { bookName, chapterNumber: numericChapter, verses: [] };
        }
        throw error;
      }
    }),
  );
};

export const getChapterRange = async (id, bookName, startChapter, endChapter) => {
  const bookNumber = BOOK_NAME_TO_NUMBER[bookName.toLowerCase()];
  if (!bookNumber) {
    throw new Error('Invalid book name');
  }

  const verses = [];
  
  for (let ch = startChapter; ch <= endChapter; ch++) {
    const chapterData = await getVerses(id, bookName, ch);
    verses.push(...chapterData.verses);
  }

  return {
    bookNumber,
    bookName,
    startChapter,
    endChapter,
    verses
  };
};

export const getReadingProgress = async (id, startBookName, startChapter, endBookName, endChapter) => {
  const startBookNumber = BOOK_NAME_TO_NUMBER[startBookName.toLowerCase()];
  const endBookNumber = BOOK_NAME_TO_NUMBER[endBookName.toLowerCase()];
  
  if (!startBookNumber || !endBookNumber) {
    throw new Error('Invalid book name');
  }

  const books = [];
  
  for (let book = startBookNumber; book <= endBookNumber; book++) {
    const chapters = [];
    const startCh = book === startBookNumber ? startChapter : 1;
    const endCh = book === endBookNumber ? endChapter : null;
    
    const bookData = await getChapters(id, BOOK_NAMES[book]);
    
    for (let ch = startCh; ch <= (endCh || bookData.chapters.length); ch++) {
      const chapterData = await getVerses(id, BOOK_NAMES[book], ch);
      chapters.push({
        chapterNumber: ch,
        verses: chapterData.verses
      });
    }
    
    books.push({
      bookNumber: book,
      bookName: BOOK_NAMES[book],
      chapters
    });
  }

  return {
    translationId: id,
    startBook: startBookName,
    startChapter,
    endBook: endBookName,
    endChapter,
    books
  };
};

// ── Catalog & download helpers (for on-device download feature) ──

/** Returns the full discovered catalog (lightweight; no XML parse). */
export const getCatalog = () => {
  const entries = buildCatalog();
  return entries.map((e) => {
    const presentation = getCatalogPresentation(e);
    const license = getTranslationLicense(e.fileId);
    return {
      id: e.shortId,
      fileId: e.fileId,
      language: e.language,
      languageName: e.languageName,
      ...presentation,
      fileSize: e.fileSize,
      // Licence metadata so clients can display the required attribution and
      // tell the user where the text came from.
      license: license?.license ?? null,
      attribution: license?.attribution || '',
      source: license?.source || '',
      redistributable: isRedistributable(e.fileId),
    };
  });
};

/** Returns a single catalog entry by shortId, fileId, or normalized id. */
export const getCatalogEntry = (id) => {
  buildCatalog();
  if (!id) return null;
  const direct = _catalogById.get(id) || _catalogByFile.get(id);
  if (direct) return direct;
  const normalized = normalizeTranslationId(id);
  return _catalogById.get(normalized) || _catalogByFile.get(normalized) || null;
};

/** Lazy XML display-name parser. Reads the <bible translation="..."> attribute. */
const _displayNameCache = new Map();
export const getTranslationDisplayNameFromXml = async (id) => {
  const entry = getCatalogEntry(id);
  if (!entry) return id;
  const cacheKey = entry.shortId;
  if (_displayNameCache.has(cacheKey)) return _displayNameCache.get(cacheKey);
  try {
    const parsed = await getParsedBible(entry.shortId);
    const t = parsed?.bible?.$?.translation;
    if (t) {
      _displayNameCache.set(cacheKey, t);
      return t;
    }
  } catch {
    // fall through to default
  }
  const fallback = entry.fileId.replace(/Bible$/, '');
  _displayNameCache.set(cacheKey, fallback);
  return fallback;
};

/** Returns the absolute file path for a translation, or throws. */
export const getXmlFilePath = (id) => {
  const entry = getCatalogEntry(id);
  if (!entry) throw new Error('Translation not found');
  return entry.filePath;
};

/** Lightweight metadata (no full parse on every call): books, chapters, verses. */
const _metadataCache = new Map();
export const getBibleMetadata = async (id) => {
  const entry = getCatalogEntry(id);
  if (!entry) throw new Error('Translation not found');
  if (_metadataCache.has(entry.fileId)) return _metadataCache.get(entry.fileId);
  const books = await getBooks(entry.fileId);
  const totalChapters = books.reduce((s, b) => s + b.chaptersCount, 0);
  const totalVerses = books.reduce((s, b) => s + b.totalVerses, 0);
  const meta = {
    id: entry.shortId,
    fileId: entry.fileId,
    language: entry.language,
    languageName: entry.languageName,
    ...getCatalogPresentation(entry),
    fileSize: entry.fileSize,
    bookCount: books.length,
    chapterCount: totalChapters,
    verseCount: totalVerses,
  };
  _metadataCache.set(entry.fileId, meta);
  return meta;
};

// ── Chapter section headings (bundled public-domain dataset from BSB USFM) ──
const HEADINGS_FILE = path.join(MODULE_DIR, 'data', 'chapter-headings.json');
let headingsCache = null;

const loadHeadings = () => {
  if (headingsCache) return headingsCache;
  try {
    headingsCache = JSON.parse(fs.readFileSync(HEADINGS_FILE, 'utf8'));
  } catch (e) {
    headingsCache = {};
  }
  return headingsCache;
};

/**
 * Returns the section headings for a chapter.
 * data: { bookName, chapter, headings: [{ verse, heading }] }
 */
export const getChapterHeadings = async (body = {}) => {
  const { bookName, chapter } = body;
  if (!bookName || chapter === undefined) {
    return { status: 400, message: 'bookName and chapter are required' };
  }
  const all = loadHeadings();
  const book = all[bookName];
  const list = book?.[String(chapter)] || [];
  return {
    status: 200,
    message: 'Chapter section headings',
    data: {
      bookName,
      chapter: parseInt(chapter, 10),
      headings: list,
    },
  };
};

export const getBookHeadings = async (body = {}) => {
  const { bookName } = body;
  if (!bookName) {
    return { status: 400, message: 'bookName is required' };
  }
  const all = loadHeadings();
  const book = all[bookName] || {};
  return {
    status: 200,
    message: 'Book section headings',
    data: {
      bookName,
      chapters: book,
    },
  };
};
