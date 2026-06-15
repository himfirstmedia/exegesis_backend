import { serializeBigInt } from "../../utils/helpers.js";
import { prisma } from "../../config/db.js";
import { getVerse } from "../../modules/bible-translations/service.js";
import { cache } from "../../services/cacheService.js";
import { translateText, translateLongText, translateMany, translateResult } from "../../utils/translator.js";

export const addHighlight = async (data, userId) => {
  const { bookName, chapter, verseNumber, verseNumbers, colorId, note, lang } = data;

  if (!bookName || !chapter || !colorId) {
    return {
      status: 400,
      message: "bookName, chapter, and colorId are required",
    };
  }

  const verses = verseNumbers || (verseNumber ? [verseNumber] : []);
  if (verses.length === 0)
    return { status: 400, message: "verseNumber or verseNumbers is required" };

  const added = [];
  for (const v of verses) {
    try {
      // First check if this highlight already exists
      const existing = await prisma.highlight.findFirst({
        where: {
          createdBy: userId,
          bookName,
          chapter: BigInt(chapter),
          verseNumber: BigInt(v),
        },
      });

      let highlight;
      if (existing) {
        // Update existing highlight
        highlight = await prisma.highlight.update({
          where: { id: existing.id },
          data: {
            colorId: BigInt(colorId),
            note: note || null,
            createdOn: new Date(),
          },
        });
      } else {
        // Create new highlight
        highlight = await prisma.highlight.create({
          data: {
            bookName,
            chapter: BigInt(chapter),
            verseNumber: BigInt(v),
            colorId: BigInt(colorId),
            note: note || null,
            createdBy: userId,
            createdOn: new Date(),
          },
        });
      }
      added.push({
        id: Number(highlight.id),
        bookName: highlight.bookName,
        chapter: Number(highlight.chapter),
        verseNumber: Number(highlight.verseNumber),
        colorId: Number(highlight.colorId),
        note: highlight.note,
        createdBy: highlight.createdBy,
        createdOn: highlight.createdOn
          ? highlight.createdOn.toISOString()
          : null,
      });
    } catch (error) {
      console.error("Error adding highlight:", error.message);
    }
  }

  return { status: 200, message: "Highlight added successfully", data: added };
};

export const getHighlights = async (data, userId) => {
  const {
    bookName,
    chapter,
    verseNumber,
    colorId,
    page = 1,
    pageSize = 20,
  } = data;
  const pageNum = parseInt(page) || 1;
  const pageSizeNum = Math.min(parseInt(pageSize) || 20, 50);
  const offset = (pageNum - 1) * pageSizeNum;

  const whereClause = { createdBy: userId };
  if (bookName) whereClause.bookName = bookName;
  if (chapter) whereClause.chapter = BigInt(chapter);
  if (verseNumber) whereClause.verseNumber = BigInt(verseNumber);
  if (colorId) whereClause.colorId = BigInt(colorId);

  const [highlights, totalCount] = await Promise.all([
    prisma.highlight.findMany({
      where: whereClause,
      skip: offset,
      take: pageSizeNum,
      orderBy: { createdOn: "desc" },
    }),
    prisma.highlight.count({ where: whereClause }),
  ]);

  const serializedHighlights = highlights.map((h) => ({
    id: Number(h.id),
    bookName: h.bookName,
    chapter: Number(h.chapter),
    verseNumber: Number(h.verseNumber),
    colorId: Number(h.colorId),
    note: h.note,
    createdBy: h.createdBy,
    createdOn: h.createdOn ? h.createdOn.toISOString() : null,
  }));

  const totalPages = Math.ceil(totalCount / pageSizeNum);
  return {
    status: 200,
    message: "Highlights fetched successfully",
    data: {
      highlights: serializedHighlights,
      totalCount,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages,
    },
  };
};

export const deleteHighlight = async (data, userId) => {
  const { highlightId } = data;
  if (!highlightId) return { status: 400, message: "Highlight ID is required" };

  await prisma.highlight.delete({
    where: { id: BigInt(highlightId), createdBy: userId },
  });
  return { status: 200, message: "Highlight deleted successfully" };
};

export const addReadHistory = async (data, userId) => {
  const { bookName, chapter, verseNumber } = data;
  if (!bookName || !chapter || !verseNumber)
    return {
      status: 400,
      message: "bookName, chapter, and verseNumber are required",
    };

  const existing = await prisma.readHistory.findUnique({
    where: {
      createdBy_bookName_chapter_verseNumber: {
        createdBy: userId,
        bookName,
        chapter: BigInt(chapter),
        verseNumber: BigInt(verseNumber),
      },
    },
  });

  if (existing) {
    const updated = await prisma.readHistory.update({
      where: { id: existing.id },
      data: { createdOn: new Date() },
    });
    return {
      status: 200,
      message: "Read history updated successfully",
      data: {
        id: Number(updated.id),
        bookName: updated.bookName,
        chapter: Number(updated.chapter),
        verseNumber: Number(updated.verseNumber),
        createdBy: updated.createdBy,
        createdOn: updated.createdOn ? updated.createdOn.toISOString() : null,
      },
    };
  }

  const readHistory = await prisma.readHistory.create({
    data: {
      bookName,
      chapter: BigInt(chapter),
      verseNumber: BigInt(verseNumber),
      createdBy: userId,
      createdOn: new Date(),
    },
  });
  return {
    status: 200,
    message: "Read history added successfully",
    data: {
      id: Number(readHistory.id),
      bookName: readHistory.bookName,
      chapter: Number(readHistory.chapter),
      verseNumber: Number(readHistory.verseNumber),
      createdBy: readHistory.createdBy,
      createdOn: readHistory.createdOn
        ? readHistory.createdOn.toISOString()
        : null,
    },
  };
};

export const getReadHistory = async (data, userId) => {
  const { bookName, chapter, page = 1, pageSize = 20 } = data;
  const pageNum = parseInt(page) || 1;
  const pageSizeNum = Math.min(parseInt(pageSize) || 20, 50);
  const offset = (pageNum - 1) * pageSizeNum;

  const whereClause = { createdBy: userId };
  if (bookName) whereClause.bookName = bookName;
  if (chapter) whereClause.chapter = BigInt(chapter);

  const [readHistories, totalCount] = await Promise.all([
    prisma.readHistory.findMany({
      where: whereClause,
      skip: offset,
      take: pageSizeNum,
      orderBy: { createdOn: "desc" },
    }),
    prisma.readHistory.count({ where: whereClause }),
  ]);

  const serialized = readHistories.map((h) => ({
    id: Number(h.id),
    bookName: h.bookName,
    chapter: Number(h.chapter),
    verseNumber: Number(h.verseNumber),
    createdBy: h.createdBy,
    createdOn: h.createdOn ? h.createdOn.toISOString() : null,
  }));

  const totalPages = Math.ceil(totalCount / pageSizeNum);
  return {
    status: 200,
    message: "Read history fetched successfully",
    data: {
      readHistories: serialized,
      totalCount,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages,
    },
  };
};

export const deleteReadHistory = async (data, userId) => {
  const { readHistoryIds } = data;
  if (!readHistoryIds || !Array.isArray(readHistoryIds))
    return { status: 400, message: "Read history IDs are required" };

  await prisma.readHistory.deleteMany({
    where: { id: { in: readHistoryIds.map(BigInt) }, createdBy: userId },
  });
  return { status: 200, message: "Read history deleted successfully" };
};

export const addFavorite = async (data, userId) => {
  const { bookName, chapter, verseNumber, verseNumbers } = data;
  if (!bookName || !chapter)
    return { status: 400, message: "bookName and chapter are required" };

  const verses = verseNumbers || (verseNumber ? [verseNumber] : []);
  if (verses.length === 0)
    return { status: 400, message: "verseNumber or verseNumbers is required" };

  const added = [];
  for (const v of verses) {
    try {
      const favorite = await prisma.favorite.create({
        data: {
          bookName,
          chapter: BigInt(chapter),
          verseNumber: BigInt(v),
          createdBy: userId,
          createdOn: new Date(),
        },
      });
      added.push({
        id: Number(favorite.id),
        bookName: favorite.bookName,
        chapter: Number(favorite.chapter),
        verseNumber: Number(favorite.verseNumber),
        createdBy: favorite.createdBy,
        createdOn: favorite.createdOn ? favorite.createdOn.toISOString() : null,
      });
    } catch (error) {
      if (error.code !== "P2002") throw error;
    }
  }

  return { status: 200, message: "Favorite added successfully", data: added };
};

export const getFavorites = async (data, userId) => {
  const { bookName, chapter, page = 1, pageSize = 20 } = data;
  const pageNum = parseInt(page) || 1;
  const pageSizeNum = Math.min(parseInt(pageSize) || 20, 50);
  const offset = (pageNum - 1) * pageSizeNum;

  const whereClause = { createdBy: userId };
  if (bookName) whereClause.bookName = bookName;
  if (chapter) whereClause.chapter = BigInt(chapter);

  const [favorites, totalCount] = await Promise.all([
    prisma.favorite.findMany({
      where: whereClause,
      skip: offset,
      take: pageSizeNum,
      orderBy: { createdOn: "desc" },
    }),
    prisma.favorite.count({ where: whereClause }),
  ]);

  const serialized = favorites.map((f) => ({
    id: Number(f.id),
    bookName: f.bookName,
    chapter: Number(f.chapter),
    verseNumber: Number(f.verseNumber),
    createdBy: f.createdBy,
    createdOn: f.createdOn ? f.createdOn.toISOString() : null,
  }));

  const totalPages = Math.ceil(totalCount / pageSizeNum);
  return {
    status: 200,
    message: "Favorites fetched successfully",
    data: {
      favorites: serialized,
      totalCount,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages,
    },
  };
};

export const deleteFavorite = async (data, userId) => {
  const { favoriteId } = data;
  if (!favoriteId) return { status: 400, message: "Favorite ID is required" };

  await prisma.favorite.delete({
    where: { id: BigInt(favoriteId), createdBy: userId },
  });
  return { status: 200, message: "Favorite deleted successfully" };
};

export const getVerseExplanation = async (data) => {
  const { bookName, chapter, verseNumber, lang = 'en' } = data;

  if (!bookName || !chapter || !verseNumber)
    return {
      status: 400,
      message: "bookName, chapter, and verseNumber are required",
    };

  // Try language-specific cache first (avoids re-translating on every request)
  const langCacheKey = `explanation:${bookName}:${chapter}:${verseNumber}:${lang}`;
  const cachedLang = await cache.get('bible', langCacheKey);
  if (cachedLang !== null) return cachedLang;

  // Cache the raw record (non-language-specific)
  const record = await cache.getOrSet(
    'bible',
    `explanation:${bookName}:${chapter}:${verseNumber}`,
    async () => {
      return prisma.verseExplanation.findUnique({
        where: {
          bookName_chapter_verseNumber: {
            bookName,
            chapter: BigInt(chapter),
            verseNumber: BigInt(verseNumber),
          },
        },
      });
    },
    86400,
  );

  if (!record)
    return { status: 404, message: "Verse explanation not found" };

  const serialized = serializeBigInt(record);
  let explanation = serialized.explanation ?? null;
  let learnMore = serialized.learnMore ?? null;

  if (lang !== 'en') {
    const [tExplanation, tLearnMore] = await Promise.all([
      explanation ? translateLongText(explanation, lang) : Promise.resolve(null),
      learnMore ? translateLongText(learnMore, lang) : Promise.resolve(null),
    ]);
    explanation = tExplanation ?? explanation;
    learnMore = tLearnMore ?? learnMore;
  }

  const verseExplanationResult = {
    status: 200,
    message: "Verse explanation fetched successfully",
    data: { ...serialized, explanation, learnMore },
  };
  const finalResult = lang !== 'en' ? translateResult(verseExplanationResult, lang) : verseExplanationResult;

  // Cache the language-specific result so subsequent requests skip translation
  await cache.set('bible', langCacheKey, finalResult, 86400);

  return finalResult;
};

export const addVerseExplanation = async (data, userId) => {
  const {
    bookName,
    chapter,
    verseNumber,
    explanation,
    learnMore,
    bibleVersion,
    promptIds,
    id,
  } = data;
  if (!bookName || !chapter || !verseNumber)
    return {
      status: 400,
      message: "bookName, chapter, and verseNumber are required",
    };

  const promptIdsJson =
    promptIds && Array.isArray(promptIds)
      ? JSON.stringify(promptIds)
      : promptIds;

  let verseExplanation;
  if (id) {
    verseExplanation = await prisma.verseExplanation.update({
      where: { id: BigInt(id) },
      data: {
        bookName,
        chapter: BigInt(chapter),
        verseNumber: BigInt(verseNumber),
        explanation,
        learnMore,
        bibleVersion,
        promptIds: promptIdsJson,
        updatedBy: userId,
      },
    });
  } else {
    verseExplanation = await prisma.verseExplanation.upsert({
      where: {
        bookName_chapter_verseNumber: {
          bookName,
          chapter: BigInt(chapter),
          verseNumber: BigInt(verseNumber),
        },
      },
      update: {
        explanation,
        learnMore,
        bibleVersion,
        promptIds: promptIdsJson,
        updatedBy: userId,
      },
      create: {
        bookName,
        chapter: BigInt(chapter),
        verseNumber: BigInt(verseNumber),
        explanation,
        learnMore,
        bibleVersion,
        promptIds: promptIdsJson,
        createdBy: userId,
      },
    });
  }

  const msg = id
    ? "Verse explanation updated successfully"
    : "Verse explanation added successfully";
  return { status: 200, message: msg, data: serializeBigInt(verseExplanation) };
};

export const getAllVersesExplanation = async (data) => {
  const { page = 1, pageSize = 20, bookName, lang = 'en' } = data;
  const pageNum = parseInt(page) || 1;
  const pageSizeNum = Math.min(parseInt(pageSize) || 20, 50);
  const offset = (pageNum - 1) * pageSizeNum;

  const whereClause = {};
  if (bookName) whereClause.bookName = bookName;

  const [explanations, totalCount] = await Promise.all([
    prisma.verseExplanation.findMany({
      where: whereClause,
      skip: offset,
      take: pageSizeNum,
      orderBy: { bookName: "asc" },
    }),
    prisma.verseExplanation.count({ where: whereClause }),
  ]);

  const serialized = serializeBigInt({ explanations, totalCount, page: pageNum, pageSize: pageSizeNum, totalPages: Math.ceil(totalCount / pageSizeNum) });

  if (lang !== 'en' && serialized.explanations?.length > 0) {
    const expls = serialized.explanations.map((e) => e.explanation || '');
    const learns = serialized.explanations.map((e) => e.learnMore || '');
    const [tExpls, tLearns] = await Promise.all([
      translateMany(expls, lang),
      translateMany(learns, lang),
    ]);
    serialized.explanations.forEach((e, i) => {
      e.explanation = tExpls[i] || e.explanation;
      e.learnMore = tLearns[i] || e.learnMore;
    });
  }

  const result = {
    status: 200,
    message: "Verse explanations fetched successfully",
    data: serialized,
  };
  return lang !== 'en' ? translateResult(result, lang) : result;
};

export const addVerseNote = async (data, userId) => {
  const { bookName, chapter, verseNumber, verseNumbers, note } = data;
  if (!bookName || !chapter || !note)
    return { status: 400, message: "bookName, chapter, and note are required" };

  const verses = verseNumbers || (verseNumber ? [verseNumber] : []);
  if (verses.length === 0)
    return { status: 400, message: "verseNumber or verseNumbers is required" };

  const added = [];
  for (const v of verses) {
    try {
      const existingNote = await prisma.note.findUnique({
        where: {
          createdBy_bookName_chapter_verseNumber: {
            createdBy: userId,
            bookName,
            chapter: BigInt(chapter),
            verseNumber: BigInt(v),
          },
        },
      });

      let verseNote;
      if (existingNote) {
        verseNote = await prisma.note.update({
          where: { id: existingNote.id },
          data: {
            note,
            createdOn: new Date(),
          },
        });
      } else {
        verseNote = await prisma.note.create({
          data: {
            bookName,
            chapter: BigInt(chapter),
            verseNumber: BigInt(v),
            note,
            createdBy: userId,
            createdOn: new Date(),
          },
        });
      }
      added.push({
        id: Number(verseNote.id),
        bookName: verseNote.bookName,
        chapter: Number(verseNote.chapter),
        verseNumber: Number(verseNote.verseNumber),
        note: verseNote.note,
        createdBy: verseNote.createdBy,
        createdOn: verseNote.createdOn
          ? verseNote.createdOn.toISOString()
          : null,
      });
    } catch (error) {
      console.error("Error adding note for verse", v, error);
    }
  }

  return { status: 200, message: "Verse note added successfully", data: added };
};

export const getVerseNote = async (data, userId) => {
  const whereClause = { createdBy: userId };
  if (data.bookName) whereClause.bookName = data.bookName;
  if (data.chapter) whereClause.chapter = BigInt(data.chapter);
  if (data.verseNumber) whereClause.verseNumber = BigInt(data.verseNumber);

  const notes = await prisma.note.findMany({
    where: whereClause,
    orderBy: { createdOn: "desc" },
  });
  const serializedNotes = notes.map((n) => ({
    id: Number(n.id),
    bookName: n.bookName,
    chapter: Number(n.chapter),
    verseNumber: Number(n.verseNumber),
    note: n.note,
    createdBy: n.createdBy,
    createdOn: n.createdOn ? n.createdOn.toISOString() : null,
  }));
  return {
    status: 200,
    message: "Verse notes fetched successfully",
    data: serializedNotes,
  };
};

export const deleteVerseNote = async (data, userId) => {
  const { noteId } = data;
  if (!noteId) return { status: 400, message: "Note ID is required" };

  await prisma.note.delete({
    where: { id: BigInt(noteId), createdBy: userId },
  });
  return { status: 200, message: "Verse note deleted successfully" };
};

export const getVerseByDate = async (data) => {
  const { date, lang = 'en' } = data;
  if (!date) {
    return { status: 400, message: "Date is required" };
  }

  // Try language-specific cache first
  const langCacheKey = `verse-by-date:${date}:${lang}`;
  const cachedLang = await cache.get('bible', langCacheKey);
  if (cachedLang !== null) return cachedLang;

  // Cache only the base verse data (non-language-specific)
  const base = await cache.getOrSet('bible', `verse-by-date:${date}`, async () => {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const dailyVerse = await prisma.dailyVerse.findFirst({
      where: {
        displayDate: {
          gte: startDate,
          lte: endDate,
        },
        isPublished: true,
      },
      orderBy: { displayDate: "asc" },
    });

    if (!dailyVerse) return null;

    const bibleVersion = dailyVerse.bibleVersion || "KJV";
    let verseText = "";
    try {
      const verseData = await getVerse(
        bibleVersion,
        dailyVerse.bookName,
        Number(dailyVerse.chapter),
        Number(dailyVerse.verseNumber),
      );
      verseText = verseData.text || "";
    } catch (e) {
      console.warn("Could not fetch verse text for daily verse:", e.message);
    }

    return {
      dailyVerse: serializeBigInt(dailyVerse),
      bibleVersion,
      verseText,
    };
  }, 3600);

  if (!base) return { status: 200, message: "No daily verse found for the given date" };

  const { dailyVerse: dv, bibleVersion, verseText } = base;

  let explanation = dv.explanation ?? null;
  let learnMore = dv.learnMore ?? null;

  // Prefer VerseExplanation table, fallback to DailyVerse embedded
  const explanationRecord = await getVerseExplanationData(
    dv.bookName,
    dv.chapter,
    dv.verseNumber,
  );
  if (explanationRecord) {
    explanation = explanationRecord.explanation ?? explanation;
    learnMore = explanationRecord.learnMore ?? learnMore;
  }

  if (lang !== 'en') {
    const [tExplanation, tLearnMore] = await Promise.all([
      explanation ? translateLongText(explanation, lang) : Promise.resolve(null),
      learnMore ? translateLongText(learnMore, lang) : Promise.resolve(null),
    ]);
    explanation = tExplanation ?? explanation;
    learnMore = tLearnMore ?? learnMore;
  }

  const verseByDateResult = {
    status: 200,
    message: "Verse fetched successfully",
    data: {
      ...dv,
      reference: `${dv.bookName} ${dv.chapter}:${dv.verseNumber}`,
      translation: bibleVersion,
      text: verseText,
      explanation,
      learnMore,
    },
  };
  const finalResult = lang !== 'en' ? translateResult(verseByDateResult, lang) : verseByDateResult;

  // Cache the language-specific result so subsequent requests skip translation
  await cache.set('bible', langCacheKey, finalResult, 3600);

  return finalResult;
};

/** Fetch verse explanation from DB by book/chapter/verse */
async function getVerseExplanationData(bookName, chapter, verseNumber) {
  try {
    return await prisma.verseExplanation.findUnique({
      where: {
        bookName_chapter_verseNumber: {
          bookName,
          chapter: BigInt(chapter),
          verseNumber: BigInt(verseNumber),
        },
      },
    });
  } catch {
    return null;
  }
}

export const getTodaysVerse = async (data = {}) => {
  const { lang = 'en' } = data;

  // Try language-specific cache first
  const langCacheKey = `todays-verse:${lang}`;
  const cachedLang = await cache.get('bible', langCacheKey);
  if (cachedLang !== null) return cachedLang;

  // Cache only the base verse data (non-language-specific)
  const base = await cache.getOrSet('bible', 'todays-verse', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let dailyVerse = await prisma.dailyVerse.findFirst({
      where: { displayDate: { gte: today }, isPublished: true },
      orderBy: { displayDate: "asc" },
    });

    if (!dailyVerse) {
      dailyVerse = await prisma.dailyVerse.findFirst({
        where: { isPublished: true },
        orderBy: { displayDate: "desc" },
      });
    }

    if (!dailyVerse) return null;

    const bibleVersion = dailyVerse.bibleVersion || "KJV";
    let verseText = "";
    try {
      const verseData = await getVerse(
        bibleVersion,
        dailyVerse.bookName,
        Number(dailyVerse.chapter),
        Number(dailyVerse.verseNumber),
      );
      verseText = verseData.text || "";
    } catch (e) {
      console.warn("Could not fetch verse text for daily verse:", e.message);
    }

    return {
      dailyVerse: serializeBigInt(dailyVerse),
      bibleVersion,
      verseText,
    };
  }, 1800);

  if (!base) return { status: 200, message: "No daily verse found for today" };

  const { dailyVerse: dv, bibleVersion, verseText } = base;

  // Fetch verse explanation — prefer VerseExplanation table, fallback to DailyVerse embedded
  const explanationRecord = await getVerseExplanationData(
    dv.bookName,
    dv.chapter,
    dv.verseNumber,
  );

  let explanation = explanationRecord?.explanation ?? dv.explanation ?? null;
  let learnMore = explanationRecord?.learnMore ?? dv.learnMore ?? null;

  // Translate if non-English
  if (lang !== 'en') {
    const [tExplanation, tLearnMore] = await Promise.all([
      explanation ? translateLongText(explanation, lang) : Promise.resolve(null),
      learnMore ? translateLongText(learnMore, lang) : Promise.resolve(null),
    ]);
    explanation = tExplanation ?? explanation;
    learnMore = tLearnMore ?? learnMore;
  }

  const todaysVerseResult = {
    status: 200,
    message: "Today's verse fetched successfully",
    data: {
      ...dv,
      reference: `${dv.bookName} ${dv.chapter}:${dv.verseNumber}`,
      translation: bibleVersion,
      text: verseText,
      explanation,
      learnMore,
    },
  };
  const finalResult = lang !== 'en' ? translateResult(todaysVerseResult, lang) : todaysVerseResult;

  // Cache the language-specific result so subsequent requests skip translation
  await cache.set('bible', langCacheKey, finalResult, 1800);

  return finalResult;
};

export const getDailyVerseByRef = async (data) => {
  const { bookName, chapter, verseNumber, lang = 'en' } = data || {};
  if (!bookName || !chapter || !verseNumber) {
    return { status: 400, message: "bookName, chapter, and verseNumber are required" };
  }

  const base = await cache.getOrSet(
    'bible',
    `daily-verse-ref:${bookName}:${chapter}:${verseNumber}`,
    async () => {
      const dailyVerse = await prisma.dailyVerse.findFirst({
        where: {
          bookName: { equals: bookName, mode: "insensitive" },
          chapter: BigInt(chapter),
          verseNumber: BigInt(verseNumber),
          isPublished: true,
        },
        orderBy: { updatedOn: "desc" },
      });

      return dailyVerse || null;
    },
    86400,
  );

  if (!base) {
    return { status: 404, message: "No daily verse found for this reference" };
  }

  const dv = serializeBigInt(base);
  let reflection = dv.reflection || null;

  if (lang !== 'en' && reflection) {
    reflection = await translateLongText(reflection, lang);
  }

  const result = {
    status: 200,
    message: "Daily verse found",
    data: { ...dv, reflection },
  };
  return lang !== 'en' ? translateResult(result, lang) : result;
};

export const getTodaysDevotion = async (data = {}) => {
  const { lang = 'en' } = data;

  const base = await cache.getOrSet('bible', 'todays-devotion', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let dailyDevotion = await prisma.dailyDevotion.findFirst({
      where: { displayDate: { gte: today }, isPublished: true },
      orderBy: { displayDate: "asc" },
    });

    if (!dailyDevotion) {
      dailyDevotion = await prisma.dailyDevotion.findFirst({
        where: { isPublished: true },
        orderBy: { displayDate: "desc" },
      });
    }

    return dailyDevotion;
  }, 1800);

  if (!base)
    return { status: 404, message: "No daily devotion found for today" };

  const dv = serializeBigInt(base);
  let title = dv.title;
  let content = dv.content;

  if (lang !== 'en') {
    const [tTitle, tContent] = await Promise.all([
      translateLongText(title, lang),
      translateLongText(content, lang),
    ]);
    title = tTitle ?? title;
    content = tContent ?? content;
  }

  const result = {
    status: 200,
    message: "Today's devotion fetched successfully",
    data: { ...dv, title, content },
  };
  return lang !== 'en' ? translateResult(result, lang) : result;
};

export const getDevotionByDate = async (data) => {
  const { date, lang = 'en' } = data;
  if (!date) {
    return { status: 400, message: "Date is required" };
  }

  const base = await cache.getOrSet('bible', `devotion-by-date:${date}`, async () => {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const whereClause = {
      displayDate: {
        gte: startDate,
        lte: endDate,
      },
      isPublished: true,
    };

    const devotions = await prisma.dailyDevotion.findMany({
      where: whereClause,
      orderBy: { displayDate: "asc" },
      take: 1,
    });

    return devotions.length > 0 ? devotions[0] : null;
  }, 3600);

  if (!base)
    return { status: 404, message: "No devotion found for the given date" };

  const dv = serializeBigInt(base);
  let title = dv.title;
  let content = dv.content;

  if (lang !== 'en') {
    const [tTitle, tContent] = await Promise.all([
      translateLongText(title, lang),
      translateLongText(content, lang),
    ]);
    title = tTitle ?? title;
    content = tContent ?? content;
  }

  const result = {
    status: 200,
    message: "Devotion fetched successfully",
    data: { ...dv, title, content },
  };
  return lang !== 'en' ? translateResult(result, lang) : result;
};

export const getAllDailyDevotionsPublic = async (data) => {
  const {
    page = 0,
    size = 12,
    startDate,
    endDate,
    smartDefault,
    futureDays = 2,
    lang = 'en',
  } = data || {};
  const pageNum = parseInt(page) || 0;
  const pageSize = Math.min(parseInt(size) || 12, 50);

  const whereClause = { isPublished: true };

  if (startDate || endDate) {
    whereClause.displayDate = {};
    if (startDate) whereClause.displayDate.gte = new Date(startDate);
    if (endDate) whereClause.displayDate.lte = new Date(endDate);
  }

  if (smartDefault) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + (futureDays || 2));

    whereClause.OR = [
      { displayDate: { gte: today, lte: futureDate }, isPublished: true },
      { displayDate: { lt: today }, isPublished: true },
    ];
  }

  const [devotions, totalElements] = await Promise.all([
    prisma.dailyDevotion.findMany({
      where: whereClause,
      orderBy: { displayDate: "desc" },
      skip: pageNum * pageSize,
      take: pageSize,
    }),
    prisma.dailyDevotion.count({ where: whereClause }),
  ]);

  const content = serializeBigInt(devotions);
  const totalPages = Math.ceil(totalElements / pageSize);

  // Translate devotion titles and content
  if (lang !== 'en' && content.length > 0) {
    const [translatedTitles, translatedContent] = await Promise.all([
      translateMany(content.map((d) => d.title || ''), lang),
      translateMany(content.map((d) => d.content || ''), lang),
    ]);
    content.forEach((d, i) => {
      d.title = translatedTitles[i] || d.title;
      d.content = translatedContent[i] || d.content;
    });
  }

  const result = {
    status: 200,
    message: "Daily devotions fetched successfully",
    data: {
      content,
      currentPage: pageNum,
      pageSize,
      totalElements,
      totalPages,
      hasNext: pageNum < totalPages - 1,
      hasPrevious: pageNum > 0,
      isFirst: pageNum === 0,
      isLast: pageNum >= totalPages - 1,
    },
  };
  return lang !== 'en' ? translateResult(result, lang) : result;
};

export const getHomeStats = async (userId) => {
  const [
    highlightCount,
    favoriteCount,
    noteCount,
    readHistoryCount,
    planProgressCount,
  ] = await Promise.all([
    prisma.highlight.count({ where: { createdBy: userId } }),
    prisma.favorite.count({ where: { createdBy: userId } }),
    prisma.note.count({ where: { createdBy: userId } }),
    prisma.readHistory.count({ where: { createdBy: userId } }),
    prisma.userPlanProgress.count({ where: { userId } }),
  ]);

  return {
    status: 200,
    message: "Home stats fetched successfully",
    data: {
      highlightCount,
      favoriteCount,
      noteCount,
      readHistoryCount,
      planProgressCount,
    },
  };
};

/** Format a date as a locale-aware relative time string (Node Intl is guaranteed) */
function formatActivityTime(time, lang = 'en') {
  if (!time) return '';
  const date = new Date(time);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isToday)
    return date.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });

  if (isYesterday) {
    try {
      return new Intl.RelativeTimeFormat(lang, { numeric: 'auto' }).format(-1, 'day');
    } catch {
      return date.toLocaleDateString(lang, { weekday: 'long' });
    }
  }

  const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 7) return date.toLocaleDateString(lang, { weekday: 'short' });

  return date.toLocaleDateString(lang, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export const getRecentActivity = async (userId, limit = 10, lang = 'en') => {
  const limitNum = Math.min(parseInt(limit) || 10, 20);

  const [
    recentReads,
    recentHighlights,
    recentNotes,
    recentFavorites,
    planProgress,
  ] = await Promise.all([
    prisma.readHistory.findMany({
      where: { createdBy: userId },
      take: limitNum,
      orderBy: { createdOn: "desc" },
    }),
    prisma.highlight.findMany({
      where: { createdBy: userId },
      take: limitNum,
      orderBy: { createdOn: "desc" },
    }),
    prisma.note.findMany({
      where: { createdBy: userId },
      take: limitNum,
      orderBy: { createdOn: "desc" },
    }),
    prisma.favorite.findMany({
      where: { createdBy: userId },
      take: limitNum,
      orderBy: { createdOn: "desc" },
    }),
    prisma.userPlanProgress.findMany({
      where: { userId },
      include: { readingPlan: true },
      orderBy: { lastCompletedDate: "desc" },
      take: 3,
    }),
  ]);

  // Translate plan titles upfront
  const planTitles = planProgress.map((p) => p.readingPlan?.title || "Reading Plan");
  const translatedPlanTitles = lang !== 'en'
    ? await translateMany(planTitles, lang)
    : planTitles;

  const allActivities = [
    ...recentReads.map((r) => ({
      type: "read",
      id: r.id,
      book: r.bookName,
      chapter: Number(r.chapter),
      verse: Number(r.verseNumber),
      time: r.createdOn,
      formattedTime: formatActivityTime(r.createdOn, lang),
    })),
    ...recentHighlights.map((h) => ({
      type: "highlight",
      id: h.id,
      book: h.bookName,
      chapter: Number(h.chapter),
      verse: Number(h.verseNumber),
      colorId: Number(h.colorId),
      time: h.createdOn,
      formattedTime: formatActivityTime(h.createdOn, lang),
    })),
    ...recentNotes.map((n) => ({
      type: "note",
      id: n.id,
      book: n.bookName,
      chapter: Number(n.chapter),
      verse: Number(n.verseNumber),
      time: n.createdOn,
      formattedTime: formatActivityTime(n.createdOn, lang),
    })),
    ...recentFavorites.map((f) => ({
      type: "favorite",
      id: f.id,
      book: f.bookName,
      chapter: Number(f.chapter),
      verse: Number(f.verseNumber),
      time: f.createdOn,
      formattedTime: formatActivityTime(f.createdOn, lang),
    })),
    ...planProgress.map((p, i) => {
      const completedDays = p.completedDaysJson
        ? JSON.parse(p.completedDaysJson)
        : [];
      const lastCompleted = completedDays[completedDays.length - 1];
      const planTime = p.lastCompletedDate || p.startDate;
      return {
        type: "plan",
        id: p.id,
        book: translatedPlanTitles[i] || planTitles[i],
        chapter: lastCompleted || 0,
        verse: completedDays.length,
        time: planTime,
        formattedTime: formatActivityTime(planTime, lang),
        planId: p.planId,
        isPlanCompleted: p.isCompleted,
      };
    }),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const seenBooks = new Set();
  const activities = [];

  for (const act of allActivities) {
    if (activities.length >= 3) break;

    if (act.type === "plan") {
      activities.push(act);
    } else {
      const bookKey = act.book.toLowerCase();
      if (!seenBooks.has(bookKey)) {
        seenBooks.add(bookKey);
        activities.push(act);
      }
    }
  }

  const recentActivityResult = {
    status: 200,
    message: "Recent activity fetched successfully",
    data: serializeBigInt(activities),
  };
  return lang !== 'en' ? translateResult(recentActivityResult, lang) : recentActivityResult;
};

export const deleteVerseExplanation = async (data, userId) => {
  const { id } = data;
  if (!id) return { status: 400, message: "Explanation ID is required" };

  await prisma.verseExplanation.delete({ where: { id: BigInt(id) } });
  return { status: 200, message: "Verse explanation deleted successfully" };
};
