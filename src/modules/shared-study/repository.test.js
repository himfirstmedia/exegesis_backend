const { hydrateStudies, projectStudy, studyDocument, writeStudy } = require('./repository.js');

const study = (extra = {}) => ({
  id: 12n, version: 3, introduction: 'Introduction', explanation: 'Explanation', application: 'Application',
  backgroundAuthor: null, backgroundBook: null, backgroundContext: null, finalThoughts: null,
  passage: { bookId: 1, startChapter: 1, startVerse: 1, endChapter: 1, endVerse: 1, book: { name: 'Genesis' } },
  takeaways: [{ text: 'One\nparagraph', sortOrder: 0 }], practicalApplications: [], themes: [],
  words: [{ surfaceText: 'word', contextualMeaning: 'meaning', sortOrder: 0, strongLinks: [
    { strongsId: 'H1', strongs: { dictionary: null } }, { strongsId: 'H2', strongs: { dictionary: null } },
  ] }], crossReferences: [], ...extra,
});

test('bulk hydration uses one query and preserves source ownership and schedules', async () => {
  const client = { passageStudy: { findMany: jest.fn().mockResolvedValue([study()]) } };
  const sources = [{ id: 1n, sharedStudyId: 12n, isPublished: false, reflection: 'Personal reflection' },
    { id: 2n, sharedStudyId: 12n, isPublished: true }];
  const result = await hydrateStudies(client, 'verse', sources);
  expect(client.passageStudy.findMany).toHaveBeenCalledTimes(1);
  expect(client.passageStudy.findMany.mock.calls[0][0].where).toEqual({ id: { in: [12n] } });
  expect(result[0]).toMatchObject({ id: 1n, isPublished: false, reflection: 'Personal reflection', explanation: 'Explanation', sharedStudyVersion: 3 });
  expect(JSON.parse(result[0].takeaways)).toEqual(['One\nparagraph']);
  expect(sources[0].explanation).toBeUndefined();
});

test('conflict, invalid and standalone sources never inherit a matching study', async () => {
  const source = { id: 1n, bookName: 'Genesis', explanation: 'Unresolved original' };
  const client = { passageStudy: { findMany: jest.fn() } };
  expect(await hydrateStudies(client, 'devotion', [source, null])).toEqual([source, null]);
  expect(client.passageStudy.findMany).not.toHaveBeenCalled();
  expect(await hydrateStudies(client, 'verse', null)).toBeNull();
});

test('broken links fail visibly instead of returning stale legacy content', async () => {
  const client = { passageStudy: { findMany: jest.fn().mockResolvedValue([]) } };
  await expect(hydrateStudies(client, 'verse', { sharedStudyId: 99n })).rejects.toMatchObject({ status: 500 });
});

test('root-only explanation projections hydrate rich sections and compound Strong’s IDs', () => {
  const projected = projectStudy('explanation', { id: 1n }, study());
  expect(projected.exegesis.explanationText).toBe('Explanation');
  expect(projected.wordStudies[0]).toMatchObject({ strongsId: null, strongsIds: ['H1', 'H2'], strongs: null });
  expect(projected.studyMetadata.takeaways).toBe('["One\\nparagraph"]');
});

const source = extra => ({ id: 1n, bookName: 'Genesis', chapter: 1, verseNumber: 1, bibleVersion: 'BSB', ...extra });
const transaction = existing => ({
  bibleBook: { upsert: jest.fn() }, bibleEdition: { upsert: jest.fn() },
  scripturePassage: { upsert: jest.fn().mockResolvedValue({ id: 1n }) },
  passageStudy: { findUnique: jest.fn().mockResolvedValue(existing), updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
  dailyVerse: { update: jest.fn() }, dailyDevotion: { update: jest.fn() },
});

test('a new source linking to a same-passage study defers to the existing study content on conflicts', async () => {
  const tx = transaction(study());
  // Incoming has 'Different' but existing has 'Explanation' — existing wins, no error thrown.
  const result = await writeStudy(tx, 'verse', source({ explanation: 'Different' }));
  // existing study content is unchanged so same() is true → only the FK is written
  expect(result).toEqual({ id: 12n, version: 3 });
  expect(tx.passageStudy.updateMany).not.toHaveBeenCalled();
  expect(tx.dailyVerse.update).toHaveBeenCalledWith({ where: { id: 1n }, data: { sharedStudyId: 12n } });
});

test('linked shared edits require the current version, even if old source text matches', async () => {
  const tx = transaction(study());
  await expect(writeStudy(tx, 'verse', source({ sharedStudyId: 12n, explanation: 'New' }), { allowSharedEdit: true, expectedVersion: 2 }))
    .rejects.toMatchObject({ status: 409, issues: ['version'] });
  expect(tx.passageStudy.updateMany).not.toHaveBeenCalled();
});

test('a metadata-only attachment preserves richer existing content without replacing children', async () => {
  const tx = transaction(study());
  expect(await writeStudy(tx, 'verse', source({ explanation: 'Explanation' }))).toEqual({ id: 12n, version: 3 });
  expect(tx.passageStudy.updateMany).not.toHaveBeenCalled();
  expect(tx.dailyVerse.update).toHaveBeenCalledWith({ where: { id: 1n }, data: { sharedStudyId: 12n } });
});

test('standalone devotion detaches its former link, without deleting shared content', async () => {
  const tx = transaction(study());
  expect(await writeStudy(tx, 'devotion', { id: 1n, sharedStudyId: 12n })).toBeNull();
  expect(tx.dailyDevotion.update).toHaveBeenCalledWith({ where: { id: 1n }, data: { sharedStudyId: null } });
  expect(tx.passageStudy.updateMany).not.toHaveBeenCalled();
});

test('invalid references abort before any shared data is written', async () => {
  const tx = transaction(null);
  await expect(writeStudy(tx, 'verse', source({ crossReferences: '[{"bookName":"Isaiah","chapter":12,"verseNumber":0}]' })))
    .rejects.toMatchObject({ status: 400 });
  expect(tx.scripturePassage.upsert).not.toHaveBeenCalled();
});

test('study documents contain content only, not dictionary definitions or source identity', () => {
  const document = studyDocument(study());
  expect(document.id).toBeUndefined();
  expect(document.words[0]).toEqual({ surfaceText: 'word', contextualMeaning: 'meaning', strongsIds: ['H1', 'H2'] });
});

test('concurrent version changes stop before deleting existing study sections', async () => {
  const tx = transaction(study());
  tx.passageStudy.updateMany.mockResolvedValue({ count: 0 });
  tx.studyWord = { deleteMany: jest.fn() };
  await expect(writeStudy(tx, 'verse', source({ sharedStudyId: 12n, explanation: 'Updated explanation' }), { allowSharedEdit: true, expectedVersion: 3 }))
    .rejects.toMatchObject({ status: 409, issues: ['version'] });
  expect(tx.studyWord.deleteMany).not.toHaveBeenCalled();
  expect(tx.dailyVerse.update).not.toHaveBeenCalled();
});

test('editing only prose does not rewrite shared children or relink the source', async () => {
  const tx = transaction(study());
  const input = source({
    sharedStudyId: 12n, verseIntroduction: 'Introduction', explanation: 'Updated explanation',
    application: 'Application', takeaways: '["One\\nparagraph"]',
    wordStudies: '[{"word":"word","strongs":"H1/H2","definition":"meaning"}]',
  });
  await expect(writeStudy(tx, 'verse', input, { allowSharedEdit: true, expectedVersion: 3 }))
    .resolves.toEqual({ id: 12n, version: 4 });
  expect(tx.passageStudy.updateMany).toHaveBeenCalledWith({
    where: { id: 12n, version: 3 },
    data: { explanation: 'Updated explanation', version: { increment: 1 } },
  });
  expect(tx.dailyVerse.update).not.toHaveBeenCalled();
});

test('patches one shared word and its changed Strong’s links without replacing the row', async () => {
  const previous = study();
  previous.words[0].id = 71n;
  const tx = transaction(previous);
  tx.studyWord = { update: jest.fn(), deleteMany: jest.fn(), createManyAndReturn: jest.fn() };
  tx.studyWordStrong = { deleteMany: jest.fn(), createMany: jest.fn() };
  tx.strongsDictionary = { findMany: jest.fn().mockResolvedValue([]) };
  tx.strongsIdentifier = { createMany: jest.fn() };
  await writeStudy(tx, 'verse', source({
    sharedStudyId: 12n, verseIntroduction: 'Introduction', explanation: 'Explanation',
    application: 'Application', takeaways: '["One\\nparagraph"]',
    wordStudies: '[{"word":"word","strongs":"H1/H3","definition":"new meaning"}]',
  }), { allowSharedEdit: true, expectedVersion: 3 });
  expect(tx.studyWord.update).toHaveBeenCalledWith({ where: { id: 71n }, data: { contextualMeaning: 'new meaning' } });
  expect(tx.studyWord.deleteMany).not.toHaveBeenCalled();
  expect(tx.studyWord.createManyAndReturn).not.toHaveBeenCalled();
  expect(tx.studyWordStrong.deleteMany).toHaveBeenCalledWith({ where: { OR: [{ studyWordId: 71n, strongsId: { in: ['H2'] } }] } });
  expect(tx.studyWordStrong.createMany).toHaveBeenCalledWith({ data: [{ studyWordId: 71n, strongsId: 'H3' }] });
});

test.each([true, false])('batches and reuses cross-reference passages (already stored: %s)', async alreadyStored => {
  const tx = transaction(null);
  tx.passageStudy.create = jest.fn().mockResolvedValue({ id: 12n, version: 1 });
  tx.bibleBook.createMany = jest.fn();
  const target = { bookId: 45, startChapter: 5, startVerse: 1, endChapter: 5, endVerse: 3 };
  const stored = { ...target, id: 99n };
  tx.scripturePassage.findMany = jest.fn().mockResolvedValue(alreadyStored ? [stored] : []);
  tx.scripturePassage.createManyAndReturn = jest.fn().mockResolvedValue([stored]);
  tx.studyCrossReference = { createMany: jest.fn() };
  await writeStudy(tx, 'verse', source({ crossReferences: JSON.stringify([
    { bookName: 'Romans', chapter: 5, verseNumber: 1, verseEnd: 3, commentary: 'First' },
    { bookName: 'Genesis', chapter: 1, verseNumber: 1, commentary: 'Self' },
    { bookName: 'Romans', chapter: 5, verseNumber: 1, verseEnd: 3, commentary: 'Repeated' },
  ]) }));
  expect(tx.scripturePassage.upsert).toHaveBeenCalledTimes(1);
  if (alreadyStored) expect(tx.scripturePassage.createManyAndReturn).not.toHaveBeenCalled();
  else expect(tx.scripturePassage.createManyAndReturn).toHaveBeenCalledWith({ data: [target], skipDuplicates: true });
  expect(tx.scripturePassage.findMany).toHaveBeenCalledTimes(1);
  expect(tx.studyCrossReference.createMany).toHaveBeenCalledWith({ data: [
    expect.objectContaining({ passageId: 99n, commentary: 'First', sortOrder: 0 }),
    expect.objectContaining({ passageId: 1n, commentary: 'Self', sortOrder: 1 }),
    expect.objectContaining({ passageId: 99n, commentary: 'Repeated', sortOrder: 2 }),
  ] });
});
