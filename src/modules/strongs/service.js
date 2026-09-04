import { prisma } from '../../config/db.js';
import { cache } from '../../services/cacheService.js';
import { translateBibleTopics, translateStrongsData } from './translation.js';

const CACHE_TTL = 86400;

const translateResponse = async (response, lang, translate = translateStrongsData) => {
  if (response.data === undefined) return response;
  return { ...response, data: await translate(response.data, lang) };
};

export const getStrongsEntry = async (strongsId, lang) => {
  const cacheKey = `${strongsId}`;

  const cached = await cache.get('strongs', cacheKey);
  if (cached) {
    return translateResponse({ status: 200, message: 'Strongs entry fetched from cache', data: cached }, lang);
  }

  const entry = await prisma.strongsDictionary.findUnique({
    where: { strongsId },
  });

  if (!entry) {
    return { status: 404, message: 'Strongs entry not found' };
  }

  await cache.set('strongs', cacheKey, entry, CACHE_TTL);

  return translateResponse({ status: 200, message: 'Strongs entry fetched successfully', data: entry }, lang);
};

export const searchStrongs = async (query, limit = 50, offset = 0, lang) => {
  const trimmedQuery = query.trim();
  const strongsQuery = trimmedQuery.toUpperCase();
  const where = {
    OR: [
      { strongsId: { contains: strongsQuery, mode: 'insensitive' } },
      { originalWord: { contains: trimmedQuery, mode: 'insensitive' } },
      { transliteration: { contains: trimmedQuery, mode: 'insensitive' } },
      { shortDefinition: { contains: trimmedQuery, mode: 'insensitive' } },
      { fullDefinition: { contains: trimmedQuery, mode: 'insensitive' } },
      { adminExplanation: { contains: trimmedQuery, mode: 'insensitive' } },
      {
        verseWords: {
          some: {
            OR: [
              { lemma: { contains: trimmedQuery, mode: 'insensitive' } },
              { surfaceText: { contains: trimmedQuery, mode: 'insensitive' } },
            ],
          },
        },
      },
    ],
  };

  const [data, total] = await Promise.all([
    prisma.strongsDictionary.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { strongsId: 'asc' },
      select: {
        strongsId: true,
        originalWord: true,
        transliteration: true,
        shortDefinition: true,
        fullDefinition: true,
        language: true,
        partOfSpeech: true,
        grammaticalCase: true,
        gender: true,
        number: true,
        usageCount: true,
        crossReferences: true,
        adminExplanation: true,
      },
    }),
    prisma.strongsDictionary.count({ where }),
  ]);

  return translateResponse({
    status: 200,
    message: 'Strongs search results',
    data: { data, total },
  }, lang);
};

export const getRelatedWords = async (strongsId, lang) => {
  // Find lemmas for this Strong's number via VerseWord table
  const verseWordLemmas = await prisma.verseWord.findMany({
    where: { strongsId },
    distinct: ['lemma'],
    select: { lemma: true },
  });

  const lemmas = verseWordLemmas.map(r => r.lemma).filter(Boolean);
  if (lemmas.length === 0) {
    return translateResponse({ status: 200, message: 'No related words found', data: [] }, lang);
  }

  // Find other Strong's numbers sharing those lemmas
  const relatedWords = await prisma.verseWord.findMany({
    where: {
      lemma: { in: lemmas },
      strongsId: { not: null, not: strongsId },
    },
    distinct: ['strongsId'],
    select: { strongsId: true },
    take: 30,
  });

  const relatedIds = relatedWords.map(r => r.strongsId).filter(Boolean);
  if (relatedIds.length === 0) {
    return translateResponse({ status: 200, message: 'No related words found', data: [] }, lang);
  }

  const related = await prisma.strongsDictionary.findMany({
    where: { strongsId: { in: relatedIds } },
    select: {
      strongsId: true,
      originalWord: true,
      transliteration: true,
      shortDefinition: true,
      language: true,
      usageCount: true,
    },
    orderBy: { strongsId: 'asc' },
  });

  return translateResponse({ status: 200, message: 'Related words found', data: related }, lang);
};

export const getVersesByStrongs = async (strongsId, translation = 'Berean', limit = 50, lang) => {
  const cacheKey = `${strongsId}:${translation}:${limit}`;

  const cached = await cache.get('strongs-verses', cacheKey);
  if (cached) {
    return translateResponse({ status: 200, message: 'Verses fetched from cache', data: cached }, lang);
  }

  const words = await prisma.verseWord.findMany({
    where: {
      strongsId,
      translation,
    },
    take: limit,
    orderBy: [
      { bookName: 'asc' },
      { chapter: 'asc' },
      { verse: 'asc' },
      { wordOrder: 'asc' },
    ],
    select: {
      bookName: true,
      chapter: true,
      verse: true,
      surfaceText: true,
      wordOrder: true,
    },
  });

  const result = words.map(w => ({
    bookName: w.bookName,
    chapter: Number(w.chapter),
    verse: Number(w.verse),
    text: w.surfaceText,
    wordOrder: w.wordOrder,
    reference: `${w.bookName} ${w.chapter}:${w.verse}`,
  }));

  await cache.set('strongs-verses', cacheKey, result, CACHE_TTL);

  return translateResponse({ status: 200, message: 'Verses fetched successfully', data: result }, lang);
};

export const getBookWords = async (bookName, limit = 200, offset = 0, lang) => {
  // Find all unique Strong's IDs used in this book via verse_words
  const verseWordIds = await prisma.$queryRaw`
    SELECT DISTINCT vw.strongs_id
    FROM verse_words vw
    WHERE vw.book_name = ${bookName}
      AND vw.strongs_id IS NOT NULL
    ORDER BY vw.strongs_id
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  const strongsIds = verseWordIds.map(r => r.strongs_id).filter(Boolean);
  if (strongsIds.length === 0) {
    return translateResponse({ status: 200, message: 'No Strongs words found for this book', data: [] }, lang);
  }

  // Get total count
  const countResult = await prisma.$queryRaw`
    SELECT COUNT(DISTINCT vw.strongs_id) as total
    FROM verse_words vw
    WHERE vw.book_name = ${bookName}
      AND vw.strongs_id IS NOT NULL
  `;
  const total = Number(countResult[0]?.total || 0);

  // Fetch the Strong's entries with verseReferences for attachment info
  const entries = await prisma.strongsDictionary.findMany({
    where: { strongsId: { in: strongsIds } },
    select: {
      strongsId: true,
      originalWord: true,
      transliteration: true,
      shortDefinition: true,
      fullDefinition: true,
      language: true,
      partOfSpeech: true,
      grammaticalCase: true,
      gender: true,
      number: true,
      usageCount: true,
      crossReferences: true,
      adminExplanation: true,
      verseReferences: true,
    },
    orderBy: { strongsId: 'asc' },
  });

  // Add computed verseCount from verseReferences
  const enriched = entries.map((entry) => ({
    ...entry,
    verseCount: Array.isArray(entry.verseReferences) ? entry.verseReferences.length : 0,
  }));

  return translateResponse({
    status: 200,
    message: 'Book words fetched successfully',
    data: { data: enriched, total, hasNext: offset + limit < total },
  }, lang);
};

export const getVerseWords = async (bookName, chapter, verseNumber, translation = 'Berean', lang) => {
  const cacheKey = `${translation}:${bookName}:${chapter}:${verseNumber ?? 'all'}`;

  const cached = await cache.get('verse-words', cacheKey);
  if (cached) {
    return translateResponse({ status: 200, message: 'Verse words fetched from cache', data: cached }, lang);
  }

  const where = {
    translation,
    bookName,
    chapter: BigInt(chapter),
    ...(verseNumber != null && verseNumber > 0 ? { verse: BigInt(verseNumber) } : {}),
  };

  const words = await prisma.verseWord.findMany({
    where,
    orderBy: [
      { verse: 'asc' },
      { wordOrder: 'asc' },
    ],
    include: {
      strongs: {
        select: {
          strongsId: true,
          originalWord: true,
          transliteration: true,
          shortDefinition: true,
          fullDefinition: true,
          language: true,
          partOfSpeech: true,
          grammaticalCase: true,
          gender: true,
          number: true,
          usageCount: true,
          crossReferences: true,
          adminExplanation: true,
        },
      },
    },
  });

  const result = words.map(w => ({
    wordOrder: w.wordOrder,
    surfaceText: w.surfaceText,
    strongsId: w.strongsId,
    lemma: w.lemma,
    morphology: w.morphology,
    hasData: !!w.strongs,
    verseNumber: Number(w.verse),
    strongs: w.strongs ? {
      strongsId: w.strongs.strongsId,
      originalWord: w.strongs.originalWord,
      transliteration: w.strongs.transliteration,
      shortDefinition: w.strongs.shortDefinition,
      fullDefinition: w.strongs.fullDefinition,
      language: w.strongs.language,
      partOfSpeech: w.strongs.partOfSpeech,
      grammaticalCase: w.strongs.grammaticalCase,
      gender: w.strongs.gender,
      number: w.strongs.number,
      usageCount: w.strongs.usageCount,
      crossReferences: w.strongs.crossReferences,
    } : null,
  }));

  await cache.set('verse-words', cacheKey, result, CACHE_TTL);

  return translateResponse({ status: 200, message: 'Verse words fetched successfully', data: result }, lang);
};

export const searchTopics = async (query, limit = 50, lang) => {
  const where = {
    OR: [
      { topicName: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
    ],
  };

  const [data, total] = await Promise.all([
    prisma.bibleTopic.findMany({
      where,
      take: limit,
      orderBy: { topicName: 'asc' },
    }),
    prisma.bibleTopic.count({ where }),
  ]);

  return translateResponse(
    { status: 200, message: 'Topic search results', data: { data, total } },
    lang,
    translateBibleTopics,
  );
};

export const getTopicVerses = async (topicName, limit = 50, lang) => {
  const topic = await prisma.bibleTopic.findUnique({
    where: { topicName },
  });

  if (!topic) {
    return { status: 404, message: 'Topic not found', data: [] };
  }

  const refs = topic.verseRefs || [];
  const results = refs.slice(0, limit);
  return translateResponse({ status: 200, message: 'Topic verses found', data: results }, lang);
};

export const adminUpdateEntry = async (strongsId, data) => {
  const existing = await prisma.strongsDictionary.findUnique({ where: { strongsId } });
  if (!existing) {
    // Create new entry if it doesn't exist
    const created = await prisma.strongsDictionary.create({
      data: {
        strongsId,
        adminExplanation: data.adminExplanation || null,
        originalWord: data.originalWord || null,
        transliteration: data.transliteration || null,
        shortDefinition: data.shortDefinition || '',
        fullDefinition: data.fullDefinition || null,
        partOfSpeech: data.partOfSpeech || null,
        language: data.language || 'greek',
      },
    });
    return { status: 200, message: 'Strongs entry created', data: created };
  }

  const updated = await prisma.strongsDictionary.update({
    where: { strongsId },
    data: {
      ...(data.adminExplanation !== undefined ? { adminExplanation: data.adminExplanation } : {}),
      ...(data.originalWord !== undefined ? { originalWord: data.originalWord } : {}),
      ...(data.transliteration !== undefined ? { transliteration: data.transliteration } : {}),
      ...(data.shortDefinition !== undefined ? { shortDefinition: data.shortDefinition } : {}),
      ...(data.fullDefinition !== undefined ? { fullDefinition: data.fullDefinition } : {}),
      ...(data.partOfSpeech !== undefined ? { partOfSpeech: data.partOfSpeech } : {}),
      ...(data.language !== undefined ? { language: data.language } : {}),
    },
  });
  return { status: 200, message: 'Strongs entry updated', data: updated };
};

export const getVerseUniqueWords = async (bookName, chapter, verse, translation = 'BSB', page = 0, pageSize = 50, lang) => {
  const cacheKey = `unique:${translation}:${bookName}:${chapter}:${verse ?? 'all'}:p${page}:s${pageSize}`;

  const cached = await cache.get('verse-words', cacheKey);
  if (cached) {
    return translateResponse({ status: 200, message: 'Verse unique words fetched from cache', data: cached }, lang);
  }

  // Get all verse_word records — optionally filtered by chapter and/or verse
  const where = {
    translation,
    bookName,
    ...(chapter != null && chapter > 0 ? { chapter: BigInt(chapter) } : {}),
    ...(verse != null && verse > 0 ? { verse: BigInt(verse) } : {}),
  };

  const words = await prisma.verseWord.findMany({
    where: { ...where, strongsId: { not: null } },
    orderBy: [
      { verse: 'asc' },
      { wordOrder: 'asc' },
    ],
    include: {
      strongs: {
        select: {
          strongsId: true,
          originalWord: true,
          transliteration: true,
          shortDefinition: true,
          fullDefinition: true,
          language: true,
          partOfSpeech: true,
          grammaticalCase: true,
          gender: true,
          number: true,
          usageCount: true,
          crossReferences: true,
          adminExplanation: true,
        },
      },
    },
  });

  // Deduplicate by strongsId — only unique Strong's entries
  const seenIds = new Set();
  const uniqueEntries = [];
  for (const w of words) {
    if (w.strongs && w.strongs.strongsId && !seenIds.has(w.strongs.strongsId)) {
      seenIds.add(w.strongs.strongsId);
      uniqueEntries.push({
        strongsId: w.strongs.strongsId,
        originalWord: w.strongs.originalWord,
        transliteration: w.strongs.transliteration,
        shortDefinition: w.strongs.shortDefinition,
        fullDefinition: w.strongs.fullDefinition,
        language: w.strongs.language,
        partOfSpeech: w.strongs.partOfSpeech,
        grammaticalCase: w.strongs.grammaticalCase,
        gender: w.strongs.gender,
        number: w.strongs.number,
        usageCount: w.strongs.usageCount,
        crossReferences: w.strongs.crossReferences,
        adminExplanation: w.strongs.adminExplanation,
        surfaceText: w.surfaceText,
        wordOrder: w.wordOrder,
        lemma: w.lemma,
        verseNumber: Number(w.verse),
      });
    }
  }

  // Fetch verse-word-study associations for these IDs to indicate which words
  // have admin study notes specifically for this verse
  const uniqueIds = [...seenIds];
  if (uniqueIds.length > 0 && chapter != null && chapter > 0) {
    try {
      const studyWhere = {
        strongsId: { in: uniqueIds },
        bookName,
        ...(chapter > 0 ? { chapter } : {}),
        ...(verse != null && verse > 0 ? { verse } : {}),
      };
      const studies = await prisma.verseWordStudy.findMany({
        where: studyWhere,
        select: { strongsId: true, adminExplanation: true },
      });
      const studyMap = new Map(studies.map(s => [s.strongsId, s.adminExplanation]));
      // Mark each unique entry with whether it has a verse-specific study note
      for (const entry of uniqueEntries) {
        const studyNote = studyMap.get(entry.strongsId);
        entry.verseStudyNote = studyNote || null;
        entry.hasVerseStudy = !!studyNote;
      }
    } catch (e) {
      console.error('[getVerseUniqueWords] Failed to fetch verse word studies:', e);
    }
  }

  const total = uniqueEntries.length;

  // Apply pagination
  const start = page * pageSize;
  const paginated = uniqueEntries.slice(start, start + pageSize);
  const hasNext = start + pageSize < total;

  const result = { data: paginated, total, hasNext };

  await cache.set('verse-words', cacheKey, result, 3600);

  return translateResponse({
    status: 200,
    message: 'Verse unique words fetched successfully',
    data: result,
  }, lang);
};

// ── Sync verse references on StrongsDictionary from verse_word_studies ──

export const syncVerseReferences = async (strongsId) => {
  if (!strongsId) return;

  const studies = await prisma.verseWordStudy.findMany({
    where: { strongsId },
    select: {
      bookName: true,
      chapter: true,
      verse: true,
      translation: true,
      surfaceText: true,
      adminExplanation: true,
    },
    orderBy: [{ bookName: 'asc' }, { chapter: 'asc' }, { verse: 'asc' }],
  });

  const references = studies.map((s) => ({
    bookName: s.bookName,
    chapter: s.chapter,
    verse: s.verse,
    translation: s.translation,
    surfaceText: s.surfaceText || null,
    adminExplanation: s.adminExplanation || null,
  }));

  await prisma.strongsDictionary.update({
    where: { strongsId },
    data: { verseReferences: references.length > 0 ? references : null },
  });

  return { references, count: references.length };
};

export const upsertVerseWordStudy = async ({ strongsId, bookName, chapter, verse, translation, surfaceText, adminExplanation, createdBy }) => {
  const effectiveVerse = verse || null;

  // Find existing study using the compound unique key that includes verse
  const existing = await prisma.verseWordStudy.findUnique({
    where: {
      strongsId_bookName_chapter_verse_translation: {
        strongsId,
        bookName,
        chapter,
        verse: effectiveVerse,
        translation: translation || 'BSB',
      },
    },
  });

  let result;
  if (existing) {
    result = await prisma.verseWordStudy.update({
      where: { id: existing.id },
      data: {
        surfaceText: surfaceText !== undefined ? surfaceText : undefined,
        adminExplanation: adminExplanation !== undefined ? adminExplanation : undefined,
        updatedBy: createdBy || null,
      },
      include: { strongs: true },
    });
  } else {
    // Ensure Strong's entry exists to satisfy FK constraint. If missing,
    // create a minimal placeholder so the new verseWordStudy can reference it.
    if (strongsId) {
      try {
        await prisma.strongsDictionary.upsert({
          where: { strongsId },
          update: {},
          create: { strongsId, shortDefinition: `Imported entry for ${strongsId}`, language: 'hebrew' },
        });
      } catch (e) {
        // Log but continue — if creation fails, the subsequent create may fail
        console.error('[upsertVerseWordStudy] Could not ensure Strongs entry exists:', e);
      }
    }

    result = await prisma.verseWordStudy.create({
      data: {
        strongsId,
        bookName,
        chapter,
        verse: effectiveVerse,
        translation: translation || 'BSB',
        surfaceText: surfaceText || null,
        adminExplanation: adminExplanation || null,
        createdBy: createdBy || null,
      },
      include: { strongs: true },
    });
  }

  // Sync the verse references on the dictionary entry
  await syncVerseReferences(strongsId);

  return {
    status: 200,
    message: existing ? 'Verse word study updated' : 'Verse word study created',
    data: result,
  };
};

export const listVerseWordStudies = async ({ bookName, chapter, verse, translation, page = 0, pageSize = 50 }) => {
  const where = {
    bookName,
    ...(chapter > 0 ? { chapter } : {}),
    ...(verse > 0 ? { verse } : {}),
    ...(translation ? { translation } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.verseWordStudy.findMany({
      where,
      skip: page * pageSize,
      take: pageSize,
      orderBy: { createdOn: 'desc' },
      include: {
        strongs: {
          select: {
            strongsId: true,
            originalWord: true,
            transliteration: true,
            shortDefinition: true,
            language: true,
          },
        },
      },
    }),
    prisma.verseWordStudy.count({ where }),
  ]);

  return {
    status: 200,
    message: 'Verse word studies fetched',
    data: { data, total, hasNext: (page + 1) * pageSize < total },
  };
};

export const deleteVerseWordStudy = async (id) => {
  const study = await prisma.verseWordStudy.findUnique({
    where: { id },
    select: { strongsId: true },
  });
  await prisma.verseWordStudy.delete({ where: { id } });

  // Sync verse references after deletion
  if (study?.strongsId) {
    await syncVerseReferences(study.strongsId);
  }

  return { status: 200, message: 'Verse word study deleted' };
};

export const adminListAllVerseWordStudies = async ({ page = 0, pageSize = 50, search, bookName }) => {
  const where = {};
  if (search) {
    where.OR = [
      { strongsId: { contains: search.trim().toUpperCase(), mode: 'insensitive' } },
      { bookName: { contains: search.trim(), mode: 'insensitive' } },
      { adminExplanation: { contains: search.trim(), mode: 'insensitive' } },
      { surfaceText: { contains: search.trim(), mode: 'insensitive' } },
    ];
  }
  if (bookName) where.bookName = bookName;

  const [data, total] = await Promise.all([
    prisma.verseWordStudy.findMany({
      where,
      skip: page * pageSize,
      take: pageSize,
      orderBy: [{ bookName: 'asc' }, { chapter: 'asc' }, { verse: 'asc' }],
      include: {
        strongs: {
          select: {
            strongsId: true,
            originalWord: true,
            transliteration: true,
            shortDefinition: true,
            language: true,
          },
        },
      },
    }),
    prisma.verseWordStudy.count({ where }),
  ]);

  return {
    status: 200,
    message: 'All verse word studies fetched',
    data: { data, total, hasNext: (page + 1) * pageSize < total },
  };
};

export const getVerseWordStudiesForWord = async (strongsId) => {
  const studies = await prisma.verseWordStudy.findMany({
    where: { strongsId },
    orderBy: [{ bookName: 'asc' }, { chapter: 'asc' }, { verse: 'asc' }],
    include: {
      strongs: {
        select: {
          strongsId: true,
          originalWord: true,
          transliteration: true,
          shortDefinition: true,
          language: true,
        },
      },
    },
  });
  return {
    status: 200,
    message: 'Verse word studies fetched',
    data: studies,
  };
};

// ── Sync all verse references ──

export const syncAllVerseReferences = async () => {
  const grouped = await prisma.verseWordStudy.groupBy({
    by: ['strongsId'],
    _count: { id: true },
  });

  let syncedCount = 0;
  let totalReferences = 0;

  for (const { strongsId } of grouped) {
    const studies = await prisma.verseWordStudy.findMany({
      where: { strongsId },
      select: {
        bookName: true,
        chapter: true,
        verse: true,
        translation: true,
        surfaceText: true,
        adminExplanation: true,
      },
      orderBy: [{ bookName: 'asc' }, { chapter: 'asc' }, { verse: 'asc' }],
    });

    const references = studies.map((s) => ({
      bookName: s.bookName,
      chapter: s.chapter,
      verse: s.verse,
      translation: s.translation,
      surfaceText: s.surfaceText || null,
      adminExplanation: s.adminExplanation || null,
    }));

    await prisma.strongsDictionary.updateMany({
      where: { strongsId },
      data: { verseReferences: references.length > 0 ? references : null },
    });

    syncedCount++;
    totalReferences += references.length;
  }

  return { syncedCount, totalReferences };
};

export const adminListEntries = async ({ page, pageSize, search, language, hasAdminExplanation }) => {
  const where = {};
  if (search) {
    where.OR = [
      { strongsId: { contains: search.trim().toUpperCase(), mode: 'insensitive' } },
      { originalWord: { contains: search.trim(), mode: 'insensitive' } },
      { transliteration: { contains: search.trim(), mode: 'insensitive' } },
      { shortDefinition: { contains: search.trim(), mode: 'insensitive' } },
      { fullDefinition: { contains: search.trim(), mode: 'insensitive' } },
    ];
  }
  if (language) where.language = language;
  if (hasAdminExplanation) {
    where.adminExplanation = { not: null };
  }

  const [data, total] = await Promise.all([
    prisma.strongsDictionary.findMany({
      where,
      skip: page * pageSize,
      take: pageSize,
      orderBy: { strongsId: 'asc' },
    }),
    prisma.strongsDictionary.count({ where }),
  ]);

  // Compute verse attachment counts for each entry
  const strongsIds = data.map((d) => d.strongsId);
  const attachmentCounts = strongsIds.length > 0
    ? await prisma.verseWordStudy.groupBy({
        by: ['strongsId'],
        where: { strongsId: { in: strongsIds } },
        _count: { id: true },
      })
    : [];
  const countMap = new Map(attachmentCounts.map((a) => [a.strongsId, a._count.id]));

  const enriched = data.map((entry) => ({
    ...entry,
    verseCount: countMap.get(entry.strongsId) || 0,
  }));

  return {
    status: 200,
    message: 'Strongs entries fetched',
    data: {
      data: enriched,
      total,
      hasNext: (page + 1) * pageSize < total,
    },
  };
};
