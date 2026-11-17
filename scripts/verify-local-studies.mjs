import 'dotenv/config';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import { hydrateStudies, studyDocument, writeStudy, studyInclude } from '../src/modules/shared-study/repository.js';
import { normalizeSource, sourceHash, same } from '../src/modules/shared-study/normalization.js';

const url = new URL(process.env.DATABASE_URL);
if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.pathname !== '/exegesis') {
  throw new Error('Verification only supports the local exegesis database');
}
const prisma = new PrismaClient();
const rollback = new Error('intentional verification rollback');
try {
  const receipts = await prisma.studyMigrationSource.findMany();
  const explanations = await prisma.verseExplanation.findMany({ include: {
    exegesis: true, studyMetadata: true, wordStudies: { orderBy: { sortOrder: 'asc' } },
    practicalApps: { orderBy: { sortOrder: 'asc' } }, crossReferences: { orderBy: { sortOrder: 'asc' } }, themes: { orderBy: { sortOrder: 'asc' } },
  } });
  const groups = [['explanation', explanations], ['verse', await prisma.dailyVerse.findMany()], ['devotion', await prisma.dailyDevotion.findMany()]];
  const bySource = new Map(receipts.map(receipt => [`${receipt.sourceType}:${receipt.sourceId}`, receipt]));
  let verified = 0;
  let legacy = 0;
  for (const [type, rows] of groups) {
    const projected = await hydrateStudies(prisma, type, rows);
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const receipt = bySource.get(`${type}:${row.id}`);
      assert.ok(receipt, `Missing source evidence: ${type}:${row.id}`);
      assert.equal(sourceHash(row), receipt.sourceHash, `Source changed: ${type}:${row.id}`);
      if (receipt.status !== 'LINKED') {
        assert.equal(row.sharedStudyId, null, `Pending source unexpectedly linked: ${type}:${row.id}`);
        assert.deepEqual(projected[index], row);
        legacy++;
        continue;
      }
      assert.ok(row.sharedStudyId);
      const normalized = normalizeSource(type, projected[index]);
      assert.equal(normalized.status, 'LINKED', `Projection invalid: ${type}:${row.id}`);
      for (const word of normalized.payload.study.words) word.strongsIds.sort();
      const shared = await prisma.passageStudy.findUnique({ where: { id: row.sharedStudyId }, include: studyInclude });
      assert.ok(same(normalized.payload.study, studyDocument(shared)), `DTO round-trip mismatch: ${type}:${row.id}`);
      verified++;
    }
  }
  assert.equal(verified + legacy, receipts.length, 'Source inventory changed');

  const original = groups.find(([type]) => type === 'verse')[1].find(row => row.sharedStudyId != null && (!row.verseEnd || row.verseEnd === row.verseNumber));
  assert.ok(original, 'No linked daily verse available for transactional verification');
  const sharedBefore = await prisma.passageStudy.findUnique({ where: { id: original.sharedStudyId }, include: studyInclude });
  const sourceBefore = sourceHash(original);
  const identifier = 'H99999999';
  const identifierBefore = await prisma.strongsIdentifier.findUnique({ where: { id: identifier } });
  try {
    await prisma.$transaction(async tx => {
      const projected = await hydrateStudies(tx, 'verse', original);
      // A second feature attaches to exactly the same study, not a copied one.
      const devotion = await tx.dailyDevotion.create({ data: {
        title: 'Temporary normalization verification', content: 'Temporary verification only',
        bookName: original.bookName, chapter: original.chapter, verseNumber: original.verseNumber,
        bibleVersion: original.bibleVersion, displayDate: original.displayDate,
        createdBy: original.createdBy, isPublished: false,
      } });
      const attached = await writeStudy(tx, 'devotion', devotion);
      assert.equal(attached.id, original.sharedStudyId);
      assert.equal(attached.version, sharedBefore.version, 'An equal/empty attachment must not rewrite the shared study');
      const linkedDevotion = await tx.dailyDevotion.findUnique({ where: { id: devotion.id } });
      assert.equal((await hydrateStudies(tx, 'devotion', linkedDevotion)).explanation, projected.explanation);
      const changed = { ...projected, explanation: 'Temporary rollback verification', wordStudies: JSON.stringify([
        { word: 'Test compound', strongs: `H1/${identifier}`, definition: 'Temporary contextual meaning' },
      ]) };
      const saved = await writeStudy(tx, 'verse', changed, { expectedVersion: sharedBefore.version, allowSharedEdit: true });
      assert.equal(saved.version, sharedBefore.version + 1);
      const inside = await hydrateStudies(tx, 'verse', original);
      assert.equal(inside.explanation, changed.explanation);
      assert.equal(JSON.parse(inside.wordStudies)[0].strongs, `H1/${identifier}`);
      assert.equal((await hydrateStudies(tx, 'devotion', linkedDevotion)).explanation, changed.explanation);
      await assert.rejects(writeStudy(tx, 'verse', changed, { expectedVersion: sharedBefore.version, allowSharedEdit: true }),
        error => error.status === 409 && error.issues.includes('version'));
      assert.equal(await tx.strongsDictionary.findUnique({ where: { strongsId: identifier } }), null);
      assert.equal((await tx.strongsIdentifier.findUnique({ where: { id: identifier } })).dictionaryId, null);
      await tx.dailyDevotion.delete({ where: { id: devotion.id } });
      assert.ok(await tx.passageStudy.findUnique({ where: { id: original.sharedStudyId } }), 'Deleting one feature must retain shared content');
      throw rollback;
    }, { timeout: 30000 });
  } catch (error) {
    if (error !== rollback) throw error;
  }
  assert.deepEqual(await prisma.passageStudy.findUnique({ where: { id: original.sharedStudyId }, include: studyInclude }), sharedBefore);
  assert.equal(sourceHash(await prisma.dailyVerse.findUnique({ where: { id: original.id } })), sourceBefore);
  assert.deepEqual(await prisma.strongsIdentifier.findUnique({ where: { id: identifier } }), identifierBefore);
  console.log(JSON.stringify({ verifiedSharedSources: verified, preservedPendingSources: legacy, evidenceHashes: receipts.length,
    crossFeatureReuse: 'passed', staleVersionRejected: 'passed', featureDeletionPreservesStudy: 'passed', transactionalRollback: 'passed', dictionaryNotFabricated: 'passed' }));
} finally {
  await prisma.$disconnect();
}
