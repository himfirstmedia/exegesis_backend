/**
 * Seed script — backfills chapter_study_tools (+ study_tool_words).
 *
 * Study tools (commands, promises, warnings, transitions, contrasts, repeated
 * words) are detected from the Berean text using conservative, high-precision
 * cue phrases. Detection is per verse; verses sharing a chapter, tool type,
 * and matched label are merged into one tool row whose verseRefs carries every
 * verse where the pattern appears — matching the schema's
 * @@unique([bookName, chapter, toolType, label]).
 *
 * Usage:
 *   node prisma/seed-study-tools.js                # whole Berean Bible (~10 min)
 *   node prisma/seed-study-tools.js --book=John    # one book
 *   node prisma/seed-study-tools.js --chapter=Genesis:1
 *   node prisma/seed-study-tools.js --limit=5      # first 5 books only (test)
 *   node prisma/seed-study-tools.js --dry-run      # print summary, write nothing
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseString } from 'xml2js';

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const XML_FILE = path.join(
  __dirname, '..', 'src', 'modules', 'bible-translations', 'Holy-Bible-XML-Format', 'EnglishBereanBible.xml',
);

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

// ── Pattern detection ─────────────────────────────────────────────────────
// Deliberately conservative: a false positive pollutes a study surface, so
// every pattern requires an explicit cue phrase.

/** Imperative cues — second-person commands. */
const COMMAND_PATTERNS = [
  { label: 'Call to', regex: /\b(?:go|come|listen|hear|behold)\b[^.!?]{0,40}\by(?:ou|e)\b/i, desc: 'An instruction directed at the reader or listener.' },
  { label: 'Do this', regex: /\by(?:ou|e)\s+(?:shall|must|will)\s+(?:love|keep|observe|serve|fear|trust|remember|believe|follow|obey|repent|pray|give|do|choose)\b/i, desc: 'A direct command to act.' },
  { label: 'Negative command', regex: /\b(?:do not|do not fear|you shall not|never)\b/i, desc: 'A prohibition — something not to do.' },
];

/** Promise cues. */
const PROMISE_PATTERNS = [
  { label: 'I will', regex: /\bI will\b/i, desc: 'God\u2019s stated commitment to act.' },
  { label: 'Blessing', regex: /\bbless(?:ed|ing|ings)\b/i, desc: 'A blessing spoken or promised.' },
  { label: 'Salvation', regex: /\b(?:saved|salvation|eternal life|shall live)\b/i, desc: 'A promise of rescue or life.' },
];

/** Warning cues. */
const WARNING_PATTERNS = [
  { label: 'Woe', regex: /\bwoe to\b/i, desc: 'A solemn warning of judgment.' },
  { label: 'Judgment', regex: /\b(?:judgment|punish|wrath|destroy(?:ed)?)\b/i, desc: 'A warning of consequences to come.' },
  { label: 'Beware', regex: /\b(?:beware|take heed|watch out|be careful)\b/i, desc: 'A call to vigilance.' },
];

/** Transition cues — narrative or argument movement. */
const TRANSITION_PATTERNS = [
  { label: 'Then / Now', regex: /^(?:Then|Now|After this|And it came to pass|In those days)\b/, desc: 'The narrative moves to its next scene.' },
  { label: 'Conclusion', regex: /^(?:Therefore|So then|For this reason|Thus)\b/, desc: 'A conclusion drawn from what came before.' },
  { label: 'Time marker', regex: /\b(?:on the third day|after (?:this|these things)|when (?:the )?fullness of time)\b/i, desc: 'A marked shift in time.' },
];

/** Contrast cues. */
const CONTRAST_PATTERNS = [
  { label: 'But / However', regex: /\b(?:But|However)\b/, desc: 'A turn from the expected direction.' },
  { label: 'Light and darkness', regex: /\blight\b[^.!?]*\bdarkness\b|\bdarkness\b[^.!?]*\blight\b/i, desc: 'The recurring light-versus-darkness contrast.' },
  { label: 'Not X but Y', regex: /\bnot\b[^.!?]{3,60}\bbut\b/i, desc: 'An explicit not-this-but-that contrast.' },
];

const TOOL_TYPES = [
  { toolType: 'COMMAND', patterns: COMMAND_PATTERNS },
  { toolType: 'PROMISE', patterns: PROMISE_PATTERNS },
  { toolType: 'WARNING', patterns: WARNING_PATTERNS },
  { toolType: 'TRANSITION', patterns: TRANSITION_PATTERNS },
  { toolType: 'CONTRAST', patterns: CONTRAST_PATTERNS },
];

/** Content words tracked for the REPEATED_WORD tool. */
const STOPWORDS = new Set((
  'and or the that this these those with without into unto for from have has had was were will would shall should '
  + 'must may might can could do does did done be been being am are is it its his her our your my their them they '
  + 'he she we you i not no nor but if then than as so to of in on at by up out over under again further once '
  + 'all any both each few more most other some such only own same too very just also now new old said says say '
  + 'one two three first last next when where which who whom whose what why how a an o behold yes come came go went'
).split(' '));

function detectTools(text) {
  const hits = [];
  for (const { toolType, patterns } of TOOL_TYPES) {
    for (const { label, regex, desc } of patterns) {
      if (regex.test(text)) hits.push({ toolType, label, desc });
    }
  }
  return hits;
}

function repeatedWords(text) {
  const counts = new Map();
  for (const raw of text.toLowerCase().match(/[a-z]+/g) || []) {
    if (raw.length < 4 || STOPWORDS.has(raw)) continue;
    counts.set(raw, (counts.get(raw) || 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, n]) => n >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([word]) => word);
}

// ── Per-chapter tool assembly ─────────────────────────────────────────────

function buildChapterTools(bookName, chapterNum, verses) {
  /** key: `${toolType}|${label}` → { desc, verseRefs[] } */
  const merged = new Map();

  for (const verse of verses) {
    const excerpt = verse.text.length > 90 ? `${verse.text.slice(0, 90).trimEnd()}…` : verse.text;

    for (const { toolType, label, desc } of detectTools(verse.text)) {
      const key = `${toolType}|${label}`;
      if (!merged.has(key)) merged.set(key, { toolType, label, desc, verseRefs: [] });
      merged.get(key).verseRefs.push({ verse: verse.verse, excerpt });
    }

    for (const word of repeatedWords(verse.text)) {
      const toolType = 'REPEATED_WORD';
      const label = `“${word}”`;
      const key = `${toolType}|${label}`;
      if (!merged.has(key)) {
        merged.set(key, {
          toolType, label,
          desc: `“${word}” repeats within this verse — worth pausing on.`,
          verseRefs: [],
        });
      }
      merged.get(key).verseRefs.push({ verse: verse.verse, excerpt });
    }
  }

  return [...merged.values()].map((entry, index) => ({
    bookName,
    chapter: chapterNum,
    toolType: entry.toolType,
    label: entry.label,
    description: entry.desc,
    verseRefs: entry.verseRefs,
    order: index,
  }));
}

// ── XML parsing ───────────────────────────────────────────────────────────

const parseXml = (xmlContent) =>
  new Promise((resolve, reject) => {
    parseString(xmlContent, { explicitArray: false }, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });

// ── CLI args ──────────────────────────────────────────────────────────────

function readArgs() {
  const args = process.argv.slice(2);
  const get = (name) => {
    // Support both `--name value` and `--name=value`.
    const eq = args.find((a) => a.startsWith(`--${name}=`));
    if (eq) return eq.slice(name.length + 3);
    const idx = args.indexOf(`--${name}`);
    return idx >= 0 ? args[idx + 1] : undefined;
  };
  return {
    book: get('book'),
    chapter: get('chapter'),
    limit: get('limit') ? parseInt(get('limit'), 10) : undefined,
    dryRun: args.includes('--dry-run'),
  };
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  const { book: bookFilter, chapter: chapterFilter, limit, dryRun } = readArgs();
  const updateExisting = process.argv.includes('--update');
  const [filterBook, filterChapter] = chapterFilter ? chapterFilter.split(':') : [null, null];

  console.log('📖 Reading Berean XML...');
  const parsed = await parseXml(fs.readFileSync(XML_FILE, 'utf-8'));

  const testaments = Array.isArray(parsed.bible.testament) ? parsed.bible.testament : [parsed.bible.testament];
  const chapterJobs = [];

  for (const testament of testaments) {
    const books = Array.isArray(testament.book) ? testament.book : [testament.book];
    for (const book of books) {
      const bookNum = parseInt(book.$.number);
      const bookName = BOOK_NAMES[bookNum];
      if (!bookName) continue;
      if (bookFilter && bookName !== bookFilter) continue;
      if (filterBook && bookName !== filterBook) continue;

      const chapters = book.chapter ? (Array.isArray(book.chapter) ? book.chapter : [book.chapter]) : [];
      for (const chapter of chapters) {
        const chapterNum = parseInt(chapter.$.number);
        if (filterChapter && String(chapterNum) !== filterChapter) continue;

        const verses = chapter.verse ? (Array.isArray(chapter.verse) ? chapter.verse : [chapter.verse]) : [];
        const cleaned = verses
          .map((v) => ({ verse: parseInt(v.$.number), text: (typeof v === 'string' ? v : (v._ || '')).trim() }))
          .filter((v) => v.text);

        if (cleaned.length > 0) chapterJobs.push({ bookName, chapterNum, verses: cleaned });
      }
    }
  }

  const jobs = limit ? chapterJobs.slice(0, limit) : chapterJobs;
  console.log(`   ${jobs.length} chapters in scope${dryRun ? ' (dry run)' : ''}\n`);

  let toolsTotal = 0;
  let chaptersTouched = 0;

  for (const job of jobs) {
    const tools = buildChapterTools(job.bookName, job.chapterNum, job.verses);
    if (tools.length === 0) continue;
    chaptersTouched += 1;
    toolsTotal += tools.length;

    if (!dryRun) {
      // One bulk insert per chapter (skipDuplicates keeps re-runs idempotent).
      // Pass --update to refresh existing rows instead, at ~1 round-trip/row.
      if (updateExisting) {
        for (const tool of tools) {
          await prisma.chapterStudyTool.upsert({
            where: {
              bookName_chapter_toolType_label: {
                bookName: tool.bookName,
                chapter: BigInt(tool.chapter),
                toolType: tool.toolType,
                label: tool.label,
              },
            },
            create: {
              bookName: tool.bookName,
              chapter: BigInt(tool.chapter),
              toolType: tool.toolType,
              label: tool.label,
              description: tool.description,
              verseRefs: tool.verseRefs,
              order: tool.order,
            },
            update: {
              description: tool.description,
              verseRefs: tool.verseRefs,
              order: tool.order,
            },
          });
        }
      } else {
        await prisma.chapterStudyTool.createMany({
          data: tools.map((tool) => ({
            bookName: tool.bookName,
            chapter: BigInt(tool.chapter),
            toolType: tool.toolType,
            label: tool.label,
            description: tool.description,
            verseRefs: tool.verseRefs,
            order: tool.order,
          })),
          skipDuplicates: true,
        });
      }
    }

    if (jobs.indexOf(job) % 100 === 0) {
      console.log(`   … ${jobs.indexOf(job)}/${jobs.length} chapters (${toolsTotal} tools so far)`);
    }
  }

  console.log(`\n✅ ${toolsTotal} study tools across ${chaptersTouched} chapters${dryRun ? ' (dry run — nothing written)' : ''}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
