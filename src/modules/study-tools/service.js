import { localizeListPreviews } from '../admin/listPreview.js';
import { prisma } from '../../config/db.js';
import { serializeBigInt } from '../../utils/helpers.js';
import { changedFields, planRowPatch } from '../../utils/rowPatch.js';
import { translateStudyTools } from './translation.js';

const TOOL_TYPES = ['COMMAND', 'PROMISE', 'WARNING', 'REPEATED_WORD', 'TRANSITION', 'CONTRAST'];

export const getChapterTools = async (body) => {
  const { bookName, chapter, lang = 'en' } = body || {};

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
              fullDefinition: true,
              adminExplanation: true,
              language: true,
            },
          },
        },
      },
    },
  });

  const serialized = tools.map((tool) => serializeBigInt(tool));
  const translated = await translateStudyTools(serialized, lang);
  const grouped = {};
  for (const tool of translated) {
    const type = tool.toolType;
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(tool);
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
  const {
    bookName,
    chapter,
    toolType,
    search,
    lang = 'en',
    includeSource = false,
  } = body || {};

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

  const serialized = data.map(d => serializeBigInt(d));
  if (body?.listPreview === true) {
    return {
      status: 200, message: 'Study tools fetched',
      data: { data: await localizeListPreviews(serialized, lang, 'tool'), total, hasNext: (page + 1) * pageSize < total },
    };
  }
  const translated = await translateStudyTools(serialized, lang);
  const content =
    includeSource && String(lang || 'en').toLowerCase() !== 'en'
      ? translated.map((tool, index) => ({ ...tool, source: serialized[index] }))
      : translated;

  return {
    status: 200,
    message: 'Study tools fetched',
    data: {
      data: content,
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

  const where = { id: BigInt(id) };
  const include = { studyToolWords: {
    orderBy: { wordOrder: 'asc' },
    include: { strongs: { select: {
      strongsId: true, originalWord: true, transliteration: true, shortDefinition: true, adminExplanation: true, language: true,
    } } },
  } };
  const existing = await prisma.chapterStudyTool.findUnique({ where, include });
  if (!existing) return { status: 404, message: 'Study tool not found' };

  const data = changedFields(existing, {
    bookName: bookName || undefined, chapter: chapter ? BigInt(chapter) : undefined,
    toolType: toolType || undefined, label: label || undefined, description,
    verseRefs: verseRefs || undefined, strongsIds, order,
  });
  if (studyToolWords !== undefined) {
    if (!Array.isArray(studyToolWords)) return { status: 400, message: 'studyToolWords must be an array' };
    const words = studyToolWords.map((word, index) => ({
      strongsId: word.strongsId,
      bookName: bookName || existing.bookName,
      chapter: BigInt(word.chapter || chapter || existing.chapter),
      verse: BigInt(word.verse || 1),
      surfaceText: word.surfaceText || '',
      originalWord: word.originalWord || null,
      transliteration: word.transliteration || null,
      adminExplanation: word.adminExplanation || null,
      wordOrder: word.wordOrder ?? index,
    }));
    const { create, update, remove } = planRowPatch(existing.studyToolWords, words, word => word, Object.is, 'wordOrder');
    if (create.length || update.length || remove.length) {
      data.studyToolWords = {
        ...(create.length ? { create } : {}),
        ...(update.length ? { update: update.map(({ row, data }) => ({ where: { id: row.id }, data })) } : {}),
        ...(remove.length ? { deleteMany: { id: { in: remove.map(row => row.id) } } } : {}),
      };
    }
  }
  // One nested Prisma write keeps parent and word edits atomic.
  const tool = Object.keys(data).length ? await prisma.chapterStudyTool.update({ where, data, include }) : existing;

  return { status: 200, message: 'Study tool updated', data: serializeBigInt(tool) };
};
