import 'dotenv/config';
import fs from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { CANONICAL_BOOK_ORDER } from '../src/constants/bible-books.js';
import { COLLECTIONS, SCALARS, jsonSafe, sourceHash, normalizeSource, mergeStudy } from '../src/modules/shared-study/normalization.js';

const url = new URL(process.env.DATABASE_URL);
if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.pathname !== '/exegesis') throw new Error('This backfill only supports the local exegesis database');
const apply = process.argv.includes('--apply');
const reportPath = process.argv.find(arg => arg.startsWith('--report='))?.slice(9);
if (!reportPath) throw new Error('Provide --report=/absolute/path/outside/repository.json');
if (!reportPath.startsWith('/tmp/opencode/')) throw new Error('Reports must stay in approved private temporary storage');
const prisma = new PrismaClient();
const report = { mode: apply ? 'apply' : 'dry-run', totals: {}, statuses: {}, groups: 0, unresolvedDictionaryIds: [], sources: [] };

async function run(tx) {
  // Lock both receipts and sources for the duration of a local backfill.
  if (apply) {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(716001)`;
    await tx.$executeRawUnsafe('LOCK TABLE daily_verse, daily_devotion, verse_explanations IN SHARE ROW EXCLUSIVE MODE');
  }
  const explanations = await tx.verseExplanation.findMany({ orderBy: { id: 'asc' }, include: {
    exegesis: true, studyMetadata: true, wordStudies: { orderBy: { sortOrder: 'asc' } },
    practicalApps: { orderBy: { sortOrder: 'asc' } }, crossReferences: { orderBy: { sortOrder: 'asc' } }, themes: { orderBy: { sortOrder: 'asc' } },
  } });
  const verses = await tx.dailyVerse.findMany({ orderBy: { id: 'asc' } });
  const devotions = await tx.dailyDevotion.findMany({ orderBy: { id: 'asc' } });
  report.totals = { explanation: explanations.length, verse: verses.length, devotion: devotions.length };
  const sources = [...explanations.map(row => ({ type: 'explanation', row })), ...verses.map(row => ({ type: 'verse', row })), ...devotions.map(row => ({ type: 'devotion', row }))];
  const existingReceipts = await tx.studyMigrationSource.findMany();
  const receipts = new Map(existingReceipts.map(receipt => [`${receipt.sourceType}:${receipt.sourceId}`, receipt]));
  const knownIds = new Set((await tx.strongsDictionary.findMany({ select: { strongsId: true } })).map(row => row.strongsId));
  const groups = new Map();
  for (const source of sources) {
    const original = jsonSafe(source.row); delete original.sharedStudyId;
    const hash = sourceHash(source.row);
    const previous = receipts.get(`${source.type}:${source.row.id}`);
    if (previous && previous.sourceHash !== hash) throw new Error(`Source changed since backfill: ${source.type}:${source.row.id}. Review before rerunning.`);
    const normalized = normalizeSource(source.type, source.row);
    source.normalized = normalized; source.original = original; source.hash = hash;
    const missingIds = normalized.payload?.study.words.flatMap(word => word.strongsIds).filter(id => !knownIds.has(id)) || [];
    report.unresolvedDictionaryIds.push(...missingIds);
    if (normalized.status === 'LINKED') {
      const group = groups.get(normalized.key);
      if (!group) groups.set(normalized.key, { ...normalized.payload, members: [source] });
      else {
        const { merged, conflicts } = mergeStudy(group.study, normalized.payload.study);
        if (conflicts.length) { normalized.status = 'CONFLICT'; normalized.issues.push(...conflicts.map(field => `conflicting field: ${field}`)); }
        else { group.study = merged; group.members.push(source); }
      }
    }
    report.statuses[normalized.status] = (report.statuses[normalized.status] || 0) + 1;
    report.sources.push({ type: source.type, id: String(source.row.id), status: normalized.status, issues: normalized.issues });
  }
  report.groups = groups.size;
  report.unresolvedDictionaryIds = [...new Set(report.unresolvedDictionaryIds)].sort();
  if (!apply) return;
  for (let i = 0; i < CANONICAL_BOOK_ORDER.length; i++) await tx.bibleBook.upsert({ where: { id: i + 1 }, update: {}, create: { id: i + 1, name: CANONICAL_BOOK_ORDER[i] } });
  async function passage(data) { return tx.scripturePassage.upsert({ where: { bookId_startChapter_startVerse_endChapter_endVerse: data }, create: data, update: {} }); }
  async function edition(id) { return tx.bibleEdition.upsert({ where: { id }, update: {}, create: { id, name: id } }); }
  for (const group of groups.values()) {
    const ref = await passage(group.passage); await edition(group.edition);
    const identity = { passageId: ref.id, bibleEditionId: group.edition, languageCode: group.language };
    const old = await tx.passageStudy.findUnique({ where: { passageId_bibleEditionId_languageCode: identity } });
    const alreadyMigrated = group.members.every(source => receipts.has(`${source.type}:${source.row.id}`));
    let study = old;
    if (old && !alreadyMigrated) throw new Error('Existing shared study needs explicit reconciliation; refusing overwrite');
    if (!old) {
      study = await tx.passageStudy.create({ data: { ...identity, status: 'REVIEW', ...Object.fromEntries(SCALARS.map(field => [field, group.study[field]])) } });
      for (const [field, table] of [['takeaways', 'studyTakeaway'], ['practicalApplications', 'studyPracticalApplication'], ['themes', 'studyTheme']]) {
        if (group.study[field].length) await tx[table].createMany({ data: group.study[field].map((text, sortOrder) => ({ studyId: study.id, text, sortOrder })) });
      }
      for (const word of group.study.words) for (const id of word.strongsIds) await tx.strongsIdentifier.upsert({ where: { id }, update: {}, create: { id, dictionaryId: knownIds.has(id) ? id : null } });
      for (const [sortOrder, word] of group.study.words.entries()) await tx.studyWord.create({ data: { studyId: study.id, surfaceText: word.surfaceText, contextualMeaning: word.contextualMeaning, sortOrder,
        strongLinks: { create: word.strongsIds.map(strongsId => ({ strongsId })) },
      } });
      for (const [sortOrder, reference] of group.study.crossReferences.entries()) {
        const target = await passage(reference.passage);
        await tx.studyCrossReference.create({ data: { studyId: study.id, passageId: target.id, bibleEditionId: group.edition, quotationOverride: reference.quotationOverride, commentary: reference.commentary, sortOrder } });
      }
    }
    group.id = study.id;
    for (const source of group.members) {
      const table = { explanation: 'verseExplanation', verse: 'dailyVerse', devotion: 'dailyDevotion' }[source.type];
      await tx[table].update({ where: { id: source.row.id }, data: { sharedStudyId: study.id,
        // Preserve daily @updatedAt timestamps: a link is not an editorial edit.
        ...(source.type !== 'explanation' ? { updatedOn: source.row.updatedOn } : {}),
      } });
    }
  }
  for (const source of sources) {
    const group = source.normalized.key && groups.get(source.normalized.key);
    await tx.studyMigrationSource.upsert({ where: { sourceType_sourceId: { sourceType: source.type, sourceId: source.row.id } }, update: {}, create: {
      sourceType: source.type, sourceId: source.row.id, sourceHash: source.hash, original: source.original,
      status: source.normalized.status, issues: source.normalized.issues, studyId: group?.id || null,
    } });
  }
}
try {
  await prisma.$transaction(run, { timeout: 120000, maxWait: 10000, isolationLevel: 'Serializable' });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), { mode: 0o600 });
  console.log(JSON.stringify({ mode: report.mode, totals: report.totals, statuses: report.statuses, sharedStudies: report.groups, report: reportPath }, null, 2));
} finally { await prisma.$disconnect(); }
