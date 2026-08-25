import { serializeBigInt } from '../../utils/helpers.js';
import { prisma } from '../../config/db.js';
import { cache } from '../../services/cacheService.js';
import { getVerse } from '../bible-translations/service.js';
import { normalizeLanguage, translateMany, translateResult } from '../../utils/translator.js';

const CACHE_TTL = 86400;

function parseJsonArray(str, fallback = []) {
  if (!str) return fallback;
  try { return JSON.parse(str); }
  catch { return fallback; }
}

function serializeResources(resource) {
  if (!resource) return null;
  return {
    ...serializeBigInt(resource),
    commentaries: parseJsonArray(resource.commentaries),
    crossReferences: parseJsonArray(resource.crossReferences),
    wordStudies: parseJsonArray(resource.wordStudies),
    dictionaryTerms: parseJsonArray(resource.dictionaryTerms),
    interlinearWords: parseJsonArray(resource.interlinearWords),
    relatedTopics: parseJsonArray(resource.relatedTopics),
  };
}

function baseVerseResource(bookName, chapter, verseNumber) {
  return {
    id: 0,
    bookName,
    chapter: Number(chapter),
    verseStart: Number(verseNumber),
    verseEnd: Number(verseNumber),
    commentaries: [],
    crossReferences: [],
    wordStudies: [],
    dictionaryTerms: [],
    interlinearWords: [],
    relatedTopics: [],
    studyTools: [],
  };
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
    where: {
      bookName,
      chapter: BigInt(chapter),
    },
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

/** Translate authored explanations while preserving references and lexical data. */
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
  });
  resource.wordStudies?.forEach((item) => {
    addText(item.meaning, value => { item.meaning = value; });
  });
  resource.dictionaryTerms?.forEach((item) => {
    addText(item.definition, value => { item.definition = value; });
    addText(item.description, value => { item.description = value; });
  });
  resource.interlinearWords?.forEach((item) => {
    addText(item.translation, value => { item.translation = value; });
  });
  resource.relatedTopics?.forEach((item, index) => {
    if (typeof item === 'string') {
      addText(item, value => { resource.relatedTopics[index] = value; });
    } else if (item && typeof item === 'object') {
      addText(item.name, value => { item.name = value; });
    }
  });
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

export const getVerseResources = async (data) => {
  try {
    const { bookName, chapter, verseNumber, lang = 'en' } = data;
    if (!bookName || !chapter || !verseNumber) {
      return { status: 400, message: 'bookName, chapter, and verseNumber are required' };
    }

    const cacheKey = `${bookName}:${chapter}:${verseNumber}`;
    const result = await cache.getOrSet('verse-resources', cacheKey, async () => {
      const resource = await prisma.verseResource.findFirst({
        where: {
          bookName,
          chapter: BigInt(chapter),
          verseStart: { lte: BigInt(verseNumber) },
          OR: [
            { verseEnd: null },
            { verseEnd: { gte: BigInt(verseNumber) } },
          ],
        },
        orderBy: { verseStart: 'desc' },
      });
      return resource;
    }, CACHE_TTL);

    const studyTools = await getStudyToolsForVerse(bookName, chapter, verseNumber);
    const resourceData = result ? serializeResources(result) : baseVerseResource(bookName, chapter, verseNumber);
    resourceData.studyTools = studyTools;

    await translateResourceData(resourceData, lang);

    const response = { status: 200, message: 'Resources retrieved successfully', data: resourceData };
    return lang !== 'en' ? translateResult(response, lang) : response;
  } catch (error) {
    console.error('getVerseResources error:', error);
    return { status: 500, message: 'Failed to fetch verse resources: ' + error.message };
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

    const serialized = resources.map(r => serializeResources(r));
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
    return { status: 200, message: 'Resource saved successfully', data: serializeResources(result) };
  } catch (error) {
    console.error('upsertVerseResource error:', error);
    return { status: 500, message: 'Failed: ' + error.message };
  }
};



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
