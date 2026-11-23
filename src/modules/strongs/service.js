import { prisma } from '../../config/db.js';
import { translateBibleTopics, translateStrongsData } from './translation.js';
import { translateSearchPage } from './searchTranslation.js';
import { editionKey, getEditorialReferences, strongsAliases, strongsKey, withEditorialReferences } from './editorialWords.js';
import { withStrongsGloss } from './surfaceText.js';

// URL callers often pass "g25" or "G25" while the dictionary stores zero-padded
// ids such as "G0025". Normalizing here keeps both forms resolvable.
const normalizeStrongsId = (value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  const match = trimmed.match(/^([GHgh])\s*0*(\d+)$/);
  if (!match) return trimmed.toUpperCase();
  return `${match[1].toUpperCase()}${match[2].padStart(4, '0')}`;
};

const studyOnlyEntry = strongsId => ({
  strongsId, hasDictionaryEntry: false, language: strongsId.startsWith('G') ? 'greek' : 'hebrew',
  originalWord: null, transliteration: null, shortDefinition: '', fullDefinition: null,
  partOfSpeech: null, grammaticalCase: null, gender: null, number: null, usageCount: null, crossReferences: null,
});

const BROWSE_PREVIEW_LIMIT = 6;
const BROWSE_STUDIES_LIMIT = 3;
const shortPreview = (value, limit) => {
  const text = value?.trim() || '';
  if (text.length <= limit) return text;
  const head = text.slice(0, limit - 1);
  const breakAt = head.lastIndexOf(' ');
  return `${breakAt > limit / 2 ? head.slice(0, breakAt) : head}…`;
};
const toBrowsePreview = entry => {
  // Do not send the full definitions, duplicate notes in verseReferences, or
  // dozens of studies per card to the translation pipeline for a list page.
  const { fullDefinition, adminExplanation, crossReferences, verseReferences, contextualStudies,
    gender, number, grammaticalCase, ...word } = entry;
  const first = contextualStudies[0];
  return {
    ...word, shortDefinition: shortPreview(word.shortDefinition || fullDefinition, 180),
    contextualStudyCount: contextualStudies.length,
    contextualStudies: first ? [{
      reference: first.reference, surfaceText: first.surfaceText, sortOrder: first.sortOrder,
      customDefinition: shortPreview(first.customDefinition, 220), themes: [],
    }] : [],
  };
};

const translateResponse = async (response, lang, translate = translateStrongsData) => {
  if (response.data === undefined) return response;
  return { ...response, data: await translate(response.data, lang) };
};

const parseCrossReferenceDetails = (value) => {
  if (typeof value !== 'string') return [];
  return value.split(/[;,]/).map((part) => {
    const match = part.trim().replace(/\.$/, '').match(/^((?:[1-3]\s)?[A-Za-z]+(?:\s+[A-Za-z]+)*)\s+(\d+):(\d+)$/);
    return match ? {
      reference: match[0],
      bookName: match[1],
      chapter: Number(match[2]),
      verse: Number(match[3]),
    } : null;
  }).filter(Boolean);
};

const addCrossReferenceTexts = async (entries, translation) => {
  const references = entries.flatMap((entry) => parseCrossReferenceDetails(entry.crossReferences));
  if (references.length === 0) {
    return entries.map((entry) => ({ ...entry, crossReferenceDetails: [] }));
  }

  const verses = await prisma.searchIndex.findMany({
    where: {
      OR: references.map((reference) => ({
        translation,
        bookName: reference.bookName,
        chapter: reference.chapter,
        verse: reference.verse,
      })),
    },
    select: { bookName: true, chapter: true, verse: true, verseText: true },
  });
  const verseWords = await prisma.verseWord.findMany({
    where: {
      OR: references.map((reference) => ({
        translation,
        bookName: reference.bookName,
        chapter: BigInt(reference.chapter),
        verse: BigInt(reference.verse),
      })),
    },
    select: { bookName: true, chapter: true, verse: true, surfaceText: true, wordOrder: true },
    orderBy: { wordOrder: "asc" },
  });
  const textByKey = new Map(
    verses.map((verse) => [
      `${verse.bookName}:${verse.chapter}:${verse.verse}`,
      verse.verseText,
    ]),
  );
  const wordsByKey = new Map();
  for (const word of verseWords) {
    const key = `${word.bookName}:${word.chapter}:${word.verse}`;
    const words = wordsByKey.get(key) || [];
    words.push(word.surfaceText);
    wordsByKey.set(key, words);
  }

  return entries.map((entry) => ({
    ...entry,
    crossReferenceDetails: parseCrossReferenceDetails(entry.crossReferences).map((reference) => ({
      ...reference,
      translation,
      verseText: textByKey.get(`${reference.bookName}:${reference.chapter}:${reference.verse}`) || null,
      verseWords: wordsByKey.get(`${reference.bookName}:${reference.chapter}:${reference.verse}`) || [],
    })),
  }));
};

export const getStrongsEntry = async (strongsId, lang = 'en', { bookName, studyOffset = 0 } = {}) => {
  const [normalizedId, ...aliases] = strongsAliases(strongsId);

  // Editorial records can change independently (explanation/resource editors).
  // Read them fresh; translation itself remains content-key cached.

  const query = {
    where: { strongsId: normalizedId },
    ...(!bookName && { include: {
      verseExplanationWordStudies: {
        where: { explanation: { sharedStudyId: null } },
        orderBy: { sortOrder: 'asc' },
        select: {
          surfaceText: true,
          customDefinition: true,
          sortOrder: true,
          explanation: {
            select: {
              bookName: true,
              chapter: true,
              verseNumber: true,
              bibleVersion: true,
              themes: {
                orderBy: { sortOrder: 'asc' },
                select: { themeName: true },
              },
              crossReferences: {
                orderBy: { sortOrder: 'asc' },
                select: {
                  bookName: true,
                  chapter: true,
                  verseNumber: true,
                  referenceText: true,
                  commentary: true,
                },
              },
            },
          },
        },
      },
    } }),
  };
  const [primary, refs] = await Promise.all([
    prisma.strongsDictionary.findUnique(query), getEditorialReferences({ strongsId, ...(bookName ? { bookName } : {}) }),
  ]);
  let entry = primary;
  for (const id of aliases) {
    if (entry) break;
    entry = await prisma.strongsDictionary.findUnique({ ...query, where: { strongsId: id } });
  }
  if (bookName) {
    if (!entry && !refs.length) return { status: 404, message: 'Strong’s entry not found for this book' };
    const [word] = withEditorialReferences([
      entry ? { ...entry, hasDictionaryEntry: true } : studyOnlyEntry(strongsKey(strongsId)),
    ], refs);
    const { contextualStudies: studies, verseReferences, ...fields } = word;
    const contextualStudies = studies.slice(studyOffset, studyOffset + BROWSE_STUDIES_LIMIT);
    const next = studyOffset + contextualStudies.length;
    const [data] = await translateSearchPage([{
      ...fields, contextualStudies, contextualStudyCount: studies.length,
      nextStudyOffset: next < studies.length ? next : null,
    }], lang);
    return { status: 200, message: 'Strong’s word studies fetched successfully', data };
  }

  if (!entry) {
    if (refs.length) {
      const [study] = withEditorialReferences([studyOnlyEntry(strongsKey(strongsId))], refs);
      return translateResponse({ status: 200, message: 'Strong’s verse studies fetched successfully', data: study }, lang);
    }
    return { status: 404, message: 'Strongs entry not found' };
  }

  const enrichedEntry = {
    ...entry,
    hasDictionaryEntry: true,
    contextualStudies: (entry.verseExplanationWordStudies || []).map((study) => ({
      surfaceText: study.surfaceText,
      customDefinition: study.customDefinition,
      sortOrder: study.sortOrder,
      reference: study.explanation
        ? {
            bookName: study.explanation.bookName,
            chapter: study.explanation.chapter,
            verseNumber: study.explanation.verseNumber,
            bibleVersion: study.explanation.bibleVersion,
          }
        : null,
      themes: study.explanation?.themes?.map((theme) => theme.themeName) || [],
      crossReferences: study.explanation?.crossReferences?.map((reference) => ({
        ref: `${reference.bookName} ${reference.chapter}:${reference.verseNumber}`,
        text: reference.referenceText || reference.commentary || '',
      })) || [],
    })),
  };

  delete enrichedEntry.verseExplanationWordStudies;
  const [currentEntry] = withEditorialReferences([enrichedEntry], refs);
  // Attach the reader-language gloss split from every saved surface text, so
  // full entries (random Browse details) carry the same localized word labels
  // as the paged list rows.
  return translateResponse({ status: 200, message: 'Strongs entry fetched successfully', data: withStrongsGloss(currentEntry) }, lang);
};

export const searchStrongs = async (query, limit = 2, offset = 0, lang = 'en', language) => {
  limit = Math.min(2, Math.max(1, limit));
  const trimmedQuery = query.trim();
  if (/^[HG]\d+[A-Z]?$/i.test(trimmedQuery)) {
    const result = await getStrongsEntry(trimmedQuery, 'en');
    const matches = result.status === 200 && (!language || language.toLowerCase() === 'all' ||
      result.data.language.toLowerCase() === language.toLowerCase());
    const data = matches && offset === 0 ? await translateSearchPage([result.data], lang) : [];
    return { status: 200, message: 'Strongs search results',
      data: { data, total: matches ? 1 : 0, hasNext: false, contentLanguage: lang } };
  }
  const strongsQuery = trimmedQuery.toUpperCase();
  const where = {};
  if (trimmedQuery) where.OR = [
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
      {
        verseExplanationWordStudies: {
          some: {
            OR: [
              { surfaceText: { contains: trimmedQuery, mode: 'insensitive' } },
              { customDefinition: { contains: trimmedQuery, mode: 'insensitive' } },
              {
                explanation: {
                  themes: {
                    some: {
                      themeName: { contains: trimmedQuery, mode: 'insensitive' },
                    },
                  },
                },
              },
            ],
          },
        },
      },
    ];
  if (language && language.toLowerCase() !== 'all') {
    where.language = { equals: language, mode: 'insensitive' };
  }

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
        pronunciation: true,
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
        verseExplanationWordStudies: {
          orderBy: { sortOrder: 'asc' },
          select: {
            surfaceText: true,
            customDefinition: true,
            sortOrder: true,
            explanation: {
              select: {
                bookName: true,
                chapter: true,
                verseNumber: true,
                bibleVersion: true,
                themes: {
                  orderBy: { sortOrder: 'asc' },
                  select: { themeName: true },
                },
                crossReferences: {
                  orderBy: { sortOrder: 'asc' },
                  select: {
                    bookName: true,
                    chapter: true,
                    verseNumber: true,
                    referenceText: true,
                    commentary: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.strongsDictionary.count({ where }),
  ]);

  const enrichedData = data.map(({ verseExplanationWordStudies, ...entry }) => ({
    ...entry,
    contextualStudies: verseExplanationWordStudies.map((study) => ({
      surfaceText: study.surfaceText,
      customDefinition: study.customDefinition,
      sortOrder: study.sortOrder,
      reference: study.explanation
        ? {
            bookName: study.explanation.bookName,
            chapter: study.explanation.chapter,
            verseNumber: study.explanation.verseNumber,
            bibleVersion: study.explanation.bibleVersion,
          }
        : null,
      themes: study.explanation?.themes?.map((theme) => theme.themeName) || [],
      crossReferences: study.explanation?.crossReferences?.map((reference) => ({
        ref: `${reference.bookName} ${reference.chapter}:${reference.verseNumber}`,
        text: reference.referenceText || reference.commentary || '',
      })) || [],
    })),
  }));

  const translated = await translateSearchPage(enrichedData, lang);
  return {
    status: 200,
    message: 'Strongs search results',
    data: { data: translated, total, hasNext: offset + data.length < total, contentLanguage: lang },
  };
};

export const getRelatedWords = async (strongsId, lang) => {
  // Find lemmas for this Strong's number via VerseWord table
  const verseWordLemmas = await prisma.verseWord.findMany({
    where: { strongsId: normalizeStrongsId(strongsId) },
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
  strongsId = normalizeStrongsId(strongsId);

  const words = await prisma.verseWord.findMany({
    where: {
      strongsId,
      translation: editionKey(translation) === 'BSB' ? { in: ['BSB', 'Berean'] } : translation,
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

  const refs = (await getEditorialReferences({ strongsId }))
    .filter(ref => ref.verse != null && editionKey(ref.translation) === editionKey(translation));
  const existing = new Set(result.map(ref => `${ref.bookName}:${ref.chapter}:${ref.verse}`));
  for (const ref of refs) {
    const key = `${ref.bookName}:${ref.chapter}:${ref.verse}`;
    if (existing.has(key)) continue;
    existing.add(key);
    result.push({ bookName: ref.bookName, chapter: ref.chapter, verse: ref.verse,
      text: ref.surfaceText || '', wordOrder: 0, reference: `${ref.bookName} ${ref.chapter}:${ref.verse}` });
  }

  return translateResponse({ status: 200, message: 'Verses fetched successfully', data: result.slice(0, limit) }, lang);
};

export const getBookWords = async (bookName, limit = 4, offset = 0, lang = 'en', language = 'all', view) => {
  const preview = view === 'preview';
  limit = Math.min(preview ? BROWSE_PREVIEW_LIMIT : 4, Math.max(1, limit));
  const languageFilter = language && language.toLowerCase() !== 'all'
    ? language.toLowerCase()
    : null;
  const references = await getEditorialReferences({ bookName });
  const editorialIds = [...new Set(references.map(ref => strongsKey(ref.strongsId)))].filter(id =>
    /^[HG]\d+[A-Z]?$/.test(id) && (!languageFilter || (id.startsWith('G') ? 'greek' : 'hebrew') === languageFilter));
  const editorialKeys = new Set(editorialIds);
  const where = {
    ...(languageFilter ? { language: { equals: languageFilter, mode: 'insensitive' } } : {}),
    OR: [{ verseWords: { some: { bookName } } }, { strongsId: { in: [...new Set([
      ...editorialIds.flatMap(strongsAliases),
      ...references.filter(ref => editorialKeys.has(strongsKey(ref.strongsId))).map(ref => ref.strongsId),
    ])] } }],
  };
  const select = {
    strongsId: true, originalWord: true, transliteration: true, pronunciation: true,
    shortDefinition: true, fullDefinition: true, language: true, partOfSpeech: true,
    grammaticalCase: true, gender: true, number: true, usageCount: true,
    crossReferences: true, adminExplanation: true,
  };
  let entries;
  let total;
  if (!editorialIds.length) {
    [entries, total] = await Promise.all([
      prisma.strongsDictionary.findMany({ where, skip: offset, take: limit, select, orderBy: { strongsId: 'asc' } }),
      prisma.strongsDictionary.count({ where }),
    ]);
    entries = entries.map(entry => ({ ...entry, hasDictionaryEntry: true }));
  } else {
    // Fetch only IDs for the union, then load definitions for the visible page.
    const dictionaryIds = await prisma.strongsDictionary.findMany({
      where, select: { strongsId: true }, orderBy: { strongsId: 'asc' },
    });
    const byKey = new Map();
    for (const { strongsId } of dictionaryIds) {
      const key = strongsKey(strongsId);
      if (!byKey.has(key) || strongsId === strongsAliases(key)[0]) byKey.set(key, strongsId);
    }
    const keys = [...new Set([...byKey.keys(), ...editorialIds])].sort(
      (a, b) => strongsAliases(a)[0].localeCompare(strongsAliases(b)[0]),
    );
    total = keys.length;
    const pageKeys = keys.slice(offset, offset + limit);
    const pageIds = pageKeys.map(key => byKey.get(key)).filter(Boolean);
    const dictionary = pageIds.length ? await prisma.strongsDictionary.findMany({
      where: { strongsId: { in: pageIds } }, select,
    }) : [];
    const byId = new Map(dictionary.map(entry => [entry.strongsId, entry]));
    entries = pageKeys.map(key => {
      const entry = byId.get(byKey.get(key));
      return entry ? { ...entry, hasDictionaryEntry: true } : studyOnlyEntry(key);
    });
  }

  const enriched = withEditorialReferences(entries, references);
  const translated = await translateSearchPage(preview ? enriched.map(toBrowsePreview) : enriched, lang);
  const hasNext = offset + entries.length < total && entries.length > 0;
  return {
    status: 200,
    message: 'Book words fetched successfully',
    data: { data: translated, total, hasNext, contentLanguage: lang,
      ...(preview ? { nextOffset: hasNext ? offset + entries.length : null } : {}) },
  };
};

// Random browse draws a wider alphabetically-ordered window and shuffles it,
// which avoids the clustered result of `ORDER BY random()` while still needing
// a single database round trip.
const RANDOM_BROWSE_WINDOW = 36;
/** Canonical Strong's number ranges (Greek G1–G5624, Hebrew H1–H8674). */
const isValidStrongsId = value => {
  const match = String(value || '').trim().toUpperCase().match(/^([GH])(\d{1,5})$/);
  if (!match) return false;
  const number = Number(match[2]);
  return number > 0 && number <= (match[1] === 'G' ? 5624 : 8674);
};
const shuffle = values => {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
};

export const getRandomWords = async (limit = 6, lang = 'en', language = 'all', view) => {
  const preview = view === 'preview';
  const take = Math.min(preview ? BROWSE_PREVIEW_LIMIT : 4, Math.max(1, limit));
  const languageFilter = language && language.toLowerCase() !== 'all'
    ? language.toLowerCase()
    : null;
  const where = languageFilter
    ? { language: { equals: languageFilter, mode: 'insensitive' } }
    : {};
  const total = await prisma.strongsDictionary.count({ where });
  if (!total) {
    return {
      status: 200,
      message: 'Random words fetched successfully',
      data: { data: [], total: 0, hasNext: false, contentLanguage: lang, nextOffset: null },
    };
  }
  const windowSize = Math.min(RANDOM_BROWSE_WINDOW, total);
  const skip = Math.floor(Math.random() * Math.max(1, total - windowSize + 1));
  const pool = await prisma.strongsDictionary.findMany({
    where,
    skip,
    take: windowSize,
    select: {
      strongsId: true, originalWord: true, transliteration: true, pronunciation: true,
      shortDefinition: true, fullDefinition: true, language: true, partOfSpeech: true,
      grammaticalCase: true, gender: true, number: true, usageCount: true,
      crossReferences: true, adminExplanation: true,
    },
    orderBy: { strongsId: 'asc' },
  });
  // The dictionary table also holds manually entered records; keep ids outside
  // the canonical Strong's number ranges out of the random feed.
  const valid = pool.filter(entry => isValidStrongsId(entry.strongsId));
  const picked = shuffle(valid).slice(0, take).map(entry => ({ ...entry, hasDictionaryEntry: true }));
  // Enrich the page with the editorial word studies saved in the web editors,
  // so Browse cards carry their "Definition and contextual meaning" text.
  const references = picked.length
    ? await getEditorialReferences({ strongsIds: picked.map(entry => entry.strongsId) })
    : [];
  const enriched = withEditorialReferences(picked, references);
  const translated = await translateSearchPage(preview ? enriched.map(toBrowsePreview) : enriched, lang);
  return {
    status: 200,
    message: 'Random words fetched successfully',
    data: {
      data: translated,
      total,
      hasNext: total > picked.length,
      contentLanguage: lang,
      nextOffset: null,
    },
  };
};

export const getVerseWords = async (bookName, chapter, verseNumber, translation = 'Berean', lang) => {

  const where = {
    translation: editionKey(translation) === 'BSB' ? { in: ['BSB', 'Berean'] } : translation,
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
  strongsId = normalizeStrongsId(strongsId);
  const existing = await prisma.strongsDictionary.findUnique({ where: { strongsId } });
  if ((!existing && !data.shortDefinition?.trim()) || (data.shortDefinition !== undefined && !data.shortDefinition.trim())) {
    return { status: 400, message: 'A short definition is required' };
  }
  const expectedLanguage = strongsId.startsWith('H') ? 'hebrew' : 'greek';
  if (data.language && data.language !== expectedLanguage) {
    return { status: 400, message: 'Strong’s language must match its H (Hebrew) or G (Greek) ID' };
  }
  const fields = ['adminExplanation', 'originalWord', 'transliteration', 'shortDefinition', 'fullDefinition',
    'partOfSpeech', 'pronunciation', 'grammaticalCase', 'gender', 'number', 'usageCount', 'crossReferences'];
  const payload = Object.fromEntries(fields.filter(key => data[key] !== undefined).map(key => [key, data[key]]));
  if (!existing) {
    // Create new entry if it doesn't exist
    const created = await prisma.strongsDictionary.create({
      data: {
        strongsId,
        ...payload,
        language: expectedLanguage,
      },
    });
    return { status: 200, message: 'Strongs entry created', data: created };
  }

  const updated = await prisma.strongsDictionary.update({
    where: { strongsId },
    data: {
      ...payload,
      language: expectedLanguage,
    },
  });
  return { status: 200, message: 'Strongs entry updated', data: updated };
};

export const adminDeleteEntry = async (strongsId) => {
  strongsId = normalizeStrongsId(strongsId);
  const entry = await prisma.strongsDictionary.findUnique({ where: { strongsId }, include: { _count: { select: {
    verseWords: true, studyToolWords: true, verseWordStudies: true, verseExplanationWordStudies: true,
  } } } });
  if (!entry) return { status: 404, message: 'Strong’s entry not found' };
  const references = await getEditorialReferences({ strongsId });
  if (Object.values(entry._count).some(Boolean) || references.length) {
    return { status: 409, message: 'This word is in use. Remove its editorial links in their original editors first; imported Scripture mappings must be preserved.' };
  }
  await prisma.strongsDictionary.delete({ where: { strongsId } });
  return { status: 200, message: 'Unused Strong’s entry deleted' };
};

export const getVerseUniqueWords = async (bookName, chapter, verse, translation = 'BSB', page = 0, pageSize = 50, lang) => {

  // Get all verse_word records — optionally filtered by chapter and/or verse
  const where = {
    translation: editionKey(translation) === 'BSB' ? { in: ['BSB', 'Berean'] } : translation,
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

  const refs = (await getEditorialReferences({ bookName, chapter, verse }))
    .filter(ref => editionKey(ref.translation) === editionKey(translation));
  const missingIds = [...new Set(refs.map(ref => ref.strongsId))].filter(id => !seenIds.has(id));
  const editorialEntries = missingIds.length ? await prisma.strongsDictionary.findMany({ where: { strongsId: { in: missingIds } }, orderBy: { strongsId: 'asc' } }) : [];
  for (const entry of editorialEntries) uniqueEntries.push({ ...entry, surfaceText: refs.find(ref => ref.strongsId === entry.strongsId)?.surfaceText || null });
  const enrichedEntries = await addCrossReferenceTexts(withEditorialReferences(uniqueEntries, refs), translation);
  const total = enrichedEntries.length;

  // Apply pagination
  const start = page * pageSize;
  const paginated = enrichedEntries.slice(start, start + pageSize);
  const hasNext = start + pageSize < total;

  const result = { data: paginated, total, hasNext };

  // This includes independently edited attachments/resources; do not retain a
  // stale aggregate after an administrator changes one of those sources.

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

  const verseKeys = [
    ...new Map(
      studies.map((study) => [
        `${study.translation || "BSB"}:${study.bookName}:${study.chapter}:${study.verse}`,
        study,
      ]),
    ).values(),
  ];
  const verseTexts = await prisma.searchIndex.findMany({
    where: {
      OR: verseKeys.map((study) => ({
        translation: study.translation || "BSB",
        bookName: study.bookName,
        chapter: Number(study.chapter),
        verse: Number(study.verse),
      })),
    },
    select: { translation: true, bookName: true, chapter: true, verse: true, verseText: true },
  });
  const verseTextByKey = new Map(
    verseTexts.map((verse) => [
      `${verse.translation}:${verse.bookName}:${verse.chapter}:${verse.verse}`,
      verse.verseText,
    ]),
  );
  const references = studies.map((s) => ({
    bookName: s.bookName,
    chapter: s.chapter,
    verse: s.verse,
    translation: s.translation,
    surfaceText: s.surfaceText || null,
    verseText:
      verseTextByKey.get(
        `${s.translation || "BSB"}:${s.bookName}:${s.chapter}:${s.verse}`,
      ) || null,
    adminExplanation: s.adminExplanation || null,
  }));

  await prisma.strongsDictionary.update({
    where: { strongsId },
    data: { verseReferences: references.length > 0 ? references : null },
  });

  return { references, count: references.length };
};

export const upsertVerseWordStudy = async ({ strongsId, bookName, chapter, verse, translation, surfaceText, adminExplanation, createdBy }) => {
  strongsId = normalizeStrongsId(strongsId);
  translation = editionKey(translation) === 'BSB' ? 'BSB' : translation;
  const entry = await prisma.strongsDictionary.findUnique({ where: { strongsId } });
  if (!entry) return { status: 400, message: 'Create the dictionary entry before attaching this word' };
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
  if (!study) return { status: 404, message: 'Verse word study not found' };
  await prisma.verseWordStudy.delete({ where: { id } });

  // Sync verse references after deletion
  if (study?.strongsId) {
    await syncVerseReferences(study.strongsId);
  }

  return { status: 200, message: 'Verse word study deleted' };
};

export const adminListAllVerseWordStudies = async ({ page = 0, pageSize = 50, search, bookName, strongsId }) => {
  page = Math.max(0, Math.floor(Number(page) || 0));
  pageSize = Math.min(100, Math.max(1, Math.floor(Number(pageSize) || 50)));
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
  if (strongsId) where.strongsId = normalizeStrongsId(strongsId);

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
  page = Math.max(0, Math.floor(Number(page) || 0));
  pageSize = Math.min(100, Math.max(1, Math.floor(Number(pageSize) || 50)));
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
