import { serializeBigInt } from '../../utils/helpers.js';
import { prisma } from '../../config/db.js';
import { cache } from '../../services/cacheService.js';
import { getVerse } from '../bible-translations/service.js';

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

export const getVerseResources = async (data) => {
  try {
    const { bookName, chapter, verseNumber } = data;
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

    if (!result) {
      return { status: 404, message: 'No resources found for this verse', data: null };
    }

    return { status: 200, message: 'Resources retrieved successfully', data: serializeResources(result) };
  } catch (error) {
    console.error('getVerseResources error:', error);
    return { status: 500, message: 'Failed to fetch verse resources: ' + error.message };
  }
};

export const getMultipleVerseResources = async (data) => {
  try {
    const { bookName, chapter, verses } = data;
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

    return {
      status: 200,
      message: 'Resources retrieved successfully',
      data: resources.map(r => serializeResources(r)),
    };
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
    const { bookName, chapter, verseNumber } = data;
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

    return { status: 200, message: 'Translations compared successfully', data: results };
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
