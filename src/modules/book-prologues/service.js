import { prisma } from '../../config/db.js';
import { serializeBigInt } from '../../utils/helpers.js';

export const getBookPrologue = async (body) => {
  const { bookName } = body || {};
  if (!bookName) return { status: 400, message: 'bookName is required' };

  const prologue = await prisma.bookPrologue.findUnique({ where: { bookName } });
  if (!prologue) return { status: 404, message: 'Book prologue not found' };
  return { status: 200, message: 'Book prologue fetched', data: serializeBigInt(prologue) };
};

export const getAllBookPrologues = async (body) => {
  const page = body?.page || 0;
  const pageSize = body?.pageSize || 50;
  const search = body?.search;
  const where = search
    ? {
        OR: [
          { bookName: { contains: search, mode: 'insensitive' } },
          { author: { contains: search, mode: 'insensitive' } },
          { summary: { contains: search, mode: 'insensitive' } },
          { keyTheme: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.bookPrologue.findMany({
      where,
      orderBy: { bookName: 'asc' },
      skip: page * pageSize,
      take: pageSize,
    }),
    prisma.bookPrologue.count({ where }),
  ]);

  return {
    status: 200,
    message: 'Book prologues fetched',
    data: { data: data.map(item => serializeBigInt(item)), total, hasNext: (page + 1) * pageSize < total },
  };
};

export const upsertBookPrologue = async (userId, body) => {
  const {
    bookName,
    author,
    audience,
    dateWritten,
    locationWritten,
    purpose,
    keyTheme,
    summary,
    mainThemes,
    christConnection,
  } = body || {};

  if (!bookName) return { status: 400, message: 'bookName is required' };

  const data = {
    author: author || null,
    audience: audience || null,
    dateWritten: dateWritten || null,
    locationWritten: locationWritten || null,
    purpose: purpose || null,
    keyTheme: keyTheme || null,
    summary: summary || null,
    mainThemes: Array.isArray(mainThemes) ? mainThemes : [],
    christConnection: christConnection || null,
  };

  const prologue = await prisma.bookPrologue.upsert({
    where: { bookName },
    create: { bookName, ...data, createdBy: userId, updatedBy: userId },
    update: { ...data, updatedBy: userId },
  });

  return { status: 200, message: 'Book prologue saved', data: serializeBigInt(prologue) };
};

export const deleteBookPrologue = async (body) => {
  const { bookName } = body || {};
  if (!bookName) return { status: 400, message: 'bookName is required' };

  const existing = await prisma.bookPrologue.findUnique({ where: { bookName } });
  if (!existing) return { status: 404, message: 'Book prologue not found' };

  await prisma.bookPrologue.delete({ where: { bookName } });
  return { status: 200, message: 'Book prologue deleted' };
};
