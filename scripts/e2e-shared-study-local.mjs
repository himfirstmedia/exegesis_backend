/**
 * Local-only shared-study integration smoke test.
 * Runs against the disposable `exegesis_e2e` clone, never `exegesis`.
 */
process.env.DATABASE_URL = 'postgresql://opio:opio@localhost:5432/exegesis_e2e';
process.env.NODE_ENV = 'test';

const results = [];
function check(name, condition, detail = '') {
  results.push({ name, pass: Boolean(condition), detail });
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

const { prisma } = await import('../src/config/db.js');
const bible = await import('../src/modules/bible/service.js');
const admin = await import('../src/modules/admin/service.js');

const actor = (await prisma.systemUser.findFirst({ select: { id: true } }))?.id;
if (!actor) throw new Error('No system user available for FK writes');

try {
  // ── Explanation: read, edit through the shared write, stale version, restore
  const before = await bible.getVerseExplanation({ bookName: 'Genesis', chapter: 1, verseNumber: 1 });
  check('explanation read hydrates shared version', before.status === 200 && before.data.sharedStudyVersion === 1,
    `status=${before.status} version=${before.data?.sharedStudyVersion}`);
  const originalText = before.data.exegesis.explanationText;
  const originalApp = before.data.exegesis.applicationText;

  const edited = await bible.addVerseExplanation({
    id: before.data.id,
    bookName: 'Genesis',
    chapter: 1,
    verseNumber: 1,
    verseEnd: before.data.verseEnd ?? null,
    bibleVersion: before.data.bibleVersion,
    exegesis: { explanationText: `${originalText} [e2e]`, applicationText: originalApp },
    studyMetadata: before.data.studyMetadata,
    wordStudies: before.data.wordStudies,
    practicalApps: before.data.practicalApps,
    crossReferences: before.data.crossReferences,
    themes: before.data.themes,
    sharedStudyVersion: before.data.sharedStudyVersion,
  }, actor);
  check('explanation edit succeeds with current version', edited.status === 200,
    `status=${edited.status} msg=${edited.message}`);
  check('explanation edit increments shared version', edited.data?.sharedStudyVersion === 2,
    `version=${edited.data?.sharedStudyVersion}`);

  const linked = await prisma.passageStudy.findFirst({
    where: { explanations: { some: { id: BigInt(before.data.id) } } },
    include: { words: { include: { strongLinks: true } }, takeaways: true },
  });
  check('legacy explanation stays linked to one shared study', Boolean(linked));
  check('shared study holds the edited text', linked?.explanation?.endsWith('[e2e]') === true);

  const stale = await bible.addVerseExplanation({
    id: before.data.id,
    bookName: 'Genesis', chapter: 1, verseNumber: 1,
    bibleVersion: before.data.bibleVersion,
    exegesis: { explanationText: `${originalText} [stale]`, applicationText: originalApp },
    studyMetadata: before.data.studyMetadata,
    wordStudies: before.data.wordStudies,
    practicalApps: before.data.practicalApps,
    crossReferences: before.data.crossReferences,
    themes: before.data.themes,
    sharedStudyVersion: 1,
  }, actor);
  check('stale explanation version is rejected with 409', stale.status === 409, `status=${stale.status}`);

  const restored = await bible.addVerseExplanation({
    id: before.data.id,
    bookName: 'Genesis', chapter: 1, verseNumber: 1,
    bibleVersion: before.data.bibleVersion,
    exegesis: { explanationText: originalText, applicationText: originalApp },
    studyMetadata: before.data.studyMetadata,
    wordStudies: before.data.wordStudies,
    practicalApps: before.data.practicalApps,
    crossReferences: before.data.crossReferences,
    themes: before.data.themes,
    sharedStudyVersion: 2,
  }, actor);
  check('explanation restores with the new version', restored.status === 200, `status=${restored.status}`);
  const after = await bible.getVerseExplanation({ bookName: 'Genesis', chapter: 1, verseNumber: 1 });
  check('re-read reflects the shared content', after.data.exegesis.explanationText === originalText);
  check('re-read reports the latest version', after.data.sharedStudyVersion === 3,
    `version=${after.data.sharedStudyVersion}`);

  // ── Daily verse edit through writeDailyContent
  const dv = await prisma.dailyVerse.findUnique({ where: { id: 72n } });
  const dvRead = await bible.getDailyVerseByRef({ bookName: dv.bookName, chapter: Number(dv.chapter), verseNumber: Number(dv.verseNumber) });
  check('daily verse read hydrates shared version', dvRead.status === 200 && dvRead.data?.sharedStudyVersion === 1,
    `status=${dvRead.status} version=${dvRead.data?.sharedStudyVersion}`);
  const dvEdited = await admin.addDailyVerse({
    id: 72,
    bookName: dv.bookName,
    chapter: Number(dv.chapter),
    verseNumber: Number(dv.verseNumber),
    verseEnd: dv.verseEnd ? Number(dv.verseEnd) : null,
    bibleVersion: dv.bibleVersion,
    displayDate: dv.displayDate.toISOString().slice(0, 10),
    displayTime: dv.displayTime ? dv.displayTime.toISOString() : undefined,
    reflection: dv.reflection,
    explanation: `${dv.explanation || ''} [e2e]`,
    application: dv.application,
    verseIntroduction: dv.verseIntroduction,
    backgroundAuthor: dv.backgroundAuthor,
    backgroundBook: dv.backgroundBook,
    backgroundContext: dv.backgroundContext,
    wordStudies: dv.wordStudies,
    practicalApplications: dv.practicalApplications,
    keyThemes: dv.keyThemes,
    crossReferences: dv.crossReferences,
    finalThoughts: dv.finalThoughts,
    takeaways: dv.takeaways,
    published: dv.isPublished,
    sharedStudyVersion: 1,
  }, actor);
  check('daily verse edit succeeds with current version', dvEdited.status === 200,
    `status=${dvEdited.status} msg=${dvEdited.message}`);
  check('daily verse edit returns the incremented version', dvEdited.data?.sharedStudyVersion === 2,
    `version=${dvEdited.data?.sharedStudyVersion}`);
  const dvStale = await admin.addDailyVerse({
    id: 72, bookName: dv.bookName, chapter: Number(dv.chapter), verseNumber: Number(dv.verseNumber),
    bibleVersion: dv.bibleVersion, displayDate: dv.displayDate.toISOString().slice(0, 10),
    explanation: dv.explanation, published: dv.isPublished, sharedStudyVersion: 1,
  }, actor);
  check('stale daily verse version is rejected with 409', dvStale.status === 409, `status=${dvStale.status}`);

  // ── New daily verse creates and links a shared study
  const created = await admin.addDailyVerse({
    bookName: 'Genesis', chapter: 50, verseNumber: 20,
    bibleVersion: 'BSB', displayDate: '2030-12-31',
    explanation: 'E2E created shared study explanation with enough detail.',
    published: false,
  }, actor);
  check('new daily verse creates a shared study', created.status === 200 && created.data?.sharedStudyVersion === 1,
    `status=${created.status} version=${created.data?.sharedStudyVersion}`);
  const createdRow = await prisma.dailyVerse.findFirst({ where: { displayDate: new Date('2030-12-31T00:00:00.000Z') } });
  check('new daily verse is linked', createdRow?.sharedStudyId != null);

  // ── Devotion edit through writeDailyContent
  const dd = await prisma.dailyDevotion.findUnique({ where: { id: 2n } });
  const ddEdited = await admin.addDailyDevotion({
    id: 2,
    title: dd.title,
    content: dd.content,
    bookName: dd.bookName,
    chapter: dd.chapter ? Number(dd.chapter) : null,
    verseNumber: dd.verseNumber ? Number(dd.verseNumber) : null,
    bibleVersion: dd.bibleVersion,
    displayDate: dd.displayDate.toISOString().slice(0, 10),
    displayTime: dd.displayTime ? dd.displayTime.toISOString() : undefined,
    explanation: `${dd.explanation || ''} [e2e]`,
    application: dd.application,
    verseIntroduction: dd.verseIntroduction,
    learnMore: dd.learnMore,
    backgroundAuthor: dd.backgroundAuthor,
    backgroundBook: dd.backgroundBook,
    backgroundContext: dd.backgroundContext,
    wordStudies: dd.wordStudies,
    practicalApplications: dd.practicalApplications,
    keyThemes: dd.keyThemes,
    crossReferences: dd.crossReferences,
    finalThoughts: dd.finalThoughts,
    takeaways: dd.takeaways,
    published: dd.isPublished,
    sharedStudyVersion: 1,
  }, actor);
  check('devotion edit succeeds with current version', ddEdited.status === 200,
    `status=${ddEdited.status} msg=${ddEdited.message}`);
  check('devotion edit returns the incremented version', ddEdited.data?.sharedStudyVersion === 2,
    `version=${ddEdited.data?.sharedStudyVersion}`);

  // ── Removing a devotion passage unlinks without deleting the study
  const detached = await admin.addDailyDevotion({
    id: 2, title: dd.title, content: dd.content, bookName: null, chapter: null, verseNumber: null,
    displayDate: dd.displayDate.toISOString().slice(0, 10), published: dd.isPublished,
  }, actor);
  check('devotion without a passage still saves', detached.status === 200, `status=${detached.status}`);
  const detachedRow = await prisma.dailyDevotion.findUnique({ where: { id: 2n } });
  check('devotion without a passage is unlinked', detachedRow?.sharedStudyId == null);
  const studyStillExists = await prisma.passageStudy.findUnique({ where: { id: 48n } });
  check('unlinking keeps the shared study', Boolean(studyStillExists));

  // ── Admin list readers hydrate versions for editor round-trips
  const list = await admin.getAllDailyVerses({ page: 0, size: 5, search: 'Psalms' });
  check('admin daily verse list hydrates versions',
    list.status === 200 && Array.isArray(list.data?.content) &&
    list.data.content.some(row => typeof row.sharedStudyVersion === 'number'),
    `status=${list.status} rows=${list.data?.content?.length}`);
} catch (error) {
  console.error('E2E ERROR', error);
  results.push({ name: 'unexpected error', pass: false, detail: error.message });
} finally {
  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  await prisma.$disconnect();
  process.exit(failed.length ? 1 : 0);
}