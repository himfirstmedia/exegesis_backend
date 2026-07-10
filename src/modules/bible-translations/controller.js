import { translateText } from "../../utils/translator.js";
import { formatApiResponse } from "../../utils/helpers.js";
import {
  getAllTranslations,
  getTranslationInfo,
  getBooks,
  getBooksWithMaxChapters,
  getChapters,
  getVerses,
  getVersesBatch,
  getVerse,
  searchVerses,
  getChapterRange,
  getReadingProgress,
  BOOK_NAMES,
} from "./service.js";
import { prisma } from "../../config/db.js";

export const listTranslations = async (req, res) => {
  try {
    const translations = await getAllTranslations();
    return res.status(200).json({
      success: true,
      count: translations.length,
      data: translations,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getTranslation = async (req, res) => {
  try {
    const { translationId } = req.params;
    if (!translationId) {
      return res.status(400).json({
        success: false,
        message: "Translation ID is required",
      });
    }
    const translation = await getTranslationInfo(translationId);
    return res.status(200).json({
      success: true,
      data: translation,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const listBooks = async (req, res) => {
  try {
    const { translationId } = req.params;
    if (!translationId) {
      return res.status(400).json({
        success: false,
        message: "Translation ID is required",
      });
    }
    const books = await getBooks(translationId);
    return res.status(200).json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const listBooksWithMaxChapters = async (req, res) => {
  try {
    const { translationId } = req.params;
    if (!translationId) {
      return res.status(400).json({
        success: false,
        message: "Translation ID is required",
      });
    }
    const books = await getBooksWithMaxChapters(translationId);
    return res.status(200).json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const listChapters = async (req, res) => {
  try {
    const { translationId } = req.params;
    const { bookName } = req.body;

    if (!translationId) {
      return res.status(400).json({
        success: false,
        message: "Translation ID is required",
      });
    }

    if (!bookName) {
      return res.status(400).json({
        success: false,
        message: "Book name is required (e.g., 'Genesis')",
      });
    }

    const chapters = await getChapters(translationId, bookName);
    return res.status(200).json({
      success: true,
      data: chapters,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const listVersesBatch = async (req, res) => {
  try {
    const { translationId } = req.params;
    const { bookName, chapters } = req.body;

    if (!translationId) {
      return res.status(400).json({ success: false, message: "Translation ID is required" });
    }
    if (!bookName || !chapters || !Array.isArray(chapters) || chapters.length === 0) {
      return res.status(400).json({ success: false, message: "Book name and chapters array are required" });
    }

    const numericChapters = chapters.map((c) => parseInt(c));
    const data = await getVersesBatch(translationId, bookName, numericChapters);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

export const listVerses = async (req, res) => {
  try {
    const { translationId } = req.params;
    const { bookName, chapter } = req.body;

    if (!translationId) {
      return res.status(400).json({
        success: false,
        message: "Translation ID is required",
      });
    }

    if (!bookName || chapter === undefined) {
      return res.status(400).json({
        success: false,
        message: "Book name and chapter number are required",
      });
    }

    const verses = await getVerses(translationId, bookName, parseInt(chapter));
    return res.status(200).json({
      success: true,
      data: verses,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const getVerseByRef = async (req, res) => {
  try {
    const { translationId } = req.params;
    const { bookName, chapter, verseNumber } = req.body;

    if (!translationId) {
      return res.status(400).json({
        success: false,
        message: "Translation ID is required",
      });
    }

    if (!bookName || chapter === undefined || verseNumber === undefined) {
      return res.status(400).json({
        success: false,
        message: "Book name, chapter, and verse number are required",
      });
    }
    const verseData = await getVerse(translationId, bookName, parseInt(chapter), parseInt(verseNumber));
    return res.status(200).json({
      success: true,
      data: verseData,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const search = async (req, res) => {
  try {
    const { translationId } = req.params;
    const { query, limit } = req.body;

    if (!translationId) {
      return res.status(400).json({
        success: false,
        message: "Translation ID is required",
      });
    }

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const results = await searchVerses(translationId, query, parseInt(limit) || 50);
    return res.status(200).json({
      success: true,
      count: results.length,
      query,
      data: results,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getChapterRangeVerses = async (req, res) => {
  try {
    const { translationId } = req.params;
    const { bookName, startChapter, endChapter } = req.body;

    if (!translationId) {
      return res.status(400).json({
        success: false,
        message: "Translation ID is required",
      });
    }

    if (!bookName || startChapter === undefined || endChapter === undefined) {
      return res.status(400).json({
        success: false,
        message: "Book name, start chapter, and end chapter are required",
      });
    }
    const verses = await getChapterRange(translationId, bookName, parseInt(startChapter), parseInt(endChapter));
    return res.status(200).json({
      success: true,
      data: verses,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const getReading = async (req, res) => {
  try {
    const { translationId } = req.params;
    const { startBook, startChapter, endBook, endChapter } = req.body;

    if (!translationId) {
      return res.status(400).json({
        success: false,
        message: "Translation ID is required",
      });
    }

    if (!startBook || !endBook) {
      return res.status(400).json({
        success: false,
        message: "Start book and end book names are required",
      });
    }

    const reading = await getReadingProgress(
      translationId,
      startBook,
      parseInt(startChapter) || 1,
      endBook,
      parseInt(endChapter) || 1
    );

    return res.status(200).json({
      success: true,
      data: reading,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const getTranslationSettings = async (req, res) => {
  try {
    const [freeSetting, defaultSetting] = await Promise.all([
      prisma.siteSetting.findUnique({ where: { key: "freeTranslationsOnly" } }),
      prisma.siteSetting.findUnique({ where: { key: "defaultTranslationId" } }),
    ]);
    return res.status(200).json({
      success: true,
      data: {
        freeTranslationsOnly: freeSetting ? freeSetting.value === "true" : false,
        defaultTranslationId: defaultSetting?.value || "Berean",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getBookNames = (req, res) => {
  return res.status(200).json({
    success: true,
    count: BOOK_NAMES.length,
    data: BOOK_NAMES,
  });


};

export const getTranslationText = async (req, res) => {

  try {
    const { text,lang } = await req.body;


    if (!text) {
      return res.status(200).json({
        success: false,
        message: "Text to translate is required",
        returnCode:400
      });
    }
    const translation = await translateText(text, lang);
    return res.status(200).json({
      success: true,
      data: translation,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ── Translation ID mapping from search_index values to abbreviation badges ──
const TRANSLATION_ABBR = {
  Berean: 'BSB', KJV: 'KJV', WEB: 'WEB', ASV: 'ASV',
  YLT: 'YLT', Darby: 'DBY', Webster: 'WBS', BBE: 'BBE',
};

export const searchCross = async (req, res) => {
  try {
    const { query, translations, bookName, limit, offset } = req.body;

    if (!query || query.trim().length < 2) {
      return res.status(400).json(formatApiResponse({
        status: 400,
        message: 'Search query must be at least 2 characters',
      }));
    }

    const maxLimit = Math.min(parseInt(limit) || 50, 200);
    const skip = parseInt(offset) || 0;
    const searchTerm = query.trim();

    const conditions = [];
    const params = [];
    let paramCount = 0;

    const addParam = (val) => {
      paramCount++;
      params.push(val);
      return `$${paramCount}`;
    };

    if (Array.isArray(translations) && translations.length > 0) {
      conditions.push(`translation = ANY(${addParam(translations)})`);
    }

    if (bookName) {
      conditions.push(`LOWER(book_name) = LOWER(${addParam(bookName)})`);
    }

    let results;

    // Try tsvector search first, fall back to ILIKE if verse_tsv column doesn't exist
    try {
      conditions.push(`verse_tsv @@ websearch_to_tsquery('english', ${addParam(searchTerm)})`);

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const totalSql = `SELECT COUNT(*)::int AS total FROM search_index ${whereClause}`;
      const totalResult = await prisma.$queryRawUnsafe(totalSql, ...params);
      const total = totalResult[0]?.total || 0;

      const dataSql = `
        SELECT
          translation,
          book_number,
          book_name,
          chapter,
          verse,
          verse_text,
          ts_rank(verse_tsv, websearch_to_tsquery('english', ${addParam(searchTerm)})) AS rank
        FROM search_index
        ${whereClause}
        ORDER BY rank DESC, book_number ASC, chapter ASC, verse ASC
        OFFSET ${skip}
        LIMIT ${maxLimit}
      `;

      const data = await prisma.$queryRawUnsafe(dataSql, ...params);

      results = (data).map(row => ({
        translation: row.translation,
        translationAbbr: TRANSLATION_ABBR[row.translation] || row.translation,
        book_number: Number(row.book_number),
        book_name: row.book_name,
        chapter: Number(row.chapter),
        verse: Number(row.verse),
        verse_text: row.verse_text,
        rank: row.rank ? Number(row.rank) : 0,
      }));

      return res.json(formatApiResponse({
        status: 200,
        message: "OK",
        data: { query: searchTerm, total, page: Math.floor(skip / maxLimit) + 1, limit: maxLimit, data: results },
      }));
    } catch (tsErr) {
      // verse_tsv column doesn't exist yet — fall back to ILIKE across translations
      console.warn('[searchCross] verse_tsv not available, falling back to ILIKE');

      // Rebuild params cleanly for the ILIKE path (discard tsquery params)
      const ilikeParams = [];
      let ilikeIdx = 0;
      const addILikeParam = (val) => {
        ilikeIdx++;
        ilikeParams.push(val);
        return `$${ilikeIdx}`;
      };

      const ilikeConditions = [];
      if (Array.isArray(translations) && translations.length > 0) {
        ilikeConditions.push(`translation = ANY(${addILikeParam(translations)})`);
      }
      if (bookName) {
        ilikeConditions.push(`LOWER(book_name) = LOWER(${addILikeParam(bookName)})`);
      }
      ilikeConditions.push(`verse_text ILIKE ${addILikeParam(`%${searchTerm}%`)}`);

      const ilikeWhere = ilikeConditions.length > 0 ? `WHERE ${ilikeConditions.join(' AND ')}` : '';

      const ilikeTotalSql = `SELECT COUNT(*)::int AS total FROM search_index ${ilikeWhere}`;
      const ilikeTotalResult = await prisma.$queryRawUnsafe(ilikeTotalSql, ...ilikeParams);
      const ilikeTotal = ilikeTotalResult[0]?.total || 0;

      const ilikeDataSql = `
        SELECT
          translation,
          book_number,
          book_name,
          chapter,
          verse,
          verse_text
        FROM search_index
        ${ilikeWhere}
        ORDER BY book_number ASC, chapter ASC, verse ASC
        OFFSET ${skip}
        LIMIT ${maxLimit}
      `;

      const ilikeData = await prisma.$queryRawUnsafe(ilikeDataSql, ...ilikeParams);

      results = (ilikeData).map(row => ({
        translation: row.translation,
        translationAbbr: TRANSLATION_ABBR[row.translation] || row.translation,
        book_number: Number(row.book_number),
        book_name: row.book_name,
        chapter: Number(row.chapter),
        verse: Number(row.verse),
        verse_text: row.verse_text,
        rank: 0,
      }));

      return res.json(formatApiResponse({
        status: 200,
        message: "OK",
        data: { query: searchTerm, total: ilikeTotal, page: Math.floor(skip / maxLimit) + 1, limit: maxLimit, data: results },
      }));
    }
  } catch (error) {
    console.error('[searchCross] error:', error);
    return res.status(500).json(formatApiResponse({
      status: 500,
      message: error.message,
    }));
  }
};

export const searchFTS = async (req, res) => {
  try {
    const { translationId } = req.params;
    const { query, limit, offset, bookName } = req.body;

    if (!query || query.trim().length < 2) {
      return res.status(400).json(formatApiResponse({
        status: 400,
        message: 'Search query must be at least 2 characters',
      }));
    }

    const maxLimit = Math.min(parseInt(limit) || 50, 200);
    const skip = parseInt(offset) || 0;
    const searchTerm = query.trim();

    const conditions = [];
    const params = [];
    let paramCount = 0;

    const addParam = (val) => {
      paramCount++;
      params.push(val);
      return `$${paramCount}`;
    };

    conditions.push(`verse_text ILIKE ${addParam(`%${searchTerm}%`)}`);

    if (translationId) {
      conditions.push(`translation = ${addParam(translationId)}`);
    }
    if (bookName) {
      conditions.push(`LOWER(book_name) = LOWER(${addParam(bookName)})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const totalSql = `SELECT COUNT(*)::int AS total FROM search_index ${whereClause}`;
    const totalResult = await prisma.$queryRawUnsafe(totalSql, ...params);
    const total = totalResult[0]?.total || 0;

    const dataSql = `
      SELECT book_number, book_name, chapter, verse, verse_text
      FROM search_index
      ${whereClause}
      ORDER BY book_number ASC, chapter ASC, verse ASC
      OFFSET ${skip}
      LIMIT ${maxLimit}
    `;

    const data = await prisma.$queryRawUnsafe(dataSql, ...params);

    return res.status(200).json(formatApiResponse({
      status: 200,
      message: "OK",
      data: { query, total, page: Math.floor(skip / maxLimit) + 1, limit: maxLimit, data },
    }));
  } catch (error) {
    console.error('FTS search error:', error);
    return res.status(500).json(formatApiResponse({
      status: 500,
      message: error.message,
    }));
  }
};