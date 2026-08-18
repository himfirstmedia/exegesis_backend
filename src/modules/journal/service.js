import { serializeBigInt } from "../../utils/helpers.js";
import { prisma } from "../../config/db.js";
import { cache } from "../../services/cacheService.js";
import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGO_PATH = path.join(__dirname, "../../../src/assets/logo.png");


export const createJournalEntry = async (data, userId) => {
  const {
    title,
    content,
    bookName,
    chapter,
    verseNumber,
    category,
    mood,
    prayers,
    gratitude,
    learnings,
    application,
    isPublished,
    isFavorite,
    tags,
    strongsWords,  // JSON: [{ strongsId, surfaceText, lemma }]
    strongsIds,    // Comma-separated: "H7225,G26,G2889"
    source,        // "manual" | "exegesis-lab"
  } = data;

  if (!content) {
    return { returnCode: 400, returnMessage: "Content is required" };
  }

  const journalEntry = await prisma.journalEntry.create({
    data: {
      userId,
      title,
      content,
      bookName: bookName || null,
      chapter: chapter ? BigInt(chapter) : null,
      verseNumber: verseNumber ? BigInt(verseNumber) : null,
      category: category || "general",
      mood: mood || null,
      prayers: prayers || null,
      gratitude: gratitude || null,
      learnings: learnings || null,
      application: application || null,
      isPublished: isPublished || false,
      isFavorite: isFavorite || false,
      strongsWords: strongsWords || null,
      strongsIds: strongsIds || null,
      source: source || 'manual',
      tags: tags || null,
      createdBy: userId,
    },
  });

  return {
    returnCode: 200,
    returnMessage: "Journal entry created successfully",
    returnData: serializeBigInt(journalEntry),
  };
};

export const updateJournalEntry = async (data, userId) => {
  const {
    id,
    title,
    content,
    bookName,
    chapter,
    verseNumber,
    category,
    mood,
    prayers,
    gratitude,
    learnings,
    application,
    isPublished,
    isFavorite,
    tags,
    strongsWords,
    strongsIds,
    source,
  } = data;

  if (!id) {
    return { returnCode: 400, returnMessage: "Journal entry ID is required" };
  }

  const existing = await prisma.journalEntry.findFirst({
    where: { id: BigInt(id), userId },
  });

  if (!existing) {
    return { returnCode: 404, returnMessage: "Journal entry not found" };
  }

  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (content !== undefined) updateData.content = content;
  if (bookName !== undefined) updateData.bookName = bookName;
  if (chapter !== undefined) updateData.chapter = chapter ? BigInt(chapter) : null;
  if (verseNumber !== undefined) updateData.verseNumber = verseNumber ? BigInt(verseNumber) : null;
  if (category !== undefined) updateData.category = category;
  if (mood !== undefined) updateData.mood = mood;
  if (prayers !== undefined) updateData.prayers = prayers;
  if (gratitude !== undefined) updateData.gratitude = gratitude;
  if (learnings !== undefined) updateData.learnings = learnings;
  if (application !== undefined) updateData.application = application;
  if (isPublished !== undefined) updateData.isPublished = isPublished;
  if (isFavorite !== undefined) updateData.isFavorite = isFavorite;
  if (tags !== undefined) updateData.tags = tags;
  if (strongsWords !== undefined) updateData.strongsWords = strongsWords;
  if (strongsIds !== undefined) updateData.strongsIds = strongsIds;
  if (source !== undefined) updateData.source = source;

  updateData.updatedBy = userId;

  const journalEntry = await prisma.journalEntry.update({
    where: { id: BigInt(id) },
    data: updateData,
  });

  return {
    returnCode: 200,
    returnMessage: "Journal entry updated successfully",
    returnData: serializeBigInt(journalEntry),
  };
};

export const deleteJournalEntry = async (data, userId) => {
  const { id } = data;
  if (!id) {
    return { returnCode: 400, returnMessage: "Journal entry ID is required" };
  }

  const existing = await prisma.journalEntry.findFirst({
    where: { id: BigInt(id), userId },
  });

  if (!existing) {
    return { returnCode: 404, returnMessage: "Journal entry not found" };
  }

  await prisma.journalEntry.delete({
    where: { id: BigInt(id) },
  });

  return { returnCode: 200, returnMessage: "Journal entry deleted successfully" };
};

export const getJournalEntry = async (data, userId) => {
  const { id } = data;
  if (!id) {
    return { returnCode: 400, returnMessage: "Journal entry ID is required" };
  }

  const journalEntry = await cache.getOrSet(
    'journal',
    `entry:${userId}:${id}`,
    () =>
      prisma.journalEntry.findFirst({
        where: {
          id: BigInt(id),
          OR: [
            { userId }, // Own entry
            { isPublished: true }, // Public entry from any user
          ],
        },
      }),
    60,
  );

  if (!journalEntry) {
    return { returnCode: 404, returnMessage: "Journal entry not found" };
  }

  return {
    returnCode: 200,
    returnMessage: "Journal entry fetched successfully",
    returnData: serializeBigInt(journalEntry),
  };
};

export const getAllJournalEntries = async (data, userId) => {
  const {
    search,
    category,
    bookName,
    isFavorite,
    isPublished,
    startDate,
    endDate,
    strongsId,
    source,
    page = 1,
    pageSize = 20,
  } = data;

  const pageNum = parseInt(page) || 1;
  const pageSizeNum = Math.min(parseInt(pageSize) || 20, 50);
  const offset = (pageNum - 1) * pageSizeNum;

  const whereClause = { userId };

  if (search) {
    whereClause.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
      { tags: { contains: search, mode: "insensitive" } },
    ];
  }

  if (category) whereClause.category = category;
  if (bookName) whereClause.bookName = bookName;
  if (isFavorite !== undefined) whereClause.isFavorite = isFavorite;
  if (isPublished !== undefined) whereClause.isPublished = isPublished;
  if (source) whereClause.source = source;
  if (strongsId) {
    whereClause.strongsIds = { contains: strongsId, mode: "insensitive" };
  }

  if (startDate || endDate) {
    whereClause.createdOn = {};
    if (startDate) whereClause.createdOn.gte = new Date(startDate);
    if (endDate) whereClause.createdOn.lte = new Date(endDate);
  }

  const [entries, totalCount] = await Promise.all([
    prisma.journalEntry.findMany({
      where: whereClause,
      skip: offset,
      take: pageSizeNum,
      orderBy: { createdOn: "desc" },
    }),
    prisma.journalEntry.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSizeNum);
  const hasNext = pageNum < totalPages;
  const hasPrevious = pageNum > 1;

  return {
    returnCode: 200,
    returnMessage: "Journal entries fetched successfully",
    returnData: serializeBigInt({
      entries,
      totalCount,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages,
      hasNext,
      hasPrevious,
    }),
  };
};

export const getJournalEntriesByVerse = async (data, userId) => {
  const { bookName, chapter, verseNumber } = data;

  if (!bookName || !chapter || !verseNumber) {
    return { returnCode: 400, returnMessage: "bookName, chapter, and verseNumber are required" };
  }

  const entries = await prisma.journalEntry.findMany({
    where: {
      userId,
      bookName,
      chapter: BigInt(chapter),
      verseNumber: BigInt(verseNumber),
    },
    orderBy: { createdOn: "desc" },
  });

  return {
    returnCode: 200,
    returnMessage: "Journal entries for verse fetched successfully",
    returnData: serializeBigInt(entries),
  };
};

export const toggleFavorite = async (data, userId) => {
  const { id } = data;
  if (!id) {
    return { returnCode: 400, returnMessage: "Journal entry ID is required" };
  }

  const existing = await prisma.journalEntry.findFirst({
    where: { id: BigInt(id), userId },
  });

  if (!existing) {
    return { returnCode: 404, returnMessage: "Journal entry not found" };
  }

  const journalEntry = await prisma.journalEntry.update({
    where: { id: BigInt(id) },
    data: { isFavorite: !existing.isFavorite },
  });

  return {
    returnCode: 200,
    returnMessage: journalEntry.isFavorite ? "Added to favorites" : "Removed from favorites",
    returnData: serializeBigInt(journalEntry),
  };
};

export const getJournalStats = async (userId) => {
  const stats = await cache.getOrSet(
    'journal',
    `stats:${userId}`,
    async () => {
      const [
        totalEntries,
        favoriteCount,
        categoryBreakdown,
        recentEntries,
        entriesThisMonth,
        entriesThisWeek,
      ] = await Promise.all([
        prisma.journalEntry.count({ where: { userId } }),
        prisma.journalEntry.count({ where: { userId, isFavorite: true } }),
        prisma.journalEntry.groupBy({
          by: ["category"],
          where: { userId },
          _count: { id: true },
        }),
        prisma.journalEntry.findMany({
          where: { userId },
          take: 5,
          orderBy: { createdOn: "desc" },
          select: {
            id: true,
            title: true,
            category: true,
            createdOn: true,
            bookName: true,
            chapter: true,
            verseNumber: true,
          },
        }),
        prisma.journalEntry.count({
          where: {
            userId,
            createdOn: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
        prisma.journalEntry.count({
          where: {
            userId,
            createdOn: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

      return {
        totalEntries,
        favoriteCount,
        categoryBreakdown: categoryBreakdown.map((c) => ({
          category: c.category,
          count: c._count.id,
        })),
        recentEntries,
        entriesThisMonth,
        entriesThisWeek,
      };
    },
    60,
  );

  return {
    returnCode: 200,
    returnMessage: "Journal stats fetched successfully",
    returnData: serializeBigInt(stats),
  };
};

export const createJournalPrompt = async (data, userId) => {
  const { prompt, category, description, order, isActive, bookName, chapter, verseNumber } = data;

  if (!prompt) {
    return { returnCode: 400, returnMessage: "Prompt is required" };
  }

  const journalPrompt = await prisma.journalPrompt.create({
    data: {
      prompt,
      category: category || "general",
      description,
      order: order || 0,
      isActive: isActive !== undefined ? isActive : true,
      bookName: bookName || null,
      chapter: chapter ? BigInt(chapter) : null,
      verseNumber: verseNumber ? BigInt(verseNumber) : null,
      createdBy: userId,
    },
  });

  return {
    returnCode: 200,
    returnMessage: "Journal prompt created successfully",
    returnData: serializeBigInt(journalPrompt),
  };
};

export const getJournalPrompts = async (data) => {
  const { category, isActive, bookName, chapter, ids } = data || {};

  const whereClause = {};
  if (category) whereClause.category = category;
  if (isActive !== undefined) whereClause.isActive = isActive;
  if (bookName) whereClause.bookName = bookName;
  if (chapter) whereClause.chapter = BigInt(chapter);
  if (ids && Array.isArray(ids) && ids.length > 0) {
    whereClause.id = { in: ids.map((id) => BigInt(id)) };
  }

  // Build a cache key from filters since prompts are shared across all users
  const filterKey = [category, isActive, bookName, chapter]
    .filter((v) => v !== undefined && v !== null)
    .join(':');

  const prompts = await cache.getOrSet(
    'journal',
    `prompts:${filterKey || 'all'}`,
    () =>
      prisma.journalPrompt.findMany({
        where: whereClause,
        orderBy: [{ order: "asc" }, { createdOn: "desc" }],
      }),
    300,
  );

  return {
    returnCode: 200,
    returnMessage: "Journal prompts fetched successfully",
    returnData: serializeBigInt(prompts),
  };
};

export const updateJournalPrompt = async (data, userId) => {
  const { id, prompt, category, description, order, isActive, bookName, chapter, verseNumber } = data;

  if (!id) {
    return { returnCode: 400, returnMessage: "Prompt ID is required" };
  }

  const existing = await prisma.journalPrompt.findFirst({
    where: { id: BigInt(id) },
  });

  if (!existing) {
    return { returnCode: 404, returnMessage: "Journal prompt not found" };
  }

  const updateData = {};
  if (prompt !== undefined) updateData.prompt = prompt;
  if (category !== undefined) updateData.category = category;
  if (description !== undefined) updateData.description = description;
  if (order !== undefined) updateData.order = order;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (bookName !== undefined) updateData.bookName = bookName || null;
  if (chapter !== undefined) updateData.chapter = chapter ? BigInt(chapter) : null;
  if (verseNumber !== undefined) updateData.verseNumber = verseNumber ? BigInt(verseNumber) : null;

  const journalPrompt = await prisma.journalPrompt.update({
    where: { id: BigInt(id) },
    data: updateData,
  });

  return {
    returnCode: 200,
    returnMessage: "Journal prompt updated successfully",
    returnData: serializeBigInt(journalPrompt),
  };
};

export const deleteJournalPrompt = async (data) => {
  const { id } = data;
  if (!id) {
    return { returnCode: 400, returnMessage: "Prompt ID is required" };
  }

  await prisma.journalPrompt.delete({
    where: { id: BigInt(id) },
  });

  return { returnCode: 200, returnMessage: "Journal prompt deleted successfully" };
};

export const createJournalTemplate = async (data, userId) => {
  const { name, description, category, prompts, isDefault } = data;

  if (!name || !prompts || !Array.isArray(prompts)) {
    return { returnCode: 400, returnMessage: "Name and prompts array are required" };
  }

  if (isDefault) {
    await prisma.journalTemplate.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });
  }

  const template = await prisma.journalTemplate.create({
    data: {
      name,
      description,
      category: category || "general",
      promptsJson: JSON.stringify(prompts),
      isActive: true,
      isDefault: isDefault || false,
      createdBy: userId,
    },
  });

  return {
    returnCode: 200,
    returnMessage: "Journal template created successfully",
    returnData: serializeBigInt(template),
  };
};

export const getJournalTemplates = async (data) => {
  const { category, isActive } = data || {};

  const whereClause = {};
  if (category) whereClause.category = category;
  if (isActive !== undefined) whereClause.isActive = isActive;

  // Build a cache key from filters since templates are shared across all users
  const filterKey = [category, isActive]
    .filter((v) => v !== undefined && v !== null)
    .join(':');

  const templates = await cache.getOrSet(
    'journal',
    `templates:${filterKey || 'all'}`,
    () =>
      prisma.journalTemplate.findMany({
        where: whereClause,
        orderBy: { createdOn: "desc" },
      }),
    300,
  );

  const parsed = templates.map((t) => ({
    ...t,
    prompts: t.promptsJson ? JSON.parse(t.promptsJson) : [],
  }));

  return {
    returnCode: 200,
    returnMessage: "Journal templates fetched successfully",
    returnData: serializeBigInt(parsed),
  };
};

export const deleteJournalTemplate = async (data) => {
  const { id } = data;
  if (!id) {
    return { returnCode: 400, returnMessage: "Template ID is required" };
  }

  await prisma.journalTemplate.delete({
    where: { id: BigInt(id) },
  });

  return { returnCode: 200, returnMessage: "Journal template deleted successfully" };
};

export const getUserJournalEntriesForAdmin = async (data, adminId) => {
  const { userId, search, category, page = 1, pageSize = 20 } = data;

  const pageNum = parseInt(page) || 1;
  const pageSizeNum = Math.min(parseInt(pageSize) || 20, 50);
  const offset = (pageNum - 1) * pageSizeNum;

  const whereClause = {};
  if (userId) whereClause.userId = userId;
  if (search) {
    whereClause.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
    ];
  }
  if (category) whereClause.category = category;

  const [entries, totalCount] = await Promise.all([
    prisma.journalEntry.findMany({
      where: whereClause,
      skip: offset,
      take: pageSizeNum,
      orderBy: { createdOn: "desc" },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            email: true,
          },
        },
      },
    }),
    prisma.journalEntry.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSizeNum);
  const hasNext = pageNum < totalPages;
  const hasPrevious = pageNum > 1;

  return {
    returnCode: 200,
    returnMessage: "User journal entries fetched successfully",
    returnData: serializeBigInt({
      entries,
      totalCount,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages,
      hasNext,
      hasPrevious,
    }),
  };
};

export const setJournalEntryPublicationForAdmin = async (data, adminId) => {
  const { id, isPublished } = data;
  if (!id || typeof isPublished !== "boolean") {
    return { returnCode: 400, returnMessage: "id and isPublished are required" };
  }

  const existing = await prisma.journalEntry.findUnique({
    where: { id: BigInt(id) },
  });

  if (!existing) {
    return { returnCode: 404, returnMessage: "Journal entry not found" };
  }

  const entry = await prisma.journalEntry.update({
    where: { id: BigInt(id) },
    data: {
      isPublished,
      updatedBy: adminId,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          email: true,
        },
      },
    },
  });

  return {
    returnCode: 200,
    returnMessage: isPublished ? "Journal entry approved" : "Journal entry unpublished",
    returnData: serializeBigInt(entry),
  };
};

// ── Verse text helper ────────────────────────────────────────────────────────

const VERSE_TRANSLATION_DISPLAY = {
  Berean: 'Berean Standard Bible',
  BSB: 'Berean Standard Bible',
  KJV: 'King James Version',
  NIV: 'New International Version',
  ESV: 'English Standard Version',
  NASB: 'New American Standard Bible',
  NKJV: 'New King James Version',
  NLT: 'New Living Translation',
  CSB: 'Christian Standard Bible',
  WEB: 'World English Bible',
};

async function getVerseTextWithTranslation(bookName, chapter, verseNumber) {
  try {
    const result = await prisma.searchIndex.findFirst({
      where: {
        bookName,
        chapter: Number(chapter),
        verse: Number(verseNumber),
      },
      orderBy: { id: 'asc' },
      select: { verseText: true, translation: true },
    });
    if (!result) return null;
    const displayName = VERSE_TRANSLATION_DISPLAY[result.translation] || result.translation;
    return { text: result.verseText, translation: result.translation, translationName: displayName };
  } catch {
    return null;
  }
}

// ── Export Functions ─────────────────────────────────────────────────────────

export const exportAllEntries = async (userId, format, ids) => {
  const whereClause = { userId };
  if (ids && Array.isArray(ids) && ids.length > 0) {
    whereClause.id = { in: ids.map((id) => BigInt(id)) };
  }
  const entries = await prisma.journalEntry.findMany({
    where: whereClause,
    orderBy: { createdOn: "desc" },
  });

  const serialized = serializeBigInt(entries);

  if (format === 'json') {
    const jsonContent = JSON.stringify(serialized, null, 2);
    const base64 = Buffer.from(jsonContent).toString('base64');
    return {
      returnCode: 200,
      returnData: {
        content: base64,
        filename: `legacy-ledger-${new Date().toISOString().split('T')[0]}.json`,
        mimeType: 'application/json',
        entryCount: serialized.length,
      },
    };
  }

  if (format === 'pdf') {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on('data', chunk => buffers.push(chunk));

    doc.fontSize(28).font('Helvetica-Bold').text('Legacy Ledger', { align: 'center' });
    doc.fontSize(14).font('Helvetica').fillColor('#666666').text('Exegesis — Personal Study Archive', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor('#999999').text(`Generated: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(12).fillColor('#999999').text(`Total Entries: ${serialized.length}`, { align: 'center' });
    doc.moveDown(1.5);

    const lineY = doc.y;
    doc.moveTo(50, lineY).lineTo(545, lineY).strokeColor('#CCCCCC').stroke();
    doc.moveDown(1);

    // Batch-load verse texts for all entries
    const verseLookups = serialized
      .filter(e => e.bookName && e.chapter && e.verseNumber)
      .map(e => ({ bookName: e.bookName, chapter: Number(e.chapter), verse: Number(e.verseNumber), key: `${e.bookName}|${e.chapter}|${e.verseNumber}` }));
    const uniqueLookups = [];
    const seen = new Set();
    for (const v of verseLookups) {
      if (!seen.has(v.key)) { seen.add(v.key); uniqueLookups.push(v); }
    }
    const verseResults = await Promise.all(
      uniqueLookups.map(v => getVerseTextWithTranslation(v.bookName, v.chapter, v.verse))
    );
    const verseMap = {};
    uniqueLookups.forEach((v, i) => { verseMap[v.key] = verseResults[i]; });

    serialized.forEach((entry, idx) => {
      const entryNum = idx + 1;
      const catColor = entry.category === 'study' ? '#3B82F6' : entry.category === 'prayer' ? '#8B5CF6' : entry.category === 'gratitude' ? '#F59E0B' : entry.category === 'reflection' ? '#10B981' : entry.category === 'application' ? '#EF4444' : '#6B7280';

      if (doc.y > 620) doc.addPage();

      doc.fontSize(18).font('Helvetica-Bold').fillColor('#333333').text(`Entry #${entryNum}`, { continued: false });
      doc.moveDown(0.2);

      const dateStr = new Date(entry.createdOn).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' });
      doc.fontSize(12).font('Helvetica').fillColor('#888888').text(dateStr);
      doc.moveDown(0.1);

      if (entry.mood) {
        const moodLabel = entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1);
        doc.fontSize(12).font('Helvetica').fillColor('#8B5CF6').text(`Mood: ${moodLabel}`);
        doc.moveDown(0.05);
      }

      if (entry.bookName) {
        const ref = `${entry.bookName} ${entry.chapter || ''}${entry.verseNumber ? ':' + entry.verseNumber : ''}`;
        doc.fontSize(12).font('Helvetica-Oblique').fillColor('#555555').text(`Scripture: ${ref}`);
        doc.moveDown(0.1);
      }

      // ── Verse text with translation ──
      const vKey = entry.bookName && entry.chapter && entry.verseNumber ? `${entry.bookName}|${entry.chapter}|${entry.verseNumber}` : null;
      const vInfo = vKey ? verseMap[vKey] : null;
      if (vInfo) {
        doc.fontSize(12).font('Helvetica-Oblique').fillColor('#666666')
          .text(`\u201C${vInfo.text}\u201D`, { lineGap: 4, align: 'justify' });
        doc.fontSize(12).font('Helvetica').fillColor('#999999')
          .text(`\u2014 ${entry.bookName} ${entry.chapter}:${entry.verseNumber} (${vInfo.translationName})`);
        doc.moveDown(0.15);
      }

      doc.fontSize(12).font('Helvetica').fillColor(catColor).text(`Category: ${entry.category.charAt(0).toUpperCase() + entry.category.slice(1)}  |  Source: ${entry.source === 'exegesis-lab' ? 'Exegesis Lab' : 'Manual'}  |  Privacy: ${entry.isPublished ? 'Public' : 'Private'}`);
      doc.moveDown(0.1);

      if (entry.title) {
        doc.moveDown(0.1);
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#333333').text(entry.title);
        doc.moveDown(0.15);
      }

      if (entry.content) {
        doc.fontSize(12).font('Helvetica').fillColor('#444444').text(entry.content, { align: 'left', lineGap: 6 });
        doc.moveDown(0.3);
      }

      if (entry.gratitude) {
        if (doc.y > 620) doc.addPage();
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#333333').text('Gratitude');
        doc.fontSize(12).font('Helvetica').fillColor('#555555').text(entry.gratitude, { lineGap: 5 });
        doc.moveDown(0.25);
      }

      if (entry.learnings) {
        if (doc.y > 620) doc.addPage();
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#333333').text('Learnings');
        doc.fontSize(12).font('Helvetica').fillColor('#555555').text(entry.learnings, { lineGap: 5 });
        doc.moveDown(0.25);
      }

      if (entry.prayers) {
        if (doc.y > 620) doc.addPage();
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#333333').text('Prayer');
        doc.fontSize(12).font('Helvetica').fillColor('#555555').text(entry.prayers, { lineGap: 5 });
        doc.moveDown(0.25);
      }

      if (entry.application) {
        if (doc.y > 620) doc.addPage();
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#333333').text('Application');
        doc.fontSize(12).font('Helvetica').fillColor('#555555').text(entry.application, { lineGap: 5 });
        doc.moveDown(0.25);
      }

      if (entry.strongsWords) {
        try {
          const words = typeof entry.strongsWords === 'string' ? JSON.parse(entry.strongsWords) : entry.strongsWords;
          if (Array.isArray(words) && words.length > 0) {
            doc.fontSize(12).font('Helvetica-Bold').fillColor('#333333').text("Strong's Words Studied:");
            doc.moveDown(0.15);
            words.forEach(w => {
              doc.fontSize(12).font('Helvetica').fillColor('#555555').text(`  \u2022 ${w.surfaceText || w.strongsId} (${w.strongsId})${w.lemma ? ` \u2014 ${w.lemma}` : ''}`);
            });
            doc.moveDown(0.25);
          }
        } catch (e) {}
      }

      if (entry.tags) {
        const tags = entry.tags.split(',').map(t => t.trim()).filter(Boolean);
        const label = tags.map(t => `#${t}`).join('  ');
        doc.fontSize(12).font('Helvetica').fillColor('#888888').text(label);
        doc.moveDown(0.25);
      }

      if (idx < serialized.length - 1) {
        const sepY = doc.y;
        doc.moveTo(80, sepY).lineTo(520, sepY).strokeColor('#E0E0E0').stroke();
        doc.moveDown(1);
      }
    });

    return new Promise((resolve) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        const base64 = pdfBuffer.toString('base64');
        resolve({
          returnCode: 200,
          returnData: {
            content: base64,
            filename: `legacy-ledger-${new Date().toISOString().split('T')[0]}.pdf`,
            mimeType: 'application/pdf',
            entryCount: serialized.length,
          },
        });
      });
      doc.end();
    });
  }

  // Default: txt format
  const lines = [];
  lines.push('╔══════════════════════════════════╗');
  lines.push('       EXEGESIS PROJECT LEGACY LEDGER');
  lines.push('╚══════════════════════════════════╛');
  lines.push('               EXPORT');
  lines.push('');
  lines.push(`Generated: ${new Date().toLocaleDateString()}`);
  lines.push(`Total Entries: ${serialized.length}`);
  lines.push('');

  serialized.forEach((entry, idx) => {
    lines.push('────────────────────────────────────────────────────────────────────────────────┛');
    lines.push(`Entry #${idx + 1}`);
    lines.push('───────');
    lines.push(`Date: ${new Date(entry.createdOn).toLocaleDateString()}`);
    if (entry.mood) {
      lines.push(`Mood: ${entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}`);
    }
    if (entry.bookName) {
      lines.push(`Passage: ${entry.bookName} ${entry.chapter || ''}${entry.verseNumber ? ':' + entry.verseNumber : ''}`);
    }
    lines.push(`Source: ${entry.source || 'manual'}`);
    lines.push(`Category: ${entry.category}`);
    lines.push(`Privacy: ${entry.isPublished ? 'Public' : 'Private'}`);
    lines.push('');
    if (entry.title) lines.push(`Title: ${entry.title}`);
    lines.push('');
    if (entry.content) lines.push(entry.content);
    lines.push('');
    if (entry.gratitude) {
      lines.push('Gratitude:');
      lines.push(entry.gratitude);
      lines.push('');
    }
    if (entry.learnings) {
      lines.push('Learnings:');
      lines.push(entry.learnings);
      lines.push('');
    }
    if (entry.prayers) {
      lines.push('Prayer:');
      lines.push(entry.prayers);
      lines.push('');
    }
    if (entry.application) {
      lines.push('Application:');
      lines.push(entry.application);
      lines.push('');
    }
    if (entry.strongsWords) {
      lines.push('Studied Strong\'s Words:');
      try {
        const words = typeof entry.strongsWords === 'string' ? JSON.parse(entry.strongsWords) : entry.strongsWords;
        if (Array.isArray(words)) {
          words.forEach(w => {
            lines.push(`  \u2022 ${w.surfaceText || w.strongsId} (${w.strongsId})${w.lemma ? ` - ${w.lemma}` : ''}`);
          });
        }
      } catch (e) {}
      lines.push('');
    }
    if (entry.tags) {
      lines.push(`Tags: ${entry.tags}`);
      lines.push('');
    }
  });

  const textContent = lines.join('\n');
  const base64 = Buffer.from(textContent).toString('base64');
  return {
    returnCode: 200,
    returnData: {
      content: base64,
      filename: `legacy-ledger-${new Date().toISOString().split('T')[0]}.txt`,
      mimeType: 'text/plain',
      entryCount: serialized.length,
    },
  };
};

export const exportOneEntry = async (id, userId, format) => {
  if (!id) {
    return { returnCode: 400, returnMessage: "Journal entry ID is required" };
  }

  const entry = await prisma.journalEntry.findFirst({
    where: {
      id: BigInt(id),
      OR: [
        { userId },
        { isPublished: true },
      ],
    },
  });

  if (!entry) {
    return { returnCode: 404, returnMessage: "Journal entry not found" };
  }

  const serialized = serializeBigInt(entry);

  if (format === 'json') {
    const base64 = Buffer.from(JSON.stringify(serialized, null, 2)).toString('base64');
    const slug = (entry.bookName || 'entry').toLowerCase().replace(/\s+/g, '-');
    return {
      returnCode: 200,
      returnData: {
        content: base64,
        filename: `${slug}-${new Date(entry.createdOn).toISOString().split('T')[0]}.json`,
        mimeType: 'application/json',
      },
    };
  }

  if (format === 'pdf') {
    const verseInfo = entry.bookName && entry.chapter && entry.verseNumber
      ? await getVerseTextWithTranslation(entry.bookName, entry.chapter, entry.verseNumber)
      : null;

    const doc = new PDFDocument({ margin: 50, info: { Title: 'Exegesis Project Legacy Ledger', Author: 'Exegesis Bible App' } });
    const buffers = [];
    doc.on('data', chunk => buffers.push(chunk));

    const catColor = entry.category === 'study' ? '#3B82F6' : entry.category === 'prayer' ? '#8B5CF6' : entry.category === 'gratitude' ? '#F59E0B' : entry.category === 'reflection' ? '#10B981' : entry.category === 'application' ? '#EF4444' : '#6B7280';

    const bottomY = () => doc.page.height - 40;
    const marginX = 50;
    const marginRight = 50;
    const contentWidth = doc.page.width - marginX - marginRight;

    // Helper: section divider
    const sectionDivider = () => {
      doc.moveTo(marginX, doc.y).lineTo(doc.page.width - marginRight, doc.y).strokeColor('#E5E7EB').stroke();
    };

    // Helper: section header with accent bar
    const sectionHeader = ({ label, color }) => {
      doc.moveDown(0.6);
      if (doc.y > bottomY() - 50) doc.addPage();
      doc.roundedRect(marginX, doc.y + 2, 3, 18, 1.5).fillColor(color).fill();
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1F2937').text(label, marginX + 12, doc.y - 2);
      doc.moveDown(0.4);
    };

    // Helper: body text
    const bodyText = (text) => {
      doc.fontSize(12).font('Helvetica').fillColor('#374151').text(text, { lineGap: 7, align: 'justify', paragraphGap: 5 });
    };

    // Write footer on the current page before a page transition
    const writeFooter = () => {
      const fy = doc.page.maxY() - doc.currentLineHeight(true);
      if (doc.y > doc.page.margins.top + 30 && doc.y < fy) {
        doc.save();
        doc.fontSize(12).font('Helvetica').fillColor('#9CA3AF');
        doc.text('Generated by Exegesis Project Bible App', marginX, fy, { align: 'center', width: contentWidth, lineBreak: false });
        doc.restore();
      }
    };
    const origAddPage = doc.addPage.bind(doc);
    doc.addPage = (...args) => { writeFooter(); return origAddPage(...args); };

    // Helper: add a page (monkey-patched above will write footer automatically)

    const headerY = 35;

    // ── Header with logo ──
    try {
      doc.image(LOGO_PATH, marginX, headerY, { width: 48 });
    } catch (e) {}
    doc.x = marginX + 65;

    doc.fontSize(26).font('Helvetica-Bold').fillColor('#1F2937').text('Exegesis Project Legacy Ledger');
    doc.moveDown(0.1);
    doc.fontSize(12).font('Helvetica').fillColor('#9CA3AF').text('Personal Journal');
    doc.moveDown(0.5);
    sectionDivider();
    doc.moveDown(0.6);

    // ── Title ──
    if (entry.title) {
      doc.fontSize(18).font('Helvetica-Bold').fillColor('#1F2937').text(entry.title);
      doc.moveDown(0.3);
    }

    // ── Metadata chips ──
    const dateStr = new Date(entry.createdOn).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' });
    doc.fontSize(12).font('Helvetica').fillColor('#6B7280').text(dateStr);
    if (entry.mood) {
      const moodLabel = entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1);
      doc.fontSize(12).font('Helvetica').fillColor('#8B5CF6').text(`\u{1F3F7}  ${moodLabel}`);
    }
    if (entry.bookName) {
      const ref = `${entry.bookName} ${entry.chapter || ''}${entry.verseNumber ? ':' + entry.verseNumber : ''}`;
      doc.fontSize(12).font('Helvetica-Oblique').fillColor(catColor).text(ref);
    }

    const catLabel = entry.category ? entry.category.charAt(0).toUpperCase() + entry.category.slice(1) : 'General';
    const sourceLabel = entry.source === 'exegesis-lab' ? 'Exegesis Lab' : 'Manual';
    const privacyLabel = entry.isPublished ? 'Public' : 'Private';
    const privacyColor = entry.isPublished ? '#10B981' : '#EF4444';

    doc.moveDown(0.2);
    doc.fontSize(12).font('Helvetica').fillColor('#6B7280');
    doc.text(catLabel, { continued: true });
    doc.fillColor('#9CA3AF').text(`  |  ${sourceLabel}  |  `, { continued: true });
    doc.fillColor(privacyColor).text(privacyLabel);
    doc.moveDown(0.6);

    // ── Scripture Quote ──
    if (verseInfo) {
      sectionHeader({ label: 'Scripture', color: '#3B82F6' });
      doc.fontSize(12).font('Helvetica-Oblique').fillColor('#4B5563')
        .text(`\u201C${verseInfo.text}\u201D`, { lineGap: 8, align: 'justify' });
      doc.moveDown(0.15);
      doc.fontSize(12).font('Helvetica').fillColor('#9CA3AF')
        .text(`\u2014 ${entry.bookName} ${entry.chapter}:${entry.verseNumber} (${verseInfo.translationName})`);
      doc.moveDown(0.4);
    }

    // ── Journal Entry content ──
    if (entry.content) {
      sectionHeader({ label: 'Journal', color: catColor });
      bodyText(entry.content);
      doc.moveDown(0.3);
    }

    // ── Gratitude ──
    if (entry.gratitude) {
      sectionHeader({ label: 'Gratitude', color: '#F59E0B' });
      bodyText(entry.gratitude);
      doc.moveDown(0.2);
    }

    // ── Learnings ──
    if (entry.learnings) {
      sectionHeader({ label: 'Learnings', color: '#3B82F6' });
      bodyText(entry.learnings);
      doc.moveDown(0.2);
    }

    // ── Application ──
    if (entry.application) {
      sectionHeader({ label: 'Application', color: '#10B981' });
      bodyText(entry.application);
      doc.moveDown(0.2);
    }

    // ── Prayer Requests ──
    if (entry.prayers) {
      sectionHeader({ label: 'Prayer Requests', color: '#8B5CF6' });
      bodyText(entry.prayers);
      doc.moveDown(0.2);
    }

    // ── Strong's Words ──
    if (entry.strongsWords) {
      try {
        const words = typeof entry.strongsWords === 'string' ? JSON.parse(entry.strongsWords) : entry.strongsWords;
        if (Array.isArray(words) && words.length > 0) {
          sectionHeader({ label: "Strong\u2019s Words Studied", color: '#6B7280' });
          words.forEach(w => {
            const label = `${w.surfaceText || w.strongsId || ''}`;
            const id = w.strongsId ? ` (${w.strongsId})` : '';
            const lemma = w.lemma ? ` \u2014 ${w.lemma}` : '';
            doc.fontSize(12).font('Helvetica').fillColor('#4B5563').text(`  \u2022 ${label}${id}${lemma}`);
          });
          doc.moveDown(0.1);
        }
      } catch (e) {}
    }

    // ── Tags ──
    if (entry.tags) {
      sectionHeader({ label: 'Tags', color: '#6B7280' });
      const tags = entry.tags.split(',').map(t => t.trim()).filter(Boolean);
      const tagFontSize = 12;
      const tagPaddingX = 7;
      const tagPaddingY = 4;
      const tagGap = 5;
      const tagColor = '#6B7280';
      const tagBg = '#F3F4F6';
      let x = marginX;
      const startY = doc.y;
      doc.y = startY;
      tags.forEach((tag) => {
        const label = `#${tag}`;
        const textWidth = doc.widthOfString(label, { fontSize: tagFontSize, font: 'Helvetica' });
        const chipWidth = textWidth + tagPaddingX * 2;
        const chipHeight = tagFontSize + tagPaddingY * 2 + 2;
        if (x + chipWidth > doc.page.width - marginRight && x > marginX) {
          x = marginX;
          doc.y += chipHeight + tagGap;
          if (doc.y > bottomY() - 20) doc.addPage();
        }
        doc.roundedRect(x, doc.y, chipWidth, chipHeight, 4).fillColor(tagBg).fill();
        doc.fontSize(tagFontSize).font('Helvetica-Bold').fillColor(tagColor)
          .text(label, x + tagPaddingX, doc.y + tagPaddingY, { lineBreak: false });
        x += chipWidth + tagGap;
      });
      doc.moveDown(1.2);
    }

    // ── Final divider ──
    doc.moveDown(1);
    writeFooter();
    sectionDivider();

    const slug = (entry.bookName || 'entry').toLowerCase().replace(/\s+/g, '-');
    return new Promise((resolve) => {
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve({
          returnCode: 200,
          returnData: {
            content: pdfBuffer.toString('base64'),
            filename: `${slug}-${new Date(entry.createdOn).toISOString().split('T')[0]}.pdf`,
            mimeType: 'application/pdf',
          },
        });
      });
      doc.end();
    });
  }

  // Default: txt format
  const lines = [];
  lines.push('╔═══ EXEGESIS PROJECT LEGACY LEDGER ═══╗');
  lines.push('');
  lines.push(`Date: ${new Date(entry.createdOn).toLocaleDateString()}`);
  if (entry.mood) {
    lines.push(`Mood: ${entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}`);
  }
  if (entry.bookName) {
    lines.push(`Passage: ${entry.bookName} ${entry.chapter || ''}${entry.verseNumber ? ':' + entry.verseNumber : ''}`);
  }
  lines.push(`Source: ${entry.source || 'manual'}`);
  lines.push(`Category: ${entry.category}`);
  lines.push(`Privacy: ${entry.isPublished ? 'Public' : 'Private'}`);
  lines.push('');
  if (entry.title) lines.push(`Title: ${entry.title}`);
  lines.push('');
  if (entry.content) lines.push(entry.content);
  lines.push('');
  if (entry.gratitude) {
    lines.push('Gratitude:');
    lines.push(entry.gratitude);
    lines.push('');
  }
  if (entry.learnings) {
    lines.push('Learnings:');
    lines.push(entry.learnings);
    lines.push('');
  }
  if (entry.prayers) {
    lines.push('Prayer:');
    lines.push(entry.prayers);
    lines.push('');
  }
  if (entry.application) {
    lines.push('Application:');
    lines.push(entry.application);
    lines.push('');
  }
  if (entry.strongsWords) {
    lines.push('Studied Strong\'s Words:');
    try {
      const words = typeof entry.strongsWords === 'string' ? JSON.parse(entry.strongsWords) : entry.strongsWords;
      if (Array.isArray(words)) {
        words.forEach(w => {
          lines.push(`  \u2022 ${w.surfaceText || w.strongsId} (${w.strongsId})${w.lemma ? ` - ${w.lemma}` : ''}`);
        });
      }
    } catch (e) {}
    lines.push('');
  }
  if (entry.tags) {
    lines.push(`Tags: ${entry.tags}`);
    lines.push('');
  }
  lines.push('\u2014 Saved from Exegesis Project Legacy Ledger \u2014');

  const base64 = Buffer.from(lines.join('\n')).toString('base64');
  const slug = (entry.bookName || 'entry').toLowerCase().replace(/\s+/g, '-');
  return {
    returnCode: 200,
    returnData: {
      content: base64,
      filename: `${slug}-${new Date(entry.createdOn).toISOString().split('T')[0]}.txt`,
      mimeType: 'text/plain',
    },
  };
};

export const toggleJournalLike = async (data, userId) => {
  const { entryId } = data;

  if (!entryId) {
    return { returnCode: 400, returnMessage: "Journal entry ID is required" };
  }

  const entry = await prisma.journalEntry.findUnique({
    where: { id: BigInt(entryId) },
    select: { id: true, isPublished: true },
  });

  if (!entry) {
    return { returnCode: 404, returnMessage: "Journal entry not found" };
  }

  if (!entry.isPublished) {
    return { returnCode: 400, returnMessage: "Cannot like a private entry" };
  }

  const existing = await prisma.journalLike.findUnique({
    where: { entryId_userId: { entryId: BigInt(entryId), userId } },
  });

  if (existing) {
    await prisma.journalLike.delete({
      where: { id: existing.id },
    });
  } else {
    await prisma.journalLike.create({
      data: { entryId: BigInt(entryId), userId },
    });
  }

  const likeCount = await prisma.journalLike.count({
    where: { entryId: BigInt(entryId) },
  });

  return {
    returnCode: 200,
    returnMessage: existing ? "Like removed" : "Like added",
    returnData: { liked: !existing, likeCount },
  };
};

export const getPublicEntries = async (data, userId) => {
  const {
    search,
    bookName,
    category,
    startDate,
    endDate,
    page = 1,
    pageSize = 20,
  } = data;

  const pageNum = parseInt(page) || 1;
  const pageSizeNum = Math.min(parseInt(pageSize) || 20, 50);
  const offset = (pageNum - 1) * pageSizeNum;

  const whereClause = {
    isPublished: true,
  };

  if (search) {
    whereClause.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
      { tags: { contains: search, mode: "insensitive" } },
    ];
  }

  if (bookName) whereClause.bookName = bookName;
  if (category) whereClause.category = category;

  if (startDate || endDate) {
    whereClause.createdOn = {};
    if (startDate) whereClause.createdOn.gte = new Date(startDate);
    if (endDate) whereClause.createdOn.lte = new Date(endDate);
  }

  const [entries, totalCount] = await Promise.all([
    prisma.journalEntry.findMany({
      where: whereClause,
      skip: offset,
      take: pageSizeNum,
      orderBy: { createdOn: "desc" },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        _count: {
          select: { likes: true },
        },
        likes: {
          where: { userId },
          select: { id: true },
          take: 1,
        },
      },
    }),
    prisma.journalEntry.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSizeNum);
  const hasNext = pageNum < totalPages;

  // Attach liked and likeCount to each entry
  const enriched = entries.map((e) => ({
    ...e,
    liked: e.likes.length > 0,
    likeCount: e._count.likes,
    _count: undefined,
    likes: undefined,
  }));

  return {
    returnCode: 200,
    returnMessage: "Public entries fetched successfully",
    returnData: serializeBigInt({
      entries: enriched,
      totalCount,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages,
      hasNext,
    }),
  };
};

export const searchEntriesByStrongs = async (data, userId) => {
  const { strongsId, page = 1, pageSize = 20 } = data;

  if (!strongsId) {
    return { returnCode: 400, returnMessage: "strongsId is required" };
  }

  const pageNum = parseInt(page) || 1;
  const pageSizeNum = Math.min(parseInt(pageSize) || 20, 50);
  const offset = (pageNum - 1) * pageSizeNum;

  const whereClause = {
    userId,
    strongsIds: { contains: strongsId, mode: "insensitive" },
  };

  const [entries, totalCount] = await Promise.all([
    prisma.journalEntry.findMany({
      where: whereClause,
      skip: offset,
      take: pageSizeNum,
      orderBy: { createdOn: "desc" },
    }),
    prisma.journalEntry.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSizeNum);
  const hasNext = pageNum < totalPages;

  return {
    returnCode: 200,
    returnData: serializeBigInt({
      entries,
      totalCount,
      page: pageNum,
      pageSize: pageSizeNum,
      hasNext,
    }),
  };
};
