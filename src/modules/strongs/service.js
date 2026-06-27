import { prisma } from '../../config/db.js';
import { cache } from '../../services/cacheService.js';

const CACHE_TTL = 86400;

export const getStrongsEntry = async (strongsId) => {
  const cacheKey = `${strongsId}`;

  const cached = await cache.get('strongs', cacheKey);
  if (cached) {
    return { status: 200, message: 'Strongs entry fetched from cache', data: cached };
  }

  const entry = await prisma.strongsDictionary.findUnique({
    where: { strongsId },
  });

  if (!entry) {
    return { status: 404, message: 'Strongs entry not found' };
  }

  await cache.set('strongs', cacheKey, entry, CACHE_TTL);

  return { status: 200, message: 'Strongs entry fetched successfully', data: entry };
};

export const searchStrongs = async (query, limit = 50, offset = 0) => {
  const where = {
    OR: [
      { strongsId: { contains: query.trim().toUpperCase(), mode: 'insensitive' } },
      { originalWord: { contains: query.trim(), mode: 'insensitive' } },
      { transliteration: { contains: query.trim(), mode: 'insensitive' } },
      { shortDefinition: { contains: query.trim(), mode: 'insensitive' } },
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
        language: true,
        usageCount: true,
      },
    }),
    prisma.strongsDictionary.count({ where }),
  ]);

  return {
    status: 200,
    message: 'Strongs search results',
    data: { data, total },
  };
};

export const getRelatedWords = async (strongsId) => {
  // Find lemmas for this Strong's number via VerseWord table
  const verseWordLemmas = await prisma.verseWord.findMany({
    where: { strongsId },
    distinct: ['lemma'],
    select: { lemma: true },
  });

  const lemmas = verseWordLemmas.map(r => r.lemma).filter(Boolean);
  if (lemmas.length === 0) {
    return { status: 200, message: 'No related words found', data: [] };
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
    return { status: 200, message: 'No related words found', data: [] };
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

  return { status: 200, message: 'Related words found', data: related };
};

export const getVersesByStrongs = async (strongsId, translation = 'Berean', limit = 50) => {
  const cacheKey = `${strongsId}:${translation}:${limit}`;

  const cached = await cache.get('strongs-verses', cacheKey);
  if (cached) {
    return { status: 200, message: 'Verses fetched from cache', data: cached };
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

  return { status: 200, message: 'Verses fetched successfully', data: result };
};

export const getVerseWords = async (bookName, chapter, verseNumber, translation = 'Berean') => {
  const cacheKey = `${translation}:${bookName}:${chapter}:${verseNumber ?? 'all'}`;

  const cached = await cache.get('verse-words', cacheKey);
  if (cached) {
    return { status: 200, message: 'Verse words fetched from cache', data: cached };
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

  return { status: 200, message: 'Verse words fetched successfully', data: result };
};

export const searchTopics = async (query, limit = 50) => {
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

  return { status: 200, message: 'Topic search results', data: { data, total } };
};

export const getTopicVerses = async (topicName, limit = 50) => {
  const topic = await prisma.bibleTopic.findUnique({
    where: { topicName },
  });

  if (!topic) {
    return { status: 404, message: 'Topic not found', data: [] };
  }

  const refs = topic.verseRefs || [];
  const results = refs.slice(0, limit);
  return { status: 200, message: 'Topic verses found', data: results };
};
