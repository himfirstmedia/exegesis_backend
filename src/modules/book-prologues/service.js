import { prisma } from '../../config/db.js';
import { serializeBigInt } from '../../utils/helpers.js';
import { normalizeLanguage, translateMany } from '../../utils/translator.js';

const TRANSLATABLE_FIELDS = [
  'authorDetail',
  'audience',
  'dateWritten',
  'locationWritten',
  'purpose',
  'keyTheme',
  'summary',
  'background',
  'lessons',
  'christConnection',
];

const translateBookPrologue = async (prologue, lang = 'en') => {
  const target = normalizeLanguage(lang);
  if (!prologue || target.toLowerCase() === 'en') return prologue;

  const translated = {
    ...prologue,
    structure: Array.isArray(prologue.structure)
      ? prologue.structure.map(item => item && typeof item === 'object' && !Array.isArray(item) ? { ...item } : item)
      : prologue.structure,
    applications: Array.isArray(prologue.applications) ? [...prologue.applications] : prologue.applications,
    mainThemes: Array.isArray(prologue.mainThemes) ? [...prologue.mainThemes] : prologue.mainThemes,
  };
  const entries = [];
  const addEntry = (value, setValue) => {
    if (typeof value === 'string') entries.push({ value, setValue });
  };

  TRANSLATABLE_FIELDS.forEach(field => {
    addEntry(translated[field], value => { translated[field] = value; });
  });
  if (Array.isArray(translated.structure)) {
    translated.structure.forEach(item => {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        addEntry(item.title, value => { item.title = value; });
      }
    });
  }
  if (Array.isArray(translated.applications)) {
    translated.applications.forEach((item, index) => {
      addEntry(item, value => { translated.applications[index] = value; });
    });
  }
  if (Array.isArray(translated.mainThemes)) {
    translated.mainThemes.forEach((item, index) => {
      addEntry(item, value => { translated.mainThemes[index] = value; });
    });
  }

  const values = await translateMany(entries.map(entry => entry.value), target);
  entries.forEach((entry, index) => entry.setValue(values[index]));
  return translated;
};

export const getBookPrologue = async (body) => {
  const { bookName, lang = 'en' } = body || {};
  if (!bookName) return { status: 400, message: 'bookName is required' };

  const prologue = await prisma.bookPrologue.findUnique({ where: { bookName } });
  if (!prologue) return { status: 404, message: 'Book prologue not found' };
  const data = serializeBigInt(prologue);
  return { status: 200, message: 'Book prologue fetched', data: await translateBookPrologue(data, lang) };
};

export const getAllBookPrologues = async (body) => {
  const page = body?.page || 0;
  const pageSize = body?.pageSize || 50;
  const search = body?.search;
  const lang = body?.lang || 'en';
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
      // Canonical Bible order (Genesis first), with alphabetical as a stable fallback.
      orderBy: [{ sortOrder: 'asc' }, { bookName: 'asc' }],
      skip: page * pageSize,
      take: pageSize,
    }),
    prisma.bookPrologue.count({ where }),
  ]);

  const serialized = data.map(item => serializeBigInt(item));
  const translated = await Promise.all(serialized.map(item => translateBookPrologue(item, lang)));

  return {
    status: 200,
    message: 'Book prologues fetched',
    data: { data: translated, total, hasNext: (page + 1) * pageSize < total },
  };
};

export const upsertBookPrologue = async (userId, body) => {
  const {
    bookName,
    author,
    authorDetail,
    audience,
    dateWritten,
    locationWritten,
    purpose,
    keyTheme,
    summary,
    background,
    lessons,
    chapters,
    structure,
    applications,
    keyScripture,
    mainThemes,
    keyPeople,
    keyVerses,
    christConnection,
  } = body || {};

  if (!bookName) return { status: 400, message: 'bookName is required' };

  const data = {
    author: author || null,
    authorDetail: authorDetail || null,
    audience: audience || null,
    dateWritten: dateWritten || null,
    locationWritten: locationWritten || null,
    purpose: purpose || null,
    keyTheme: keyTheme || null,
    summary: summary || null,
    background: background || null,
    lessons: lessons || null,
    chapters: Number.isFinite(Number(chapters)) && chapters !== null && chapters !== '' ? Number(chapters) : null,
    structure: Array.isArray(structure) ? structure : [],
    applications: Array.isArray(applications) ? applications : [],
    keyScripture: Array.isArray(keyScripture) ? keyScripture : [],
    mainThemes: Array.isArray(mainThemes) ? mainThemes : [],
    keyPeople: Array.isArray(keyPeople) ? keyPeople : [],
    keyVerses: Array.isArray(keyVerses) ? keyVerses : [],
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
