/**
 * generate-chapter-headings.js
 *
 * One-time generator for the Bible section-headings dataset served by
 * `bible-translations/:id/chapter-headings`.
 *
 * Source: Berean Standard Bible USFM (public domain)
 *   https://bereanbible.com/bsb_usfm.zip  →  unzip to ./bsb_usfm
 *
 * Usage:
 *   node scripts/generate-chapter-headings.js /path/to/bsb_usfm
 *
 * Output: src/modules/bible-translations/data/chapter-headings.json
 *   {
 *     "Genesis": { "1": [{ "verse": 1, "heading": "The Creation" }], ... },
 *     ...
 *   }
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(
  __dirname,
  '..',
  'src',
  'modules',
  'bible-translations',
  'data',
  'chapter-headings.json',
);

const USFM_DIR = process.argv[2] || path.join(process.cwd(), 'bsb_usfm');

// USFM book code -> canonical name (matches backend BOOK_NAMES)
const CODE_TO_NAME = {
  GEN: 'Genesis', EXO: 'Exodus', LEV: 'Leviticus', NUM: 'Numbers',
  DEU: 'Deuteronomy', JOS: 'Joshua', JDG: 'Judges', RUT: 'Ruth',
  '1SA': '1 Samuel', '2SA': '2 Samuel', '1KI': '1 Kings', '2KI': '2 Kings',
  '1CH': '1 Chronicles', '2CH': '2 Chronicles', EZR: 'Ezra', NEH: 'Nehemiah',
  EST: 'Esther', JOB: 'Job', PSA: 'Psalms', PRO: 'Proverbs',
  ECC: 'Ecclesiastes', SNG: 'Song of Solomon', ISA: 'Isaiah', JER: 'Jeremiah',
  LAM: 'Lamentations', EZK: 'Ezekiel', DAN: 'Daniel', HOS: 'Hosea',
  JOL: 'Joel', AMO: 'Amos', OBA: 'Obadiah', JON: 'Jonah', MIC: 'Micah',
  NAM: 'Nahum', HAB: 'Habakkuk', ZEP: 'Zephaniah', HAG: 'Haggai',
  ZEC: 'Zechariah', MAL: 'Malachi', MAT: 'Matthew', MRK: 'Mark', LUK: 'Luke',
  JHN: 'John', ACT: 'Acts', ROM: 'Romans', '1CO': '1 Corinthians',
  '2CO': '2 Corinthians', GAL: 'Galatians', EPH: 'Ephesians',
  PHP: 'Philippians', COL: 'Colossians', '1TH': '1 Thessalonians',
  '2TH': '2 Thessalonians', '1TI': '1 Timothy', '2TI': '2 Timothy',
  TIT: 'Titus', PHM: 'Philemon', HEB: 'Hebrews', JAS: 'James',
  '1PE': '1 Peter', '2PE': '2 Peter', '1JN': '1 John', '2JN': '2 John',
  '3JN': '3 John', JUD: 'Jude', REV: 'Revelation',
};

if (!fs.existsSync(USFM_DIR)) {
  console.error(`USFM dir not found: ${USFM_DIR}`);
  process.exit(1);
}

const headings = {}; // bookName -> { chapter: [{ verse, heading }] }

const files = fs
  .readdirSync(USFM_DIR)
  .filter((f) => f.endsWith('.usfm'));

for (const file of files) {
  const code = file.replace(/\.usfm$/, '');
  const bookName = CODE_TO_NAME[code];
  if (!bookName) {
    console.log('SKIP unknown:', code);
    continue;
  }

  const raw = fs.readFileSync(path.join(USFM_DIR, file), 'utf8');
  const lines = raw.split(/\r?\n/);

  let chapter = null;
  let pendingHeading = null;
  const bookHeadings = {};

  for (const line of lines) {
    const cm = line.match(/^\\c\s+(\d+)/);
    if (cm) {
      chapter = parseInt(cm[1], 10);
      pendingHeading = null;
      if (!bookHeadings[chapter]) bookHeadings[chapter] = [];
      continue;
    }

    const sm = line.match(/^\\s[1-4]\s+(.+)$/);
    if (sm && chapter) {
      pendingHeading = sm[1].trim();
      continue;
    }

    // A heading applies to the first verse that follows it on a later line.
    if (pendingHeading && chapter) {
      const vm = line.match(/\\v\s+(\d+)/);
      if (vm) {
        const verse = parseInt(vm[1], 10);
        bookHeadings[chapter].push({ verse, heading: pendingHeading });
        pendingHeading = null;
      }
    }
  }

  headings[bookName] = bookHeadings;
}

console.log('books:', Object.keys(headings).length);
console.log('GEN ch1:', JSON.stringify(headings['Genesis']?.[1]));
console.log('GEN ch2:', JSON.stringify(headings['Genesis']?.[2]));
console.log('GEN ch3:', JSON.stringify(headings['Genesis']?.[3]));
console.log('JHN ch1:', JSON.stringify(headings['John']?.[1]));

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(headings));
console.log('written:', OUT_FILE, fs.statSync(OUT_FILE).size, 'bytes');
