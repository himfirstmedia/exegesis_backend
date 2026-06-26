/**
 * Seed script — populates the search_index table with verse text for PostgreSQL FTS.
 *
 * Reads Bible XML files from the bible-translations module and inserts every verse
 * into the search_index table. The database trigger automatically generates the
 * tsvector column for full-text search.
 *
 * Usage: node prisma/seed-search-index.js
 *
 * Options:
 *   --translations  Comma-separated list of translation short IDs (default: Berean)
 *                   e.g. --translations=Berean,KJV,ESV
 *   --all           Index all 28 translations (takes ~2-3 minutes)
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseString } from 'xml2js';

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const XML_DIR = path.join(__dirname, '..', 'src', 'modules', 'bible-translations', 'Holy-Bible-XML-Format');

const SHORT_IDS = {
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
  'NKJ': 'EnglishNKJBible',
  'NLT': 'EnglishNLTBible',
  'NRSV': 'EnglishNRSVBible',
  'Passion': 'EnglishPassionBible',
  'RSV': 'EnglishRSVBible',
  'TL': 'EnglishTLBible',
  'Tyndale': 'EnglishTyndale1537Bible',
  'YLT': 'EnglishYLTBible',
};

const BOOK_NAMES = {
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
  62: '1 John', 63: '2 John', 64: '3 John', 65: 'Jude', 66: 'Revelation',
};

const parseXml = (xmlContent) => {
  return new Promise((resolve, reject) => {
    parseString(xmlContent, { explicitArray: false }, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

async function indexTranslation(shortId) {
  const fullId = SHORT_IDS[shortId];
  if (!fullId) {
    console.error(`  ✗ Unknown translation: ${shortId}`);
    return 0;
  }

  const filePath = path.join(XML_DIR, `${fullId}.xml`);
  if (!fs.existsSync(filePath)) {
    console.error(`  ✗ File not found: ${filePath}`);
    return 0;
  }

  console.log(`  Reading ${shortId} (${fullId})...`);
  const xmlContent = fs.readFileSync(filePath, 'utf-8');
  const parsed = await parseXml(xmlContent);

  const testaments = Array.isArray(parsed.bible.testament)
    ? parsed.bible.testament
    : [parsed.bible.testament];

  let total = 0;
  let batch = [];

  const BATCH_SIZE = 500;

  for (const testament of testaments) {
    const books = Array.isArray(testament.book) ? testament.book : [testament.book];

    for (const book of books) {
      const bookNum = parseInt(book.$.number);
      const bookName = BOOK_NAMES[bookNum];
      const chapters = Array.isArray(book.chapter) ? book.chapter : [book.chapter];

      for (const chapter of chapters) {
        const chapterNum = parseInt(chapter.$.number);
        const verses = Array.isArray(chapter.verse) ? chapter.verse : [chapter.verse];

        for (const verse of verses) {
          const verseNum = parseInt(verse.$.number);
          const text = (typeof verse === 'string' ? verse : (verse._ || verse)).trim();

          if (text) {
            batch.push({
              translation: shortId,
              bookNumber: bookNum,
              bookName,
              chapter: chapterNum,
              verse: verseNum,
              verseText: text,
            });

            if (batch.length >= BATCH_SIZE) {
              await prisma.searchIndex.createMany({ data: batch, skipDuplicates: true });
              total += batch.length;
              batch = [];
            }
          }
        }
      }
    }
  }

  if (batch.length > 0) {
    await prisma.searchIndex.createMany({ data: batch, skipDuplicates: true });
    total += batch.length;
  }

  return total;
}

async function main() {
  const args = process.argv.slice(2);
  let translations;

  if (args.includes('--all')) {
    translations = Object.keys(SHORT_IDS);
  } else {
    const customIdx = args.indexOf('--translations');
    if (customIdx !== -1 && args[customIdx + 1]) {
      translations = args[customIdx + 1].split(',').map(s => s.trim());
    } else {
      translations = ['Berean'];
    }
  }

  console.log(`\n📖 Seeding search index for ${translations.length} translation(s):`);
  console.log(`   ${translations.join(', ')}\n`);

  let grandTotal = 0;

  for (const shortId of translations) {
    const count = await indexTranslation(shortId);
    console.log(`  ✓ ${shortId}: ${count.toLocaleString()} verses indexed\n`);
    grandTotal += count;
  }

  console.log(`\n✅ Done — ${grandTotal.toLocaleString()} total verses indexed across ${translations.length} translation(s)`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
