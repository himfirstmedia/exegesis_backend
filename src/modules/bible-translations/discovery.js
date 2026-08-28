import fs from 'node:fs';
import path from 'node:path';

// ISO 639-1 code → human-readable English name (for ~80 most common Bible-translation languages)
export const LANGUAGE_NAMES = {
  ace: 'Aceh', arc: 'Aramaic',
  af: 'Afrikaans', sq: 'Albanian', am: 'Amharic', ar: 'Arabic',
  hy: 'Armenian', as: 'Assamese', az: 'Azerbaijani', eu: 'Basque',
  bn: 'Bengali', bs: 'Bosnian', bg: 'Bulgarian', my: 'Burmese',
  ca: 'Catalan', ceb: 'Cebuano', ny: 'Chichewa', zh: 'Chinese',
  co: 'Corsican', hr: 'Croatian', cs: 'Czech', da: 'Danish',
  nl: 'Dutch', en: 'English', eo: 'Esperanto', et: 'Estonian',
  fj: 'Fijian', fi: 'Finnish', fr: 'French', ka: 'Georgian',
  de: 'German', el: 'Greek', gn: 'Guarani', gu: 'Gujarati',
  ht: 'Haitian Creole', ha: 'Hausa', haw: 'Hawaiian', he: 'Hebrew',
  hi: 'Hindi', hmn: 'Hmong', hu: 'Hungarian', is: 'Icelandic',
  ig: 'Igbo', ilo: 'Ilocano', id: 'Indonesian', ga: 'Irish',
  it: 'Italian', ja: 'Japanese', jv: 'Javanese', kn: 'Kannada',
  kk: 'Kazakh', km: 'Khmer', rw: 'Kinyarwanda', ko: 'Korean',
  ku: 'Kurdish', ky: 'Kyrgyz', lo: 'Lao', la: 'Latin', lv: 'Latvian',
  ln: 'Lingala', lt: 'Lithuanian', lg: 'Luganda', mk: 'Macedonian',
  mg: 'Malagasy', ms: 'Malay', ml: 'Malayalam', mt: 'Maltese',
  mi: 'Maori', mr: 'Marathi', mn: 'Mongolian', ne: 'Nepali',
  no: 'Norwegian', or: 'Odia', ps: 'Pashto', fa: 'Persian',
  pl: 'Polish', pt: 'Portuguese', pa: 'Punjabi', qu: 'Quechua',
  ro: 'Romanian', ru: 'Russian', sm: 'Samoan', sr: 'Serbian',
  sn: 'Shona', sd: 'Sindhi', si: 'Sinhala', sk: 'Slovak',
  sl: 'Slovenian', so: 'Somali', es: 'Spanish', su: 'Sundanese',
  sw: 'Swahili', sv: 'Swedish', tl: 'Tagalog', tg: 'Tajik',
  ta: 'Tamil', tt: 'Tatar', te: 'Telugu', th: 'Thai', bo: 'Tibetan',
  ti: 'Tigrinya', tr: 'Turkish', tk: 'Turkmen', uk: 'Ukrainian',
  ur: 'Urdu', ug: 'Uyghur', uz: 'Uzbek', vi: 'Vietnamese',
  cy: 'Welsh', xh: 'Xhosa', yi: 'Yiddish', yo: 'Yoruba', zu: 'Zulu',
  fil: 'Filipino',
};

// Longest-first match: language name (as it appears in the file prefix) → ISO 639-1 code
// The file naming convention is `{LanguageName}{VersionCode?}Bible.xml`. We extract
// the language name by finding the longest entry below that is a prefix of the file
// base name (after stripping the trailing 'Bible').
export const PREFIX_TO_LANG = {
  // Long, unambiguous names first so we don't shadow shorter ones (e.g. "Chin" vs "Chinese")
  SanskritDevanagari: 'sa', OriginalGreek: 'grc', OriginalHebrew: 'hbo',
  Sanskrit: 'sa', HaitianCreole: 'ht', ScotsGaelic: 'gd', SrananTonga: 'srn',
  SinoTibetan: 'zh', CentralKurdish: 'ckb', BokmalNorwegian: 'nb',
  Bosnian: 'bs', Indonesian: 'id', Cantonese: 'zh', Mandarin: 'zh',
  TajikArabic: 'tg', Arabic: 'ar', Persian: 'fa', Dari: 'prs',
  Amharic: 'am', Tigrinya: 'ti', Hebrew: 'he', Greek: 'el',
  Afrikaans: 'af', Albanian: 'sq', Armenian: 'hy', Azerbaijani: 'az',
  Azerbaijan: 'az', Basque: 'eu', Belarusian: 'be', Bengali: 'bn',
  Bhojpuri: 'bho', Bodo: 'brx', Bulgarian: 'bg', Burmese: 'my',
  Catalan: 'ca', Cebuano: 'ceb', Chewa: 'ny', Chichewa: 'ny',
  Corsican: 'co', Croatian: 'hr', Czech: 'cs', Danish: 'da',
  Dutch: 'nl', English: 'en', Esperanto: 'eo', Estonian: 'et',
  Ewe: 'ee', Faroese: 'fo', Farsi: 'fa', Fijian: 'fj',
  Filipino: 'fil', Finnish: 'fi', French: 'fr', Frisian: 'fy',
  Galician: 'gl', Galacian: 'gl', Georgian: 'ka', German: 'de',
  Guarani: 'gn', Gujarati: 'gu', Hausa: 'ha', Hawaiian: 'haw',
  Hindi: 'hi', Hmong: 'hmn', Hungarian: 'hu', Icelandic: 'is',
  Igbo: 'ig', Ilocano: 'ilo', Irish: 'ga', Italian: 'it',
  Japanese: 'ja', Javanese: 'jv', Kannada: 'kn', Kazakh: 'kk',
  Khmer: 'km', Kinyarwanda: 'rw', Korean: 'ko', Kurdish: 'ku',
  Kyrgyz: 'ky', Lao: 'lo', Latin: 'la', Latvian: 'lv',
  Lingala: 'ln', Lithuanian: 'lt', Luganda: 'lg', Macedonian: 'mk',
  Malagasy: 'mg', Malay: 'ms', Malayalam: 'ml', Malaysian: 'ms',
  Maltese: 'mt', Maori: 'mi', Marathi: 'mr', Mongolian: 'mn',
  Moldovian: 'ro', Moldovan: 'ro', Nepali: 'ne', Norwegian: 'no',
  Odia: 'or', Oriya: 'or', Pampanga: 'pam', Pangasinan: 'pag',
  Pashto: 'ps', Polish: 'pl', Portuguese: 'pt', Punjabi: 'pa',
  Quechua: 'qu', Quechuan: 'qu', Romanian: 'ro',
  Rundi: 'rn', Russian: 'ru', Samoan: 'sm', Sardinian: 'sc',
  Serbian: 'sr', Sesotho: 'st', Setswana: 'tn', Shan: 'shn',
  Shona: 'sn', Sindhi: 'sd', Sinhala: 'si', Slovak: 'sk',
  Slovakian: 'sk', Slovenian: 'sl', Somali: 'so', Somalian: 'so',
  Sotho: 'st', Spanish: 'es', Sundanese: 'su', Swahili: 'sw',
  Swati: 'ss', Swedish: 'sv', Tagalog: 'tl', Tajik: 'tg',
  Tamil: 'ta', Tatar: 'tt', Telugu: 'te', Tetum: 'tet',
  Thai: 'th', Tibetan: 'bo', Tibetian: 'bo', Tongan: 'to',
  Tsonga: 'ts', Tswana: 'tn', Turkish: 'tr', Turkmen: 'tk',
  Twi: 'ak', Uighur: 'ug', Ukrainian: 'uk', Urdu: 'ur',
  Uyghur: 'ug', Uzbek: 'uz', Venda: 've', Vietnamese: 'vi',
  Volapuk: 'vo', Welsh: 'cy', Xhosa: 'xh', Yiddish: 'yi',
  Yoruba: 'yo', Zhuang: 'za', Zulu: 'zu',
  // African / regional
  Aceh: 'ace', Acholi: 'ach', AdilabadGondi: 'ggo', Ahirani: 'ahr',
  Aramaic: 'arc', Assamese: 'as',
  Avar: 'av', Awadhi: 'awa', Aymara: 'ay', Bagri: 'bgq',
  Balinese: 'ban', Balochi: 'bal', Bambara: 'bm', Baoule: 'bci',
  Bashkir: 'ba', Bavarian: 'bar', Bemba: 'bem', Berber: 'ber',
  Bhilali: 'bhi', Bislama: 'bi', Braj: 'bra', Bugis: 'bug',
  Bundeli: 'bns', Chakma: 'ccp', Chechen: 'ce', Cherokee: 'chr',
  Chhattisgarhi: 'hne', Chibemba: 'bem', Chittagonian: 'ctg',
  Chuvash: 'cv', Coptic: 'cop', Cree: 'cr', Dagbani: 'dag',
  Dinka: 'din', Divehi: 'dv', Dogri: 'doi', Dyula: 'dyu',
  Dzongkha: 'dz', Edo: 'bin', Ewondo: 'ewo', Fon: 'fon',
  Fula: 'ff', Fulfulde: 'ff', Gaelic: 'gd', Ganda: 'lg',
  Garhwali: 'gbm', Ghomala: 'bbj', Gikuyu: 'ki', Gilbertese: 'gil',
  Greenlandic: 'kl', Gussi: 'gdi', Hadiyya: 'hdy', Haitian: 'ht',
  Haryanvi: 'bgc', Iban: 'iba', Ibibio: 'ibb', Ika: 'ikx',
  Ilokano: 'ilo', Ilonggo: 'ilo', Inuktitut: 'iu', IuMien: 'ium',
  Jamaican: 'jam', Jingpho: 'kac', Kabardian: 'kbd', Kabyle: 'kab',
  Kachin: 'kac', Kalenjin: 'kln', Kamba: 'kam', Kangri: 'xnr',
  Kanuri: 'kr', Karakalpak: 'kaa', Karen: 'kar', Kashmiri: 'ks',
  Kazakhstan: 'kk', KenyaGIK: 'ki', Khasi: 'kha', Kiche: 'quc',
  Kikongo: 'kg', Kikuyu: 'ki', Kikwango: 'kg', Kimbundu: 'kmb',
  Kimiiru: 'mer', Kirundi: 'rn', Kituba: 'ktu', Kongo: 'kg',
  Konkani: 'gom', Korku: 'kfq', Koya: 'kff', Kosraean: 'kos',
  KoyraChiini: 'khq', KoyraboroSenni: 'ses', Kpelle: 'kpe',
  Krio: 'kri', Kumaoni: 'kfy', Kurukh: 'kru', Kusaal: 'kus',
  Kutchhi: 'kfr', Ladin: 'lld', Lahu: 'lhu', Lakota: 'lkt',
  Lambadi: 'lmn', Lango: 'laj', LiberianKreyol: 'lir', Lomwe: 'ngl',
  Lozi: 'loz', LubaKatanga: 'lu', Lugbara: 'lgg', Luguru: 'ruf',
  Luo: 'luo', Maasai: 'mas', Madurese: 'mad', Maithili: 'mai',
  Makassar: 'mak', Makhuwa: 'vmw', Makonde: 'kde', Mandingo: 'man',
  Manipuri: 'mni', Mapudungun: 'arn', Mari: 'chm', Marwari: 'mwr',
  Marshallese: 'mh', Mazanderani: 'mzn', Meitei: 'mni', Mende: 'men',
  Mewari: 'mtr', Mizo: 'lus', Moba: 'mff', Morisyen: 'mfe',
  Mossi: 'mos', Munda: 'unr', Nahuatl: 'nah', Nahuati: 'nah',
  Ndau: 'ndc', Ndebele: 'nr', Newari: 'new', NigerianPidgin: 'pcm',
  Nuer: 'nus', Nyankole: 'nyn', Nyanja: 'ny', Occitan: 'oc',
  Oromo: 'om', Papiamento: 'pap', PapuaNewGuinea: 'tpi', Pular: 'fuf',
  Qeqchi: 'kek', Romani: 'rom', Sadri: 'sck', Sango: 'sg',
  Santali: 'sat', Sasak: 'sas', Sena: 'seh', SenaMalawi: 'seh',
  Sepedi: 'nso', Seraiki: 'skr', Shekhawati: 'swv', Shilluk: 'shk',
  SichuanYi: 'ii', Sidamo: 'sid', Siswati: 'ss', Soga: 'xog',
  Songe: 'sop', Sukuma: 'suk', Sylheti: 'syl', Tamashek: 'tmh',
  Tamasheq: 'tmh', Tarifit: 'rif', Tashelhayt: 'shi', Teso: 'teo',
  Thado: 'lth', Tiv: 'tiv', TokPisin: 'tpi', Tshiluba: 'lua',
  Tshivenda: 've', Tulu: 'tcy', Turkana: 'tuv', Umbundu: 'umb',
  Vai: 'vai', Waray: 'war', Wolaytta: 'wal', Wolof: 'wo',
  Yao: 'yao', Yapese: 'yap', Zande: 'zne', Zarma: 'dje',
  // Sino-Tibetan (short Chin vs Chinese: ordered so Chinese is longer and tested first)
  Chinese: 'zh', Chin: 'cnh',

};

// Sort by length descending so longest match wins
const SORTED_PREFIXES = Object.keys(PREFIX_TO_LANG).sort((a, b) => b.length - a.length);

const humanizeLanguageName = (name) =>
  name.replace(/([a-z])([A-Z])/g, '$1 $2').trim();

// Regional aliases can map to the same language code (for example Bemba and
// Chibemba). Use one stable display label per code so a language never appears
// as multiple filter groups depending on file order.
const DERIVED_LANGUAGE_NAMES = Object.entries(PREFIX_TO_LANG).reduce(
  (names, [prefix, code]) => {
    if (!LANGUAGE_NAMES[code] && !names[code]) {
      names[code] = humanizeLanguageName(prefix);
    }
    return names;
  },
  {},
);

// Backwards-compatible canonical short IDs for English translations that
// existed in the pre-discovery hardcoded `SHORT_IDS` map. New languages
// derive their shortId from the file name itself.
export const LEGACY_SHORT_IDS = {
  EnglishASVBible: 'ASV',
  EnglishAmplifiedBible: 'Amplified',
  EnglishAmplifiedClassicBible: 'AmplifiedClassic',
  EnglishBereanBible: 'Berean',
  EnglishCSBBible: 'CSB',
  EnglishDarbyBible: 'Darby',
  EnglishEASYBible: 'EASY',
  EnglishERVBible: 'ERV',
  EnglishESVBible: 'ESV',
  EnglishGNTBible: 'GNT',
  EnglishGWBible: 'GW',
  EnglishHCSBBible: 'HCSB',
  EnglishKJBible: 'KJV',
  EnglishLSBBible: 'LSB',
  EnglishMEVBible: 'MEV',
  EnglishNASBBible: 'NASB',
  EnglishNASUBible: 'NASU',
  EnglishNETBible: 'NET',
  EnglishNIRVBible: 'NIRV',
  EnglishNIVBible: 'NIV',
  EnglishNKJBible: 'NKJ',
  EnglishNLTBible: 'NLT',
  EnglishNRSVBible: 'NRSV',
  EnglishPassionBible: 'Passion',
  EnglishRSVBible: 'RSV',
  EnglishTLBible: 'TL',
  EnglishTyndale1537Bible: 'Tyndale',
  EnglishYLTBible: 'YLT',
};

/**
 * Walk through PREFIX_TO_LANG keys longest-first and return the first one that
 * is a prefix of the file base name (with the next char being uppercase, digit,
 * or end-of-string). Returns null if no match.
 */
export const findLanguagePrefix = (baseName) => {
  for (const lang of SORTED_PREFIXES) {
    if (baseName === lang) return lang;
    if (baseName.startsWith(lang)) {
      const next = baseName[lang.length];
      if (next === undefined || /[A-Z0-9]/.test(next)) return lang;
    }
  }
  return null;
};

const readTranslationName = (filePath) => {
  let handle;
  try {
    handle = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(8192);
    const bytesRead = fs.readSync(handle, buffer, 0, buffer.length, 0);
    const header = buffer.toString('utf8', 0, bytesRead);
    const match = header.match(/<bible\b[^>]*\btranslation=["']([^"']+)["']/i);
    return match
      ? match[1]
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .trim()
      : null;
  } catch {
    return null;
  } finally {
    if (handle !== undefined) fs.closeSync(handle);
  }
};

/**
 * Build a short ID for the file. Defaults to the file base name (minus
 * 'Bible'). Uses LEGACY_SHORT_IDS for known English translations to
 * preserve backward compatibility. If a collision occurs, disambiguates
 * with a numeric suffix.
 */
const buildShortId = (fileId, seen) => {
  if (LEGACY_SHORT_IDS[fileId]) {
    const id = LEGACY_SHORT_IDS[fileId];
    seen.add(id);
    return id;
  }
  const base = fileId.replace(/Bible$/, '');
  if (!seen.has(base)) {
    seen.add(base);
    return base;
  }
  let i = 2;
  let id = `${base}_${i}`;
  while (seen.has(id)) {
    i++;
    id = `${base}_${i}`;
  }
  seen.add(id);
  return id;
};

/**
 * Scan an XML directory and produce one catalog entry per XML file.
 * Returns Array<{ fileId, shortId, prefix, language, languageName, fileName, filePath, fileSize }>
 */
export const discoverBibles = (xmlDir) => {
  if (!fs.existsSync(xmlDir)) return [];

  const files = fs.readdirSync(xmlDir).filter((f) => f.endsWith('.xml'));
  const seenShortIds = new Set();
  const entries = [];

  for (const fileName of files) {
    const filePath = path.join(xmlDir, fileName);
    let fileSize = 0;
    try {
      fileSize = fs.statSync(filePath).size;
    } catch {
      // ignore; leave as 0
    }

    const fileId = fileName.replace(/\.xml$/, '');
    const base = fileId.replace(/Bible$/, '');
    const prefix = findLanguagePrefix(base);
    const language = prefix ? PREFIX_TO_LANG[prefix] : 'en';
    const languageName =
      LANGUAGE_NAMES[language] ||
      DERIVED_LANGUAGE_NAMES[language] ||
      humanizeLanguageName(prefix || base) ||
      'English';
    const shortId = buildShortId(fileId, seenShortIds);
    const displayName = readTranslationName(filePath);

    entries.push({
      fileId,
      shortId,
      prefix: prefix || base,
      language,
      languageName,
      displayName,
      fileName,
      filePath,
      fileSize,
    });
  }

  return entries;
};
