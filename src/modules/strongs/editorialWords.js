import { prisma } from '../../config/db.js';

// BSB and Berean are aliases in existing editorial/imported records. Keep the
// stored spelling, but use a common key when combining references.
export const editionKey = value => ['BSB', 'BEREAN'].includes(String(value || 'BSB').toUpperCase())
  ? 'BSB' : String(value).toUpperCase();
export const referenceKey = ref => `${ref.bookName}:${ref.chapter}:${ref.verse}:${editionKey(ref.translation)}`;

const parseWords = value => {
  if (Array.isArray(value)) return value;
  try { const words = JSON.parse(value || '[]'); return Array.isArray(words) ? words : []; }
  catch { return []; }
};

/** Read current editorial links, not the legacy denormalized JSON snapshot.
 * Imported occurrences stay in VerseWord; editorial links must never fabricate
 * imported word positions or overwrite the dictionary's general definition. */
export async function getEditorialReferences({ bookName, chapter, verse, strongsId } = {}) {
  const passage = {
    ...(bookName ? { bookName } : {}),
    ...(chapter > 0 ? { chapter } : {}),
  };
  const [studies, detailed, resources] = await Promise.all([
    prisma.verseWordStudy.findMany({
      where: { ...passage, ...(verse > 0 ? { verse } : {}), ...(strongsId ? { strongsId } : {}) },
      orderBy: [{ bookName: 'asc' }, { chapter: 'asc' }, { verse: 'asc' }],
    }),
    prisma.verseWordStudyEntry.findMany({
      where: {
        ...(strongsId ? { strongsId } : { strongsId: { not: null } }),
        explanation: { ...passage, ...(verse > 0 ? { verseNumber: verse } : {}) },
      },
      include: { explanation: { include: { themes: { orderBy: { sortOrder: 'asc' } } } } },
      orderBy: { sortOrder: 'asc' },
    }),
    // Older Resources editors store word studies as JSON text, not relations.
    // Retain that content until an explicit, reviewed migration is undertaken.
    prisma.verseResource.findMany({
      where: {
        ...passage,
        ...(verse > 0 ? { verseStart: { lte: verse }, OR: [{ verseEnd: null }, { verseEnd: { gte: verse } }] } : {}),
        ...(strongsId ? { wordStudies: { contains: strongsId } } : {}),
      },
      orderBy: { id: 'asc' },
    }),
  ]);
  const refs = [];
  for (const row of detailed) {
    const parent = row.explanation;
    refs.push({ strongsId: row.strongsId, bookName: parent.bookName, chapter: Number(parent.chapter),
      verse: Number(parent.verseNumber), translation: parent.bibleVersion || 'BSB',
      surfaceText: row.surfaceText, adminExplanation: row.customDefinition,
      sortOrder: row.sortOrder, themes: parent.themes.map(theme => theme.themeName) });
  }
  for (const row of studies) refs.push({ strongsId: row.strongsId, bookName: row.bookName,
    chapter: Number(row.chapter), verse: row.verse == null ? null : Number(row.verse),
    translation: row.translation, surfaceText: row.surfaceText, adminExplanation: row.adminExplanation });
  for (const row of resources) {
    // Legacy resource records have no edition field and are historically BSB.
    for (const word of parseWords(row.wordStudies)) {
      const id = word.strongsId || word.strongs;
      if (!id || (strongsId && id !== strongsId)) continue;
      refs.push({ strongsId: id, bookName: row.bookName, chapter: Number(row.chapter),
        verse: Number(row.verseStart), translation: 'BSB', surfaceText: word.word || word.surfaceText,
        adminExplanation: word.meaning || word.customDefinition });
    }
  }
  return refs;
}

export function withEditorialReferences(entries, references) {
  return entries.map(entry => {
    const refs = references.filter(ref => ref.strongsId === entry.strongsId);
    const merged = new Map();
    for (const ref of refs) {
      const key = referenceKey(ref);
      // Normalized explanation > standalone attachment > legacy resource.
      if (!merged.has(key)) merged.set(key, ref);
    }
    const verseReferences = [...merged.values()].map(({ strongsId, sortOrder, themes, ...ref }) => ref);
    const contextualStudies = [...(entry.contextualStudies || [])];
    const existingKeys = new Set(contextualStudies.filter(s => s.reference).map(s => referenceKey({
      bookName: s.reference.bookName, chapter: s.reference.chapter, verse: s.reference.verseNumber,
      translation: s.reference.bibleVersion,
    })));
    for (const ref of merged.values()) {
      if (existingKeys.has(referenceKey(ref))) continue;
      contextualStudies.push({ surfaceText: ref.surfaceText || null, customDefinition: ref.adminExplanation || null,
        sortOrder: ref.sortOrder || 0, themes: ref.themes || [], reference: {
          bookName: ref.bookName, chapter: ref.chapter, verseNumber: ref.verse, bibleVersion: ref.translation,
        } });
    }
    return { ...entry, verseReferences, verseCount: verseReferences.length, contextualStudies };
  });
}
