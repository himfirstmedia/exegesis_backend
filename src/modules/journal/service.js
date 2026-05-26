import { serializeBigInt } from "../../utils/helpers.js";
import { prisma } from "../../config/db.js";
import { cache } from "../../services/cacheService.js";


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
        where: { id: BigInt(id), userId },
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
  const { category, isActive, bookName, chapter } = data || {};

  const whereClause = {};
  if (category) whereClause.category = category;
  if (isActive !== undefined) whereClause.isActive = isActive;
  if (bookName) whereClause.bookName = bookName;
  if (chapter) whereClause.chapter = BigInt(chapter);

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