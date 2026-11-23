import { prisma } from '../../config/db.js';
import { parseStrongsIds, strongsText } from '../shared-study/normalization.js';

// BSB and Berean are aliases in existing editorial/imported records. Keep the
// stored spelling, but use a common key when combining references.
export const editionKey = value => ['BSB', 'BEREAN'].includes(String(value || 'BSB').toUpperCase())
  ? 'BSB' : String(value).toUpperCase();
export const referenceKey = ref => `${ref.bookName}:${ref.chapter}:${ref.verse}:${ref.verseEnd ?? ''}:${editionKey(ref.translation)}`;

export const strongsKey = value => String(value || '').trim().toUpperCase()
  .replace(/^([HG])0*(\d+)([A-Z]?)$/, '$1$2$3');
export const strongsAliases = value => {
  const key = strongsKey(value);
  const match = key.match(/^([HG])(\d+)([A-Z]?)$/);
  return match ? [...new Set([`${match[1]}${match[2].padStart(4, '0')}${match[3]}`, key, String(value).trim().toUpperCase()])] : [key];
};

const parseWords = value => {
  if (Array.isArray(value)) return value;
  try { const words = JSON.parse(value || '[]'); return Array.isArray(words) ? words : []; }
  catch { return []; }
};

/** Read current editorial links, not the legacy denormalized JSON snapshot.
 * Imported occurrences stay in VerseWord; editorial links must never fabricate
 * imported word positions or overwrite the dictionary's general definition.
 *
 * Pass `strongsIds` to enrich a whole Browse page in one round trip. Legacy
 * Resources rows are only scanned for a single word: their JSON text match is
 * a table scan, which a page of random words must not pay for. */
export async function getEditorialReferences({ bookName, chapter, verse, strongsId, strongsIds } = {}) {
  const bulk = Array.isArray(strongsIds) && strongsIds.length > 0;
  const singleAliases = strongsId ? strongsAliases(strongsId) : null;
  const wantedKeys = bulk ? new Set(strongsIds.map(strongsKey)) : null;
  const allAliases = bulk
    ? [...new Set(strongsIds.flatMap(id => strongsAliases(id)))]
    : singleAliases;
  const idFilter = allAliases?.length === 1 ? allAliases[0] : allAliases ? { in: allAliases } : undefined;
  const matchesWanted = value => {
    if (wantedKeys) return wantedKeys.has(strongsKey(value));
    if (strongsId) return strongsKey(value) === strongsKey(strongsId);
    return true;
  };
  const passage = {
    ...(bookName ? { bookName } : {}),
    ...(chapter > 0 ? { chapter } : {}),
  };
  const inChapter = chapter > 0
    ? verse > 0
      ? {
          OR: [
            { startChapter: { lt: chapter }, endChapter: { gt: chapter } },
            { startChapter: chapter, endChapter: chapter, startVerse: { lte: verse }, endVerse: { gte: verse } },
            { startChapter: chapter, endChapter: { gt: chapter }, startVerse: { lte: verse } },
            { startChapter: { lt: chapter }, endChapter: chapter, endVerse: { gte: verse } },
          ],
        }
      : { OR: [{ startChapter: { lt: chapter }, endChapter: { gt: chapter } }, { startChapter: chapter }, { endChapter: chapter }] }
    : {};
  const [sharedWords, studies, detailed, resources] = await Promise.all([
    prisma.studyWord.findMany({
      where: {
        strongLinks: idFilter ? { some: { strongsId: idFilter } } : { some: {} },
        study: {
          languageCode: 'en',
          OR: [
            { explanations: { some: {} } },
            { dailyVerses: { some: { isPublished: true } } },
            { devotions: { some: { isPublished: true } } },
          ],
          ...(bookName || chapter > 0 ? {
            passage: {
              ...(bookName ? { book: { name: bookName } } : {}),
              ...inChapter,
            },
          } : {}),
        },
      },
      select: {
        surfaceText: true,
        contextualMeaning: true,
        sortOrder: true,
        strongLinks: { select: { strongsId: true } },
        study: {
          select: {
            bibleEditionId: true,
            passage: { select: {
              startChapter: true, startVerse: true, endChapter: true, endVerse: true,
              book: { select: { name: true } },
            } },
            themes: { select: { text: true }, orderBy: { sortOrder: 'asc' } },
          },
        },
      },
      orderBy: [{ studyId: 'asc' }, { sortOrder: 'asc' }],
    }),
    prisma.verseWordStudy.findMany({
      where: { ...passage, ...(verse > 0 ? { verse } : {}), ...(idFilter ? { strongsId: idFilter } : {}) },
      orderBy: [{ bookName: 'asc' }, { chapter: 'asc' }, { verse: 'asc' }],
    }),
    prisma.verseWordStudyEntry.findMany({
      where: {
        strongsId: idFilter ?? { not: null },
        explanation: { ...passage, sharedStudyId: null, ...(verse > 0 ? { verseNumber: verse } : {}) },
      },
      include: { explanation: { include: { themes: { orderBy: { sortOrder: 'asc' } } } } },
      orderBy: { sortOrder: 'asc' },
    }),
    // Older Resources editors store word studies as JSON text, not relations.
    // Retain that content until an explicit, reviewed migration is undertaken.
    bulk ? [] : prisma.verseResource.findMany({
      where: {
        ...passage,
        ...(verse > 0 ? { verseStart: { lte: verse }, OR: [{ verseEnd: null }, { verseEnd: { gte: verse } }] } : {}),
        ...(idFilter ? { AND: [{ OR: allAliases.map(id => ({ wordStudies: { contains: id, mode: 'insensitive' } })) }] } : {}),
      },
      orderBy: { id: 'asc' },
    }),
  ]);
  const refs = [];
  // The shared study is canonical; put it first so it wins the reference-key
  // merge over a legacy copy left behind by the compatibility window.
  for (const word of sharedWords) {
    const { passage: ref, bibleEditionId } = word.study;
    for (const link of word.strongLinks) {
      if (!matchesWanted(link.strongsId)) continue;
      refs.push({ strongsId: link.strongsId, bookName: ref.book.name,
        chapter: ref.startChapter, verse: ref.startVerse, translation: bibleEditionId,
        ...(ref.startChapter === ref.endChapter && ref.endVerse > ref.startVerse ? { verseEnd: ref.endVerse } : {}),
        surfaceText: word.surfaceText, adminExplanation: word.contextualMeaning,
        sortOrder: word.sortOrder, themes: word.study.themes.map(theme => theme.text), source: 'shared' });
    }
  }
  for (const row of detailed) {
    const parent = row.explanation;
    refs.push({ strongsId: row.strongsId, bookName: parent.bookName, chapter: Number(parent.chapter),
      verse: Number(parent.verseNumber), translation: parent.bibleVersion || 'BSB',
      ...(parent.verseEnd ? { verseEnd: Number(parent.verseEnd) } : {}),
      surfaceText: row.surfaceText, adminExplanation: row.customDefinition,
      sortOrder: row.sortOrder, themes: parent.themes.map(theme => theme.themeName), source: 'explanation' });
  }
  for (const row of studies) refs.push({ strongsId: row.strongsId, bookName: row.bookName,
    chapter: Number(row.chapter), verse: row.verse == null ? null : Number(row.verse),
    translation: row.translation, surfaceText: row.surfaceText, adminExplanation: row.adminExplanation });
  for (const row of resources) {
    // Legacy resource records have no edition field and are historically BSB.
    for (const word of parseWords(row.wordStudies)) {
      if (!word || typeof word !== 'object') continue;
      for (const id of parseStrongsIds(strongsText(word))) {
        if (!matchesWanted(id)) continue;
        refs.push({ strongsId: id, bookName: row.bookName, chapter: Number(row.chapter),
          verse: Number(row.verseStart), translation: 'BSB', surfaceText: word.word || word.surfaceText,
          ...(row.verseEnd ? { verseEnd: Number(row.verseEnd) } : {}),
          adminExplanation: word.meaning || word.customDefinition });
      }
    }
  }
  return refs;
}

export function withEditorialReferences(entries, references) {
  const byId = new Map();
  for (const ref of references) {
    const id = strongsKey(ref.strongsId);
    if (!byId.has(id)) byId.set(id, []);
    byId.get(id).push(ref);
  }
  return entries.map(entry => {
    const refs = byId.get(strongsKey(entry.strongsId)) || [];
    const merged = new Map();
    for (const ref of refs) {
      const key = referenceKey(ref);
      // Normalized explanation > standalone attachment > legacy resource.
      if (!merged.has(key)) merged.set(key, ref);
    }
    const verseReferences = [...merged.values()].map(({ strongsId, sortOrder, themes, source, ...ref }) => ref);
    const contextualStudies = [];
    const seen = new Set();
    for (const ref of refs) {
      const first = merged.get(referenceKey(ref));
      if (typeof ref.adminExplanation !== 'string' || !ref.adminExplanation.trim() ||
        (ref !== first && typeof first.adminExplanation === 'string' && first.adminExplanation.trim() &&
          (!ref.source || ref.source !== first.source))) continue;
      const key = JSON.stringify([referenceKey(ref), ref.surfaceText?.trim(), ref.adminExplanation.trim()]);
      if (seen.has(key)) continue;
      seen.add(key);
      contextualStudies.push({ surfaceText: ref.surfaceText || null, customDefinition: ref.adminExplanation,
        sortOrder: ref.sortOrder || 0, themes: ref.themes || [], reference: {
          bookName: ref.bookName, chapter: ref.chapter, verseNumber: ref.verse, verseEnd: ref.verseEnd, bibleVersion: ref.translation,
        } });
    }
    const existingKeys = new Set(contextualStudies.map(s => referenceKey({
      bookName: s.reference.bookName, chapter: s.reference.chapter, verse: s.reference.verseNumber, verseEnd: s.reference.verseEnd,
      translation: s.reference.bibleVersion,
    })));
    for (const study of entry.contextualStudies || []) {
      const ref = study.reference;
      if (!ref || !existingKeys.has(referenceKey({
        bookName: ref.bookName, chapter: ref.chapter, verse: ref.verseNumber, verseEnd: ref.verseEnd, translation: ref.bibleVersion,
      }))) contextualStudies.push(study);
    }
    return { ...entry, verseReferences, verseCount: verseReferences.length, contextualStudies };
  });
}
