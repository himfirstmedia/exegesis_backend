import { serializeBigInt } from '../../utils/helpers.js';
import { prisma } from '../../config/db.js';
import { cache } from '../../services/cacheService.js';
import { getVerse } from '../bible-translations/service.js';
import { normalizeLanguage, translateMany, translateResult } from '../../utils/translator.js';

const CACHE_TTL = 86400;

/** Sections the reader can request one at a time. */
export const RESOURCE_SECTIONS = [
  'explanation',
  'commentaries',
  'crossReferences',
  'wordStudies',
  'dictionary',
  'interlinear',
  'topics',
  'verseReferences',
  'studyTools',
];

/** Section id → response key. The response keeps the legacy key names so the
 *  React Native client (and existing admin tooling) stay compatible. */
const SECTION_KEYS = {
  explanation: 'explanation',
  commentaries: 'commentaries',
  crossReferences: 'crossReferences',
  wordStudies: 'wordStudies',
  dictionary: 'dictionaryTerms',
  interlinear: 'interlinearWords',
  topics: 'relatedTopics',
  verseReferences: 'verseReferences',
  studyTools: 'studyTools',
};

const EMPTY_SECTIONS = {
  explanation: null,
  commentaries: [],
  crossReferences: [],
  wordStudies: [],
  dictionaryTerms: [],
  interlinearWords: [],
  relatedTopics: [],
  themes: [],
  verseReferences: [],
  studyTools: [],
};

/**
 * Translation ids, in fallback order, that the resource lookups can rely on.
 * Note the Berean text is stored as "Berean" (not "BSB") in search_index and
 * verse_words, so a plain "BSB" fallback would silently return nothing.
 */
const TEXT_TRANSLATIONS = ['Berean', 'BSB', 'KJV', 'NIV', 'ESV'];

const toNumber = (value) =>
  value === null || value === undefined ? null : Number(value);

/** Requested translation first, then the ranked fallbacks. */
function translationCandidates(preferred) {
  const list = [preferred, ...TEXT_TRANSLATIONS].filter(Boolean);
  return [...new Set(list)];
}

const asSection = (value) =>
  typeof value === 'string' && RESOURCE_SECTIONS.includes(value) ? value : null;

function parseJsonArray(str, fallback = []) {
  if (!str) return fallback;
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

/** takeaways is persisted as either a JSON array or a plain string. */
function parseTakeaways(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch {
    // fall through to string split
  }
  return value
    .split(/\n|•|;\s/)
    .map((item) => item.trim())
    .filter(Boolean);
}

// ── Source lookups ────────────────────────────────────────────────────────

/** The normalized VerseExplanation record with every rich relation attached. */
async function getExplanationRecord(bookName, chapter, verseNumber) {
  try {
    return await prisma.verseExplanation.findUnique({
      where: {
        bookName_chapter_verseNumber: {
          bookName,
          chapter: BigInt(chapter),
          verseNumber: BigInt(verseNumber),
        },
      },
      include: {
        exegesis: true,
        studyMetadata: true,
        practicalApps: { orderBy: { sortOrder: 'asc' } },
        crossReferences: { orderBy: { sortOrder: 'asc' } },
        themes: { orderBy: { sortOrder: 'asc' } },
        wordStudies: {
          orderBy: { sortOrder: 'asc' },
          include: { strongs: true },
        },
      },
    });
  } catch (error) {
    console.error('getExplanationRecord error:', error.message);
    return null;
  }
}

/**
 * Strong's-tagged words for this verse — powers interlinear + verse refs.
 * Tagging exists for whichever translations have been imported, so this keeps
 * the most completely tagged one rather than filtering by a fixed id.
 */
async function getVerseWordEntries(bookName, chapter, verseNumber) {
  try {
    const rows = await prisma.verseWord.findMany({
      where: { bookName, chapter: BigInt(chapter), verse: BigInt(verseNumber) },
      orderBy: { wordOrder: 'asc' },
      include: {
        strongs: {
          select: {
            strongsId: true,
            originalWord: true,
            transliteration: true,
            pronunciation: true,
            shortDefinition: true,
            partOfSpeech: true,
            language: true,
            verseReferences: true,
          },
        },
      },
    });
    if (rows.length === 0) return [];

    // Prefer the translation with the most tagged words for this verse.
    const counts = new Map();
    for (const row of rows) {
      counts.set(row.translation, (counts.get(row.translation) || 0) + 1);
    }
    const [best] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    return rows.filter((row) => row.translation === best);
  } catch (error) {
    console.error('getVerseWordEntries error:', error.message);
    return [];
  }
}

function verseMatchesTool(tool, verseNumber) {
  const target = Number(verseNumber);
  const refs = Array.isArray(tool.verseRefs) ? tool.verseRefs : [];
  const refMatch = refs.some((ref) => Number(ref?.verse) === target);
  const wordMatch = Array.isArray(tool.studyToolWords)
    && tool.studyToolWords.some((word) => Number(word?.verse) === target);
  return refMatch || wordMatch;
}

async function getStudyToolsForVerse(bookName, chapter, verseNumber) {
  const tools = await prisma.chapterStudyTool.findMany({
    where: { bookName, chapter: BigInt(chapter) },
    orderBy: [{ toolType: 'asc' }, { order: 'asc' }],
    include: {
      studyToolWords: {
        orderBy: { wordOrder: 'asc' },
        include: {
          strongs: {
            select: {
              strongsId: true,
              originalWord: true,
              transliteration: true,
              shortDefinition: true,
              fullDefinition: true,
              adminExplanation: true,
              language: true,
              partOfSpeech: true,
            },
          },
        },
      },
    },
  });

  return tools
    .filter((tool) => verseMatchesTool(tool, verseNumber))
    .map((tool) => {
      const serialized = serializeBigInt(tool);
      return {
        ...serialized,
        verseRefs: Array.isArray(serialized.verseRefs)
          ? serialized.verseRefs.filter((ref) => Number(ref?.verse) === Number(verseNumber))
          : [],
        studyToolWords: Array.isArray(serialized.studyToolWords)
          ? serialized.studyToolWords.filter((word) => Number(word?.verse) === Number(verseNumber))
          : [],
      };
    });
}

/**
 * Everything needed to answer any section request, cached as one bundle so the
 * per-request work stays proportional to the section being read.
 */
async function getSourceBundle(bookName, chapter, verseNumber) {
  return cache.getOrSet(
    'verse-resources',
    `${bookName}:${chapter}:${verseNumber}`,
    async () => {
      const [resource, explanation, studyTools, verseWords] = await Promise.all([
        prisma.verseResource.findFirst({
          where: {
            bookName,
            chapter: BigInt(chapter),
            verseStart: { lte: BigInt(verseNumber) },
            OR: [{ verseEnd: null }, { verseEnd: { gte: BigInt(verseNumber) } }],
          },
          orderBy: { verseStart: 'desc' },
        }),
        getExplanationRecord(bookName, chapter, verseNumber),
        getStudyToolsForVerse(bookName, chapter, verseNumber),
        getVerseWordEntries(bookName, chapter, verseNumber),
      ]);
      return { resource, explanation, studyTools, verseWords };
    },
    CACHE_TTL,
  );
}

// ── Section builders ──────────────────────────────────────────────────────

function buildExplanationSection(explanation) {
  if (!explanation) return null;
  const exegesis = explanation.exegesis || {};
  const metadata = explanation.studyMetadata || {};
  const body = exegesis.explanationText || '';
  const takeaways = parseTakeaways(metadata.takeaways);
  if (!body && !exegesis.applicationText && !metadata.introduction && takeaways.length === 0) {
    return null;
  }

  return {
    explanation: body,
    application: exegesis.applicationText || '',
    introduction: metadata.introduction || '',
    backgroundAuthor: metadata.backgroundAuthor || '',
    backgroundBook: metadata.backgroundBook || '',
    backgroundContext: metadata.backgroundContext || '',
    finalThoughts: metadata.finalThoughts || '',
    takeaways,
    practicalApplications: (explanation.practicalApps || [])
      .map((app) => app.applicationText)
      .filter(Boolean),
  };
}

function buildCommentariesSection(resource) {
  return parseJsonArray(resource?.commentaries).map((entry) => ({
    author: entry?.author || 'Unknown',
    title: entry?.title || '',
    text: entry?.text || '',
  }));
}

/** How many verses to show on either side of a cross reference. */
export const DEFAULT_CONTEXT_RADIUS = 1;
const MAX_CONTEXT_RADIUS = 3;

/** Clamp a caller-supplied context radius into a sane range. */
function normalizeRadius(value) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return DEFAULT_CONTEXT_RADIUS;
  return Math.min(Math.max(parsed, 0), MAX_CONTEXT_RADIUS);
}

/**
 * Resolve each cross reference to real Scripture: the referenced verse plus a
 * window of surrounding verses, so the reader sees the passage in context
 * rather than an isolated sentence.
 *
 * One query covers every reference in the section. For each reference we ask
 * for `[verse - radius, verse + radius]` in the same chapter, then rank the
 * translations so the preferred one wins per verse.
 */
async function resolveReferenceContext(entries, translation, radius = DEFAULT_CONTEXT_RADIUS) {
  const unique = [
    ...new Map(
      entries
        .filter((entry) => entry?.bookName && entry?.chapter && entry?.verse)
        .map((entry) => {
          const key = `${entry.bookName}:${entry.chapter}:${entry.verse}`;
          return [key, {
            key,
            bookName: entry.bookName,
            chapter: Number(entry.chapter),
            verse: Number(entry.verse),
          }];
        }),
    ).values(),
  ];
  if (unique.length === 0) return entries;

  const candidates = translationCandidates(translation);
  const rankOf = (id) => {
    const index = candidates.indexOf(id);
    return index === -1 ? candidates.length : index;
  };

  // verse key → best-ranked text seen so far
  const bestByKey = new Map();
  try {
    const rows = await prisma.searchIndex.findMany({
      where: {
        translation: { in: candidates },
        OR: unique.map((entry) => ({
          bookName: entry.bookName,
          chapter: entry.chapter,
          verse: {
            gte: Math.max(1, entry.verse - radius),
            lte: entry.verse + radius,
          },
        })),
      },
      select: { translation: true, bookName: true, chapter: true, verse: true, verseText: true },
    });
    for (const row of rows) {
      const key = `${row.bookName}:${row.chapter}:${row.verse}`;
      const rank = rankOf(row.translation);
      const current = bestByKey.get(key);
      if (!current || rank < current.rank) {
        bestByKey.set(key, { rank, text: row.verseText });
      }
    }
  } catch (error) {
    console.error('resolveReferenceContext error:', error.message);
  }

  return entries.map((entry) => {
    const key = `${entry.bookName}:${entry.chapter}:${entry.verse}`;
    const contextVerses = [];
    for (
      let verse = Math.max(1, entry.verse - radius);
      verse <= entry.verse + radius;
      verse += 1
    ) {
      const found = bestByKey.get(`${entry.bookName}:${entry.chapter}:${verse}`);
      if (!found) continue;
      contextVerses.push({
        verse,
        text: found.text,
        isFocus: verse === entry.verse,
      });
    }

    return {
      ...entry,
      contextVerses,
      // `text` is the authored reference text, so it is a valid fallback when
      // the verse cannot be resolved from any available translation.
      verseText: entry.verseText || bestByKey.get(key)?.text || entry.text || '',
    };
  });
}

async function buildCrossReferencesSection(explanation, resource, radius) {
  const normalized = (explanation?.crossReferences || []).map((row) => ({
    ref: `${row.bookName} ${toNumber(row.chapter)}:${toNumber(row.verseNumber)}`,
    bookName: row.bookName,
    chapter: toNumber(row.chapter),
    verse: toNumber(row.verseNumber),
    text: row.referenceText || '',
    commentary: row.commentary || '',
    verseText: '',
  }));

  if (normalized.length > 0) {
    return resolveReferenceContext(normalized, explanation?.bibleVersion, radius);
  }

  // Fallback to the flat JSON column used by the legacy resource editor. These
  // entries are enriched with real verse text too, falling back to the
  // authored reference text when the passage cannot be resolved.
  const legacy = parseJsonArray(resource?.crossReferences).map((row) => {
    const ref = typeof row?.ref === 'string' ? row.ref : '';
    const match = ref.match(/^(.+?)\s+(\d+):(\d+)/);
    return {
      ref,
      bookName: match ? match[1].trim() : '',
      chapter: match ? Number(match[2]) : null,
      verse: match ? Number(match[3]) : null,
      text: row?.text || '',
      commentary: row?.commentary || '',
      verseText: row?.text || '',
    };
  });

  return resolveReferenceContext(legacy, resource?.bibleVersion, radius);
}

function buildWordStudiesSection(explanation, resource) {
  const normalized = (explanation?.wordStudies || []).map((entry) => {
    const strongs = entry.strongs || {};
    return {
      word: entry.surfaceText || strongs.originalWord || entry.strongsId || '',
      surfaceText: entry.surfaceText || '',
      originalWord: strongs.originalWord || '',
      transliteration: strongs.transliteration || '',
      pronunciation: strongs.pronunciation || '',
      strongs: entry.strongsId || strongs.strongsId || '',
      partOfSpeech: strongs.partOfSpeech || '',
      language: strongs.language || '',
      definition: strongs.shortDefinition || '',
      fullDefinition: strongs.fullDefinition || '',
      meaning: entry.customDefinition || strongs.adminExplanation || strongs.shortDefinition || '',
    };
  });

  if (normalized.length > 0) return normalized;

  return parseJsonArray(resource?.wordStudies).map((entry) => ({
    word: entry?.word || '',
    surfaceText: entry?.word || '',
    originalWord: '',
    transliteration: entry?.transliteration || '',
    pronunciation: '',
    strongs: entry?.strongs || '',
    partOfSpeech: '',
    language: '',
    definition: '',
    fullDefinition: '',
    meaning: entry?.meaning || '',
  }));
}

/** Legacy shape ({ name }) so the app and admin tooling keep working. */
function buildTopicsSection(explanation, resource) {
  const themes = (explanation?.themes || []).map((theme) => theme.themeName).filter(Boolean);
  if (themes.length > 0) return themes.map((name) => ({ name }));

  return parseJsonArray(resource?.relatedTopics, [
  ])
    .map((topic) => (typeof topic === 'string' ? { name: topic } : topic))
    .filter((topic) => topic?.name);
}

function buildInterlinearSection(verseWords, resource) {
  if (verseWords.length > 0) {
    return verseWords.map((word) => ({
      /** originalWord can be null in the dictionary — fall back to the token. */
      original: word.strongs?.originalWord || word.surfaceText || '',
      strongs: word.strongsId || '',
      transliteration: word.strongs?.transliteration || '',
      translation: word.surfaceText || '',
      grammar: word.morphology || '',
      lemma: word.lemma || '',
    }));
  }

  return parseJsonArray(resource?.interlinearWords).map((entry) => ({
    original: entry?.original || '',
    strongs: entry?.strongs || '',
    transliteration: entry?.transliteration || '',
    translation: entry?.translation || '',
    grammar: entry?.grammar || '',
    lemma: entry?.lemma || '',
  }));
}

/**
 * "Where else it appears" — every Strong's word in this verse linked to the
 * other verses it shows up in (StrongsDictionary.verseReferences).
 */
function buildVerseReferencesSection(verseWords) {
  const rows = [];
  const seen = new Set();

  for (const word of verseWords) {
    const references = word.strongs?.verseReferences;
    if (!Array.isArray(references)) continue;

    for (const reference of references) {
      if (!reference?.bookName || !reference?.chapter || !reference?.verse) continue;
      const key = `${word.strongsId}:${reference.bookName}:${reference.chapter}:${reference.verse}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({
        strongs: word.strongsId || '',
        originalWord: word.strongs?.originalWord || '',
        transliteration: word.strongs?.transliteration || '',
        definition: word.strongs?.shortDefinition || '',
        surfaceText: reference.surfaceText || word.surfaceText || '',
        bookName: reference.bookName,
        chapter: Number(reference.chapter),
        verse: Number(reference.verse),
        translation: reference.translation || 'BSB',
        ref: `${reference.bookName} ${Number(reference.chapter)}:${Number(reference.verse)}`,
      });
    }
  }

  return rows;
}

function buildStudyToolsSection(studyTools) {
  return studyTools || [];
}

/**
 * Number of entries each section will report to the reader. Deliberately
 * cheap — counts come from the cached bundle, so it never triggers the verse
 * text enrichment that only the cross-reference view needs.
 */
function countSections({ resource, explanation, studyTools, verseWords }) {
  const explanationSection = buildExplanationSection(explanation);
  const hasExplanation = Boolean(explanationSection?.explanation);
  const interlinearCount = verseWords.length > 0
    ? verseWords.length
    : parseJsonArray(resource?.interlinearWords).length;

  return {
    explanation: hasExplanation ? 1 : 0,
    commentaries: parseJsonArray(resource?.commentaries).length,
    crossReferences: (explanation?.crossReferences?.length || 0)
      || parseJsonArray(resource?.crossReferences).length,
    wordStudies: (explanation?.wordStudies?.length || 0)
      || parseJsonArray(resource?.wordStudies).length,
    dictionary: parseJsonArray(resource?.dictionaryTerms).length,
    interlinear: interlinearCount,
    topics: (explanation?.themes?.length || 0)
      || parseJsonArray(resource?.relatedTopics).length,
    verseReferences: buildVerseReferencesSection(verseWords).length,
    studyTools: (studyTools || []).length,
  };
}

async function buildSection(section, source, options = {}) {
  const { resource, explanation, studyTools, verseWords } = source;
  switch (section) {
    case 'explanation':
      return buildExplanationSection(explanation);
    case 'commentaries':
      return buildCommentariesSection(resource);
    case 'crossReferences':
      return buildCrossReferencesSection(explanation, resource, options.contextRadius);
    case 'wordStudies':
      return buildWordStudiesSection(explanation, resource);
    case 'dictionary':
      return parseJsonArray(resource?.dictionaryTerms);
    case 'interlinear':
      return buildInterlinearSection(verseWords, resource);
    case 'topics':
      return buildTopicsSection(explanation, resource);
    case 'verseReferences':
      return buildVerseReferencesSection(verseWords);
    case 'studyTools':
      return buildStudyToolsSection(studyTools);
    default:
      return undefined;
  }
}

// ── Translation ───────────────────────────────────────────────────────────

/** Translate authored content while preserving references and lexical data. */
export async function translateResourceData(resource, lang) {
  const target = normalizeLanguage(lang);
  if (!resource || target.toLowerCase() === 'en') return resource;

  const entries = [];
  const addText = (value, setValue) => {
    if (typeof value === 'string' && value.trim()) entries.push({ value, setValue });
  };

  resource.commentaries?.forEach((item) => {
    addText(item.title, value => { item.title = value; });
    addText(item.text, value => { item.text = value; });
  });
  resource.crossReferences?.forEach((item) => {
    addText(item.text, value => { item.text = value; });
    addText(item.commentary, value => { item.commentary = value; });
  });
  resource.wordStudies?.forEach((item) => {
    addText(item.meaning, value => { item.meaning = value; });
    addText(item.definition, value => { item.definition = value; });
  });
  resource.dictionaryTerms?.forEach((item) => {
    addText(item.definition, value => { item.definition = value; });
    addText(item.description, value => { item.description = value; });
  });
  resource.interlinearWords?.forEach((item) => {
    addText(item.translation, value => { item.translation = value; });
  });
  resource.dictionary?.forEach((item) => {
    addText(item.definition, value => { item.definition = value; });
    addText(item.description, value => { item.description = value; });
  });
  resource.interlinear?.forEach((item) => {
    addText(item.translation, value => { item.translation = value; });
  });
  const topicLists = [resource.relatedTopics, resource.themes, resource.topics];
  topicLists.forEach((list) => {
    list?.forEach((item, index) => {
      if (typeof item === 'string') {
        addText(item, value => { list[index] = value; });
      } else if (item && typeof item === 'object') {
        addText(item.name, value => { item.name = value; });
      }
    });
  });
  if (resource.explanation && typeof resource.explanation === 'object') {
    const section = resource.explanation;
    addText(section.explanation, value => { section.explanation = value; });
    addText(section.application, value => { section.application = value; });
    addText(section.introduction, value => { section.introduction = value; });
    addText(section.backgroundContext, value => { section.backgroundContext = value; });
    addText(section.finalThoughts, value => { section.finalThoughts = value; });
    (section.takeaways || []).forEach((item, index) => {
      addText(item, value => { section.takeaways[index] = value; });
    });
    (section.practicalApplications || []).forEach((item, index) => {
      addText(item, value => { section.practicalApplications[index] = value; });
    });
  }
  resource.studyTools?.forEach((tool) => {
    addText(tool.label, value => { tool.label = value; });
    addText(tool.description, value => { tool.description = value; });
    tool.studyToolWords?.forEach((word) => {
      addText(word.adminExplanation, value => { word.adminExplanation = value; });
      if (word.strongs) {
        addText(word.strongs.shortDefinition, value => { word.strongs.shortDefinition = value; });
        addText(word.strongs.fullDefinition, value => { word.strongs.fullDefinition = value; });
        addText(word.strongs.adminExplanation, value => { word.strongs.adminExplanation = value; });
      }
    });
  });

  const translated = await translateMany(entries.map(entry => entry.value), target);
  entries.forEach((entry, index) => entry.setValue(translated[index]));
  return resource;
}

// ── Public service API ────────────────────────────────────────────────────

export const getVerseResources = async (data) => {
  try {
    const { bookName, chapter, verseNumber, lang = 'en' } = data;
    const section = asSection(data.section);
    const contextRadius = normalizeRadius(data.contextRadius);
    if (!bookName || !chapter || !verseNumber) {
      return { status: 400, message: 'bookName, chapter, and verseNumber are required' };
    }

    const source = await getSourceBundle(bookName, chapter, verseNumber);
    const resource = source.resource;

    const payload = {
      id: resource ? Number(resource.id) : 0,
      bookName,
      chapter: Number(chapter),
      verseStart: Number(resource?.verseStart ?? verseNumber),
      verseEnd: toNumber(resource?.verseEnd) ?? Number(verseNumber),
      /** Which section this response carries. `null` = every section (legacy). */
      section,
      /** Entry counts for every section, so the reader can render its rail. */
      sections: countSections(source),
      contextRadius,
      ...EMPTY_SECTIONS,
    };

    // Build only what was asked for; omitting `section` returns everything,
    // which keeps the existing clients (RN app, admin tooling) working.
    const requested = section ? [section] : RESOURCE_SECTIONS;
    for (const id of requested) {
      const value = await buildSection(id, source, { contextRadius });
      if (value === undefined) continue;
      payload[SECTION_KEYS[id]] = value;
      if (id === 'topics') {
        // `themes` is the flat list the web reader renders; `relatedTopics`
        // keeps its original { name } shape for existing clients.
        payload.themes = value.map((topic) => topic.name).filter(Boolean);
      }
    }

    await translateResourceData(payload, lang);

    const response = { status: 200, message: 'Resources retrieved successfully', data: payload };
    return lang !== 'en' ? translateResult(response, lang) : response;
  } catch (error) {
    console.error('getVerseResources error:', error);
    return { status: 500, message: 'Failed to fetch verse resources: ' + error.message };
  }
};

/**
 * Entry counts for every section, for a verse. Everything is cached per verse
 * for a day: the source bundle and the translation count are the expensive
 * parts (a cold translation count parses up to 10 chapter files), so the
 * reader's verse menu and section rail can call this on every open without a
 * second thought. Admin edits invalidate naturally through the TTL.
 */
export const getVerseResourceCounts = async (data) => {
  try {
    const { bookName, chapter, verseNumber } = data;
    if (!bookName || !chapter || !verseNumber) {
      return { status: 400, message: 'bookName, chapter, and verseNumber are required' };
    }

    const sections = await cache.getOrSet(
      'verse-resources-counts',
      `${bookName}:${chapter}:${verseNumber}`,
      async () => {
        const [source, prologueCount, translationsCount] = await Promise.all([
          getSourceBundle(bookName, chapter, verseNumber),
          prisma.bookPrologue.count({ where: { bookName } }),
          countAvailableTranslations(bookName, Number(chapter), Number(verseNumber)),
        ]);
        return {
          ...countSections(source),
          prologue: prologueCount > 0 ? 1 : 0,
          translations: translationsCount,
        };
      },
      CACHE_TTL,
    );
    return {
      status: 200,
      message: 'Section counts retrieved successfully',
      data: {
        bookName,
        chapter: Number(chapter),
        verseNumber: Number(verseNumber),
        sections,
      },
    };
  } catch (error) {
    console.error('getVerseResourceCounts error:', error);
    return { status: 500, message: 'Failed to fetch section counts: ' + error.message };
  }
};

export const getMultipleVerseResources = async (data) => {
  try {
    const { bookName, chapter, verses, lang = 'en' } = data;
    if (!bookName || !chapter || !verses || !Array.isArray(verses)) {
      return { status: 400, message: 'bookName, chapter, and verses array are required' };
    }

    const resources = await prisma.verseResource.findMany({
      where: {
        bookName,
        chapter: BigInt(chapter),
        verseStart: { in: verses.map(v => BigInt(v)) },
      },
      orderBy: { verseStart: 'asc' },
    });

    const serialized = resources.map(r => ({
      ...serializeBigInt(r),
      commentaries: parseJsonArray(r.commentaries),
      crossReferences: parseJsonArray(r.crossReferences),
      wordStudies: parseJsonArray(r.wordStudies),
      dictionaryTerms: parseJsonArray(r.dictionaryTerms),
      interlinearWords: parseJsonArray(r.interlinearWords),
      relatedTopics: parseJsonArray(r.relatedTopics),
    }));
    await Promise.all(serialized.map((r) => translateResourceData(r, lang)));

    const response = {
      status: 200,
      message: 'Resources retrieved successfully',
      data: serialized,
    };
    return lang !== 'en' ? translateResult(response, lang) : response;
  } catch (error) {
    console.error('getMultipleVerseResources error:', error);
    return { status: 500, message: 'Failed: ' + error.message };
  }
};

export const upsertVerseResource = async (data, userId) => {
  try {
    const { id, bookName, chapter, verseStart, verseEnd, commentaries, crossReferences, wordStudies, dictionaryTerms, interlinearWords, relatedTopics } = data;

    if (!bookName || !chapter || !verseStart) {
      return { status: 400, message: 'bookName, chapter, and verseStart are required' };
    }

    const payload = {
      bookName,
      chapter: BigInt(chapter),
      verseStart: BigInt(verseStart),
      verseEnd: verseEnd ? BigInt(verseEnd) : null,
      commentaries: JSON.stringify(commentaries || []),
      crossReferences: JSON.stringify(crossReferences || []),
      wordStudies: JSON.stringify(wordStudies || []),
      dictionaryTerms: JSON.stringify(dictionaryTerms || []),
      interlinearWords: JSON.stringify(interlinearWords || []),
      relatedTopics: JSON.stringify(relatedTopics || []),
      updatedBy: userId,
    };

    let result;
    if (id) {
      result = await prisma.verseResource.update({ where: { id: BigInt(id) }, data: payload });
    } else {
      result = await prisma.verseResource.create({
        data: { ...payload, createdBy: userId },
      });
    }

    await cache.del('verse-resources', `${bookName}:${chapter}:${verseStart}`);
    return {
      status: 200,
      message: 'Resource saved successfully',
      data: {
        ...serializeBigInt(result),
        commentaries: parseJsonArray(result.commentaries),
        crossReferences: parseJsonArray(result.crossReferences),
        wordStudies: parseJsonArray(result.wordStudies),
        dictionaryTerms: parseJsonArray(result.dictionaryTerms),
        interlinearWords: parseJsonArray(result.interlinearWords),
        relatedTopics: parseJsonArray(result.relatedTopics),
      },
    };
  } catch (error) {
    console.error('upsertVerseResource error:', error);
    return { status: 500, message: 'Failed: ' + error.message };
  }
};

/**
 * How many of the comparison translations actually carry this verse. Used by
 * the section counts so empty translations can be hidden up front. Reads
 * through the chapter cache, so it is free once a reader has visited the
 * chapter in any translation.
 */
async function countAvailableTranslations(bookName, chapter, verseNumber) {
  const translations = [
    { id: 'KJV' }, { id: 'NIV' }, { id: 'ESV' }, { id: 'NASB' }, { id: 'NLT' },
    { id: 'BSB' }, { id: 'NKJ' }, { id: 'CSB' }, { id: 'ASV' }, { id: 'YLT' },
  ];
  const found = await Promise.all(
    translations.map(async (t) => {
      try {
        const verse = await getVerse(t.id, bookName, chapter, verseNumber);
        return Boolean(verse?.text);
      } catch {
        return false;
      }
    }),
  );
  return found.filter(Boolean).length;
}

export const compareTranslations = async (data) => {
  try {
    const { bookName, chapter, verseNumber, lang = 'en' } = data;
    if (!bookName || !chapter || !verseNumber) {
      return { status: 400, message: 'bookName, chapter, and verseNumber are required' };
    }

    const translations = [{"id":"KJV","name":"King James Version","abbr":"KJV"},{"id":"NIV","name":"New International Version","abbr":"NIV"},{"id":"ESV","name":"English Standard Version","abbr":"ESV"},{"id":"NASB","name":"New American Standard Bible","abbr":"NASB"},{"id":"NLT","name":"New Living Translation","abbr":"NLT"},{"id":"BSB","name":"Berean Study Bible","abbr":"BSB"},{"id":"NKJ","name":"New King James Version","abbr":"NKJV"},{"id":"CSB","name":"Christian Standard Bible","abbr":"CSB"},{"id":"ASV","name":"American Standard Version","abbr":"ASV"},{"id":"YLT","name":"Young's Literal Translation","abbr":"YLT"}];
    const results = [];

    for (const t of translations) {
      try {
        const verse = await getVerse(t.id, bookName, Number(chapter), Number(verseNumber));
        if (verse) {
          results.push({
            version: t.name,
            abbreviation: t.abbr,
            id: t.id,
            text: verse.text || '',
          });
        }
      } catch (err) {
        // Translation not available, skip silently
      }
    }

    if (results.length === 0) {
      return { status: 404, message: 'No translations found for this verse', data: [] };
    }

    const response = { status: 200, message: 'Translations compared successfully', data: results };
    return lang !== 'en' ? translateResult(response, lang) : response;
  } catch (error) {
    console.error('compareTranslations error:', error);
    return { status: 500, message: 'Failed to compare translations: ' + error.message };
  }
};

export const deleteVerseResource = async (data) => {
  try {
    const { id } = data;
    if (!id) return { status: 400, message: 'id is required' };

    const existing = await prisma.verseResource.findUnique({ where: { id: BigInt(id) } });
    if (!existing) return { status: 404, message: 'Resource not found' };

    await prisma.verseResource.delete({ where: { id: BigInt(id) } });
    await cache.del('verse-resources', `${existing.bookName}:${existing.chapter}:${existing.verseStart}`);

    return { status: 200, message: 'Resource deleted successfully' };
  } catch (error) {
    console.error('deleteVerseResource error:', error);
    return { status: 500, message: 'Failed: ' + error.message };
  }
};
