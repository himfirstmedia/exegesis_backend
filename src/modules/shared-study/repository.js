import { CANONICAL_BOOK_ORDER } from '../../constants/bible-books.js';
import { SCALARS, mergeStudy, normalizeSource, same } from './normalization.js';

export const studyInclude = {
  passage: { include: { book: true } },
  takeaways: { orderBy: { sortOrder: 'asc' } },
  practicalApplications: { orderBy: { sortOrder: 'asc' } },
  themes: { orderBy: { sortOrder: 'asc' } },
  words: { orderBy: { sortOrder: 'asc' }, include: {
    strongLinks: { orderBy: { strongsId: 'asc' }, include: { strongs: { include: { dictionary: true } } } },
  } },
  crossReferences: { orderBy: { sortOrder: 'asc' }, include: { passage: { include: { book: true } } } },
};

export class SharedStudyError extends Error {
  constructor(message, issues = [], status = 409) {
    super(message);
    this.name = 'SharedStudyError';
    this.status = status;
    this.issues = issues;
  }
}

export function studyDocument(study) {
  return {
    ...Object.fromEntries(SCALARS.map(field => [field, study[field]])),
    takeaways: study.takeaways.map(item => item.text),
    practicalApplications: study.practicalApplications.map(item => item.text),
    themes: study.themes.map(item => item.text),
    words: study.words.map(item => ({ surfaceText: item.surfaceText, contextualMeaning: item.contextualMeaning,
      strongsIds: item.strongLinks.map(link => link.strongsId).sort() })),
    crossReferences: study.crossReferences.map(item => ({
      passage: passageIdentity(item.passage), quotationOverride: item.quotationOverride, commentary: item.commentary,
    })),
  };
}

const passageIdentity = passage => Object.fromEntries(
  ['bookId', 'startChapter', 'startVerse', 'endChapter', 'endVerse'].map(key => [key, passage[key]]),
);

const dailyReference = reference => ({
  bookName: reference.passage.book.name,
  chapter: reference.passage.startChapter,
  verseNumber: reference.passage.startVerse,
  ...(reference.passage.endVerse !== reference.passage.startVerse ? { verseEnd: reference.passage.endVerse } : {}),
  referenceText: reference.quotationOverride || '',
  commentary: reference.commentary || '',
});

/** A DTO adapter only: source identity, schedules and publication stay feature-owned. */
export function projectStudy(type, source, study) {
  if (!source || !study) return source;
  const document = studyDocument(study);
  if (type !== 'explanation') {
    const { introduction, words, themes, crossReferences, ...fields } = document;
    return { ...source, sharedStudyVersion: study.version, ...Object.fromEntries(SCALARS.filter(field => field !== 'introduction').map(field => [field, fields[field]])),
      verseIntroduction: introduction,
      takeaways: JSON.stringify(document.takeaways),
      practicalApplications: JSON.stringify(document.practicalApplications),
      keyThemes: JSON.stringify(themes),
      wordStudies: JSON.stringify(words.map(word => ({ word: word.surfaceText, strongs: word.strongsIds.join('/'), definition: word.contextualMeaning }))),
      crossReferences: JSON.stringify(study.crossReferences.map(dailyReference)),
    };
  }
  return { ...source, sharedStudyVersion: study.version,
    exegesis: { ...source.exegesis, explanationText: study.explanation, applicationText: study.application },
    studyMetadata: { ...source.studyMetadata,
      ...Object.fromEntries(['introduction', 'backgroundAuthor', 'backgroundBook', 'backgroundContext', 'finalThoughts'].map(field => [field, study[field]])),
      takeaways: JSON.stringify(document.takeaways),
    },
    wordStudies: study.words.map((word, index) => ({
      ...source.wordStudies?.[index], surfaceText: word.surfaceText, customDefinition: word.contextualMeaning,
      strongsId: word.strongLinks.length === 1 ? word.strongLinks[0].strongsId : null,
      strongsIds: word.strongLinks.map(link => link.strongsId),
      strongs: word.strongLinks.length === 1 ? word.strongLinks[0].strongs.dictionary : null,
      sortOrder: word.sortOrder,
    })),
    practicalApps: study.practicalApplications.map((item, index) => ({ ...source.practicalApps?.[index], applicationText: item.text, sortOrder: item.sortOrder })),
    themes: study.themes.map((item, index) => ({ ...source.themes?.[index], themeName: item.text, sortOrder: item.sortOrder })),
    crossReferences: study.crossReferences.map((item, index) => ({ ...source.crossReferences?.[index], ...dailyReference(item), sortOrder: item.sortOrder })),
  };
}

/** One bulk query, including selected-field callers. No identity-based fallback:
 * a pending conflict must never inherit another source's study implicitly. */
export async function hydrateStudies(client, type, sources) {
  const many = Array.isArray(sources);
  const rows = many ? sources : [sources];
  const ids = [...new Set(rows.filter(row => row?.sharedStudyId != null).map(row => String(row.sharedStudyId)))].map(BigInt);
  if (!ids.length) return sources;
  const studies = await client.passageStudy.findMany({ where: { id: { in: ids } }, include: studyInclude });
  const byId = new Map(studies.map(study => [String(study.id), study]));
  const result = rows.map(row => {
    if (row?.sharedStudyId == null) return row;
    const study = byId.get(String(row.sharedStudyId));
    if (!study) throw new SharedStudyError('Linked shared study is missing', [String(row.sharedStudyId)], 500);
    return projectStudy(type, row, study);
  });
  return many ? result : result[0];
}

async function ensurePassage(tx, identity) {
  await tx.bibleBook.upsert({ where: { id: identity.bookId }, update: {},
    create: { id: identity.bookId, name: CANONICAL_BOOK_ORDER[identity.bookId - 1] } });
  return tx.scripturePassage.upsert({ where: { bookId_startChapter_startVerse_endChapter_endVerse: identity }, update: {}, create: identity });
}

/** Must be called inside the caller's transaction, after its legacy-compatible
 * write and before commit. Shared edits require an explicit expected version;
 * merely attaching a new source may only fill missing/equal content. */
export async function writeStudy(tx, type, source, { expectedVersion, allowSharedEdit = false } = {}) {
  const table = { explanation: 'verseExplanation', verse: 'dailyVerse', devotion: 'dailyDevotion' }[type];
  if (!table) throw new SharedStudyError('Unsupported study source', [type], 400);
  const normalized = normalizeSource(type, source);
  if (normalized.status === 'NO_PASSAGE') {
    // Removing a devotion's passage must not leave an old study linked.
    await tx[table].update({ where: { id: source.id }, data: { sharedStudyId: null } });
    return null;
  }
  if (normalized.status !== 'LINKED') throw new SharedStudyError('Study content needs correction', normalized.issues, 400);
  const { passage, edition, language, study: incoming } = normalized.payload;
  for (const word of incoming.words) word.strongsIds.sort();
  const ref = await ensurePassage(tx, passage);
  await tx.bibleEdition.upsert({ where: { id: edition }, update: {}, create: { id: edition, name: edition } });
  const identity = { passageId: ref.id, bibleEditionId: edition, languageCode: language };
  const existing = await tx.passageStudy.findUnique({ where: { passageId_bibleEditionId_languageCode: identity }, include: studyInclude });
  let document = incoming;
  if (existing) {
    const comparison = mergeStudy(studyDocument(existing), incoming);
    const ownsLink = source.sharedStudyId != null && String(source.sharedStudyId) === String(existing.id);
    if (allowSharedEdit && ownsLink) {
      if (!Number.isInteger(expectedVersion) || expectedVersion !== existing.version) {
        throw new SharedStudyError('Shared study changed; reload before saving', ['version']);
      }
    } else {
      if (comparison.conflicts.length) throw new SharedStudyError('This passage already has different shared content; review before linking', comparison.conflicts);
      document = comparison.merged;
    }
  }
  if (existing && same(studyDocument(existing), document)) {
    await tx[table].update({ where: { id: source.id }, data: { sharedStudyId: existing.id } });
    return { id: existing.id, version: existing.version };
  }
  const scalars = Object.fromEntries(SCALARS.map(field => [field, document[field]]));
  let saved;
  if (existing) {
    // Optimistic lock also protects simultaneous missing-field merges.
    const update = await tx.passageStudy.updateMany({ where: { id: existing.id, version: existing.version }, data: { ...scalars, version: { increment: 1 } } });
    if (update.count !== 1) throw new SharedStudyError('Shared study changed; reload before saving', ['version']);
    saved = { id: existing.id, version: existing.version + 1 };
    for (const table of ['studyTakeaway', 'studyPracticalApplication', 'studyTheme', 'studyWord', 'studyCrossReference']) await tx[table].deleteMany({ where: { studyId: saved.id } });
  } else {
    saved = await tx.passageStudy.create({ data: { ...identity, ...scalars, status: 'REVIEW' } });
  }
  for (const [field, table] of [['takeaways', 'studyTakeaway'], ['practicalApplications', 'studyPracticalApplication'], ['themes', 'studyTheme']]) {
    if (document[field].length) await tx[table].createMany({ data: document[field].map((text, sortOrder) => ({ studyId: saved.id, text, sortOrder })) });
  }
  const strongsIds = [...new Set(document.words.flatMap(word => word.strongsIds))];
  const dictionaryIds = new Set(strongsIds.length ? (await tx.strongsDictionary.findMany({ where: { strongsId: { in: strongsIds } }, select: { strongsId: true } })).map(row => row.strongsId) : []);
  for (const id of strongsIds) await tx.strongsIdentifier.upsert({ where: { id }, update: dictionaryIds.has(id) ? { dictionaryId: id } : {}, create: { id, dictionaryId: dictionaryIds.has(id) ? id : null } });
  for (const [sortOrder, word] of document.words.entries()) await tx.studyWord.create({ data: {
    studyId: saved.id, surfaceText: word.surfaceText, contextualMeaning: word.contextualMeaning, sortOrder,
    strongLinks: { create: word.strongsIds.map(strongsId => ({ strongsId })) },
  } });
  for (const [sortOrder, reference] of document.crossReferences.entries()) {
    const target = await ensurePassage(tx, reference.passage);
    await tx.studyCrossReference.create({ data: { studyId: saved.id, passageId: target.id, bibleEditionId: edition,
      quotationOverride: reference.quotationOverride, commentary: reference.commentary, sortOrder } });
  }
  await tx[table].update({ where: { id: source.id }, data: { sharedStudyId: saved.id } });
  return saved;
}
