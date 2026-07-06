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

  // Delete existing tools for this chapter
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
