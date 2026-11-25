import { CANONICAL_BOOK_ORDER } from '../../constants/bible-books.js';
import { planRowPatch } from '../../utils/rowPatch.js';
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
const passageKey = p => `${p.bookId}:${p.startChapter}:${p.startVerse}:${p.endChapter}:${p.endVerse}`;

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
export async function writeStudy(tx, type, source, { expectedVersion, allowSharedEdit = false, referenceOnly = false } = {}) {
  const table = { explanation: 'verseExplanation', verse: 'dailyVerse', devotion: 'dailyDevotion' }[type];
  if (!table) throw new SharedStudyError('Unsupported study source', [type], 400);
  const linkedReferenceOnly = referenceOnly && type === 'explanation' && source.sharedStudyId != null;
  const normalized = normalizeSource(type, linkedReferenceOnly ? {
    ...source, exegesis: undefined, studyMetadata: undefined,
    wordStudies: [], practicalApps: [], crossReferences: [], themes: [],
  } : source);
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
  const sourceLinks = { explanations: true, dailyVerses: true, devotions: true };
  let existing = await tx.passageStudy.findUnique({
    where: { passageId_bibleEditionId_languageCode: identity },
    include: type === 'explanation' ? { ...studyInclude, _count: { select: sourceLinks } } : studyInclude,
  });
  let moving = false;
  let movedDocument;
  if (linkedReferenceOnly) {
    const original = existing?.id === source.sharedStudyId ? existing : await tx.passageStudy.findUnique({
      where: { id: source.sharedStudyId },
      include: { ...studyInclude, _count: { select: sourceLinks } },
    });
    if (!original || original.version !== expectedVersion) {
      throw new SharedStudyError('Shared study changed; reload before saving', ['version']);
    }
    movedDocument = studyDocument(original);
    if (!existing && original.bibleEditionId === edition && original.languageCode === language &&
        original._count.explanations === 1 && !original._count.dailyVerses && !original._count.devotions) {
      // Move the canonical study itself: its content, child IDs, and audit
      // history stay intact, and its old passage has nothing to auto-load.
      existing = original;
      moving = true;
    }
  }
  const previous = existing ? studyDocument(existing) : null;
  const ownsLink = existing && source.sharedStudyId != null && String(source.sharedStudyId) === String(existing.id);
  // Moving an explanation leaves its previous passage study behind. It is
  // safe to reuse that row for fresh editorial content only when unreferenced.
  const reuseDetached = type === 'explanation' && !ownsLink && existing?._count &&
    Object.keys(sourceLinks).every(key => existing._count[key] === 0);
  let document = movedDocument ?? incoming;
  if (existing) {
    if (allowSharedEdit && ownsLink) {
      if (!Number.isInteger(expectedVersion) || expectedVersion !== existing.version) {
        throw new SharedStudyError('Shared study changed; reload before saving', ['version']);
      }
    } else if (!reuseDetached) {
      const { merged, conflicts } = mergeStudy(previous, document);
      if (type === 'explanation' && !ownsLink && conflicts.length) {
        throw new SharedStudyError(
          'This passage already has different study content linked to another item. The explanation was not saved.',
          conflicts,
        );
      }
      // A reference-only correction must not import extra destination fields.
      if (linkedReferenceOnly && !same(previous, document)) {
        throw new SharedStudyError('The destination has different shared study content. The explanation was not moved.', ['reference']);
      }
      document = merged;
    }
  }
  if (!moving && existing && same(previous, document)) {
    if (!ownsLink) await tx[table].update({ where: { id: source.id }, data: { sharedStudyId: existing.id } });
    return { id: existing.id, version: existing.version };
  }
  const scalars = Object.fromEntries(SCALARS.filter(field => !previous || previous[field] !== document[field])
    .map(field => [field, document[field]]));
  let saved;
  if (existing) {
    // Optimistic lock also protects simultaneous missing-field merges.
    const update = await tx.passageStudy.updateMany({
      where: {
        id: existing.id, version: existing.version,
        ...(reuseDetached ? { explanations: { none: {} }, dailyVerses: { none: {} }, devotions: { none: {} } } : {}),
        ...(moving ? {
          explanations: { some: { id: source.id }, every: { id: source.id } },
          dailyVerses: { none: {} }, devotions: { none: {} },
        } : {}),
      },
      data: { ...scalars, ...(moving ? { passageId: ref.id } : {}), version: { increment: 1 } },
    });
    if (update.count !== 1) throw new SharedStudyError('Shared study changed; reload before saving', ['version']);
    saved = { id: existing.id, version: existing.version + 1 };
  } else {
    saved = await tx.passageStudy.create({ data: { ...identity, ...scalars, status: 'REVIEW' } });
  }
  const changed = field => !previous || !same(previous[field], document[field]);
  for (const [field, table] of [['takeaways', 'studyTakeaway'], ['practicalApplications', 'studyPracticalApplication'], ['themes', 'studyTheme']]) {
    if (!changed(field)) continue;
    const patch = planRowPatch(existing?.[field] ?? [], document[field].map((text, sortOrder) => ({ text, sortOrder })), row => row);
    await removeRows(tx[table], patch.remove);
    for (const { row, data } of patch.update) await tx[table].update({ where: { id: row.id }, data });
    if (patch.create.length) await tx[table].createMany({ data: patch.create.map(row => ({ studyId: saved.id, ...row })) });
  }
  if (changed('words') && (existing?.words.length || document.words.length))
    await writeWords(tx, saved.id, existing?.words ?? [], document.words);
  if (changed('crossReferences') && (existing?.crossReferences.length || document.crossReferences.length))
    await writeReferences(tx, saved.id, edition, passage, ref.id, existing?.crossReferences ?? [], document.crossReferences);
  if (!ownsLink) await tx[table].update({ where: { id: source.id }, data: { sharedStudyId: saved.id } });
  return saved;
}

async function removeRows(table, rows) {
  if (rows.length) await table.deleteMany({ where: { id: { in: rows.map(row => row.id) } } });
}

async function writeWords(tx, studyId, current, words) {
  const patch = planRowPatch(current, words.map((word, sortOrder) => ({ ...word, sortOrder })), row => ({
    ...row, strongsIds: row.strongLinks.map(link => link.strongsId).sort(),
  }), same);
  await removeRows(tx.studyWord, patch.remove);
  const links = [];
  const removedLinks = [];
  for (const { row, data: { strongsIds, ...fields } } of patch.update) {
    if (Object.keys(fields).length) await tx.studyWord.update({ where: { id: row.id }, data: fields });
    if (strongsIds) {
      const previous = new Set(row.strongLinks.map(link => link.strongsId));
      const removed = [...previous].filter(id => !strongsIds.includes(id));
      if (removed.length) removedLinks.push({ studyWordId: row.id, strongsId: { in: removed } });
      for (const strongsId of strongsIds) if (!previous.has(strongsId)) links.push({ studyWordId: row.id, strongsId });
    }
  }
  if (removedLinks.length) await tx.studyWordStrong.deleteMany({ where: { OR: removedLinks } });
  const identifiers = [...new Set([...patch.create.flatMap(word => word.strongsIds), ...links.map(link => link.strongsId)])];
  if (identifiers.length) {
    const dictionary = await tx.strongsDictionary.findMany({ where: { strongsId: { in: identifiers } }, select: { strongsId: true } });
    const dictionaryIds = new Set(dictionary.map(row => row.strongsId));
    await tx.strongsIdentifier.createMany({
      data: identifiers.map(id => ({ id, dictionaryId: dictionaryIds.has(id) ? id : null })),
      skipDuplicates: true,
    });
    // Existing identifiers for formerly missing dictionary rows may need linking.
    if (dictionaryIds.size) {
      const existing = await tx.strongsIdentifier.findMany({ where: { id: { in: [...dictionaryIds] } }, select: { id: true, dictionaryId: true } });
      for (const { id, dictionaryId } of existing) {
        if (id !== dictionaryId) await tx.strongsIdentifier.update({ where: { id }, data: { dictionaryId: id } });
      }
    }
  }
  if (patch.create.length) {
    const rows = await tx.studyWord.createManyAndReturn({
      data: patch.create.map(({ surfaceText, contextualMeaning, sortOrder }) => ({ studyId, surfaceText, contextualMeaning, sortOrder })),
      select: { id: true, sortOrder: true },
    });
    // Prisma does not guarantee the order returned by a bulk insert.
    for (const { id, sortOrder } of rows) {
      for (const strongsId of words[sortOrder].strongsIds) links.push({ studyWordId: id, strongsId });
    }
  }
  if (links.length) await tx.studyWordStrong.createMany({ data: links });
}

async function writeReferences(tx, studyId, edition, mainPassage, mainId, current, references) {
  const patch = planRowPatch(current, references.map((row, sortOrder) => ({ ...row, sortOrder })),
    row => ({ ...row, passage: passageIdentity(row.passage) }), same);
  await removeRows(tx.studyCrossReference, patch.remove);
  const mainKey = passageKey(mainPassage);
  const ids = new Map([...current.map(row => [passageKey(row.passage), row.passageId ?? row.passage.id]), [mainKey, mainId]]);
  const targets = [...patch.create.map(row => row.passage), ...patch.update.map(({ data }) => data.passage).filter(Boolean)];
  const passages = [...new Map(targets.map(passage => [passageKey(passage), passage])).values()]
    .filter(passage => !ids.has(passageKey(passage)));
  if (passages.length) {
    const rows = await tx.scripturePassage.findMany({ where: { OR: passages } });
    for (const row of rows) ids.set(passageKey(row), row.id);
    const missing = passages.filter(passage => !ids.has(passageKey(passage)));
    if (missing.length) {
      const bookIds = [...new Set(missing.map(passage => passage.bookId))].filter(id => id !== mainPassage.bookId);
      if (bookIds.length) await tx.bibleBook.createMany({
        data: bookIds.map(id => ({ id, name: CANONICAL_BOOK_ORDER[id - 1] })), skipDuplicates: true,
      });
      const inserted = await tx.scripturePassage.createManyAndReturn({ data: missing, skipDuplicates: true });
      for (const row of inserted) ids.set(passageKey(row), row.id);
      // Another save may have inserted the same passage after our first read.
      const concurrent = missing.filter(passage => !ids.has(passageKey(passage)));
      if (concurrent.length) {
        for (const row of await tx.scripturePassage.findMany({ where: { OR: concurrent } })) ids.set(passageKey(row), row.id);
      }
    }
  }
  const resolve = passage => {
    const passageId = ids.get(passageKey(passage));
    if (passageId == null) throw new SharedStudyError('Could not resolve cross-reference passage', [passageKey(passage)], 500);
    return passageId;
  };
  for (const { row, data: { passage, ...fields } } of patch.update) {
    await tx.studyCrossReference.update({ where: { id: row.id }, data: { ...fields, ...(passage ? { passageId: resolve(passage) } : {}) } });
  }
  if (patch.create.length) await tx.studyCrossReference.createMany({ data: patch.create.map(({ passage, ...fields }) => ({
    ...fields, studyId, passageId: resolve(passage), bibleEditionId: edition,
  })) });
}
