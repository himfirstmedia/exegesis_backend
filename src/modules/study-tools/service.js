import { prisma } from '../../config/db.js';
import { serializeBigInt } from '../../utils/helpers.js';

const TOOL_TYPES = ['COMMAND', 'PROMISE', 'WARNING', 'REPEATED_WORD', 'TRANSITION', 'CONTRAST'];

export const getChapterTools = async (body) => {
  const { bookName, chapter } = body || {};

  if (!bookName || !chapter) {
    return { status: 400, message: 'bookName and chapter are required' };
  }

  const tools = await prisma.chapterStudyTool.findMany({
    where: { bookName, chapter: BigInt(chapter) },
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
              adminExplanation: true,
              language: true,
            },
          },
        },
      },
    },
  });

  const grouped = {};
  for (const tool of tools) {
    const type = tool.toolType;
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(serializeBigInt(tool));
  }

  return {
    status: 200,
    message: 'Chapter study tools',
    data: grouped,
  };
};

export const upsertChapterTools = async (userId, body) => {
  const { bookName, chapter, items } = body || {};

  if (!bookName || !chapter || !items || !Array.isArray(items)) {
    return { status: 400, message: 'bookName, chapter, and items array are required' };
  }

  // Delete existing tools for this chapter (cascades to study_tool_words)
  await prisma.chapterStudyTool.deleteMany({
    where: { bookName, chapter: BigInt(chapter) },
  });

  // Create new tools
  const created = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.toolType || !item.label || !item.verseRefs) continue;
    if (!TOOL_TYPES.includes(item.toolType)) continue;

    const tool = await prisma.chapterStudyTool.create({
      data: {
        bookName,
        chapter: BigInt(chapter),
        toolType: item.toolType,
        label: item.label,
        description: item.description || null,
        verseRefs: item.verseRefs,
        strongsIds: item.strongsIds || null,
        order: item.order ?? i,
        studyToolWords: item.studyToolWords?.length
          ? {
              create: item.studyToolWords.map((w, idx) => ({
                strongsId: w.strongsId,
                bookName: w.bookName || bookName,
                chapter: BigInt(w.chapter || chapter),
                verse: BigInt(w.verse || 1),
                surfaceText: w.surfaceText || '',
                originalWord: w.originalWord || null,
                transliteration: w.transliteration || null,
                adminExplanation: w.adminExplanation || null,
                wordOrder: w.wordOrder ?? idx,
              })),
            }
          : undefined,
      },
      include: {
        studyToolWords: true,
      },
    });
    created.push(serializeBigInt(tool));
  }

  return {
    status: 200,
    message: `Saved ${created.length} study tools`,
    data: created,
  };
};

export const getAllTools = async (body) => {
  const page = body?.page || 0;
  const pageSize = body?.pageSize || 50;
  const { bookName, chapter, toolType, search } = body || {};

  const where = {};
  if (bookName) where.bookName = bookName;
  if (chapter) where.chapter = BigInt(chapter);
  if (toolType) where.toolType = toolType;
  if (search) {
    where.OR = [
      { label: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.chapterStudyTool.findMany({
      where,
      orderBy: [{ bookName: 'asc' }, { chapter: 'asc' }, { toolType: 'asc' }, { order: 'asc' }],
      skip: page * pageSize,
      take: pageSize,
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
                adminExplanation: true,
                language: true,
              },
            },
          },
        },
      },
    }),
    prisma.chapterStudyTool.count({ where }),
  ]);

  return {
    status: 200,
    message: 'Study tools fetched',
    data: {
      data: data.map(d => serializeBigInt(d)),
      total,
      hasNext: (page + 1) * pageSize < total,
    },
  };
};

export const deleteTool = async (id) => {
  const existing = await prisma.chapterStudyTool.findUnique({ where: { id: BigInt(id) } });
  if (!existing) {
    return { status: 404, message: 'Study tool not found' };
  }

  await prisma.chapterStudyTool.delete({ where: { id: BigInt(id) } });
  return { status: 200, message: 'Study tool deleted' };
};

// ── Single study tool CRUD (for individual add/edit) ────────────────────────

export const getSingleTool = async (id) => {
  const tool = await prisma.chapterStudyTool.findUnique({
    where: { id: BigInt(id) },
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
              adminExplanation: true,
              language: true,
            },
          },
        },
      },
    },
  });
  if (!tool) return { status: 404, message: 'Study tool not found' };
  return { status: 200, message: 'Study tool fetched', data: serializeBigInt(tool) };
};

export const createSingleTool = async (userId, body) => {
  const { bookName, chapter, toolType, label, description, verseRefs, strongsIds, order, studyToolWords } = body || {};

  if (!bookName || !chapter || !toolType || !label || !verseRefs?.length) {
    return { status: 400, message: 'bookName, chapter, toolType, label, and verseRefs are required' };
  }
  if (!TOOL_TYPES.includes(toolType)) {
    return { status: 400, message: `Invalid toolType. Must be one of: ${TOOL_TYPES.join(', ')}` };
  }

  const tool = await prisma.chapterStudyTool.create({
    data: {
      bookName,
      chapter: BigInt(chapter),
      toolType,
      label,
      description: description || null,
      verseRefs,
      strongsIds: strongsIds || null,
      order: order ?? 0,
      studyToolWords: studyToolWords?.length
        ? {
            create: studyToolWords.map((w, idx) => ({
              strongsId: w.strongsId,
              bookName: bookName,
              chapter: BigInt(chapter),
              verse: BigInt(w.verse || 1),
              surfaceText: w.surfaceText || '',
              originalWord: w.originalWord || null,
              transliteration: w.transliteration || null,
              adminExplanation: w.adminExplanation || null,
              wordOrder: w.wordOrder ?? idx,
            })),
          }
        : undefined,
    },
    include: {
      studyToolWords: {
        include: {
          strongs: {
            select: {
              strongsId: true,
              originalWord: true,
              transliteration: true,
              shortDefinition: true,
              adminExplanation: true,
              language: true,
            },
          },
        },
      },
    },
  });

  return { status: 200, message: 'Study tool created', data: serializeBigInt(tool) };
};

export const updateSingleTool = async (userId, body) => {
  const { id, bookName, chapter, toolType, label, description, verseRefs, strongsIds, order, studyToolWords } = body || {};

  if (!id) return { status: 400, message: 'id is required' };

  const existing = await prisma.chapterStudyTool.findUnique({ where: { id: BigInt(id) } });
  if (!existing) return { status: 404, message: 'Study tool not found' };

  // Delete existing study tool words
  await prisma.studyToolWord.deleteMany({ where: { studyToolId: BigInt(id) } });

  const tool = await prisma.chapterStudyTool.update({
    where: { id: BigInt(id) },
    data: {
      ...(bookName ? { bookName } : {}),
      ...(chapter ? { chapter: BigInt(chapter) } : {}),
      ...(toolType ? { toolType } : {}),
      ...(label ? { label } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(verseRefs ? { verseRefs } : {}),
      ...(strongsIds !== undefined ? { strongsIds } : {}),
      ...(order !== undefined ? { order } : {}),
      studyToolWords: studyToolWords?.length
        ? {
            create: studyToolWords.map((w, idx) => ({
              strongsId: w.strongsId,
              bookName: bookName || existing.bookName,
              chapter: BigInt(w.chapter || chapter || existing.chapter),
              verse: BigInt(w.verse || 1),
              surfaceText: w.surfaceText || '',
              originalWord: w.originalWord || null,
              transliteration: w.transliteration || null,
              adminExplanation: w.adminExplanation || null,
              wordOrder: w.wordOrder ?? idx,
            })),
          }
        : undefined,
    },
    include: {
      studyToolWords: {
        include: {
          strongs: {
            select: {
              strongsId: true,
              originalWord: true,
              transliteration: true,
              shortDefinition: true,
              adminExplanation: true,
              language: true,
            },
          },
        },
      },
    },
  });

  return { status: 200, message: 'Study tool updated', data: serializeBigInt(tool) };
};
