import {
  getAllTranslations,
  getTranslationInfo,
  getBooks,
  getChapters,
  getVerses,
  getVerse,
  searchVerses,
  getChapterRange,
  getReadingProgress,
  BOOK_NAMES,
} from "./service.js";

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

export const getBookNames = (req, res) => {
  return res.status(200).json({
    success: true,
    count: BOOK_NAMES.length,
    data: BOOK_NAMES,
  });
};