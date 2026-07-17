/**
 * Backfill script for Strong's Dictionary verse references.
 *
 * This script scans all existing verse_word_studies and syncs the
 * `verseReferences` JSON field on the corresponding StrongsDictionary entries.
 *
 * Usage: node prisma/backfill-verse-references.js
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function backfill() {
  console.log('Backfilling verse references...\n');

  // 1. Find all distinct Strong's IDs that have verse word studies
  const grouped = await prisma.verseWordStudy.groupBy({
    by: ['strongsId'],
    _count: { id: true },
  });

  const totalIds = grouped.length;
  console.log(`Found ${totalIds} Strong's IDs with verse word studies.`);

  if (totalIds === 0) {
    console.log('Nothing to backfill — no verse word studies exist yet.');
    await prisma.$disconnect();
    return;
  }

  // 2. For each Strong's ID, fetch its studies and update verseReferences
  let syncedCount = 0;
  let totalVersesAttached = 0;

  for (const { strongsId, _count } of grouped) {
    const studies = await prisma.verseWordStudy.findMany({
      where: { strongsId },
      select: {
        bookName: true,
        chapter: true,
        verse: true,
        translation: true,
        surfaceText: true,
        adminExplanation: true,
      },
      orderBy: [{ bookName: 'asc' }, { chapter: 'asc' }, { verse: 'asc' }],
    });

    const references = studies.map((s) => ({
      bookName: s.bookName,
      chapter: s.chapter,
      verse: s.verse,
      translation: s.translation,
      surfaceText: s.surfaceText || null,
      adminExplanation: s.adminExplanation || null,
    }));

    // Use updateMany to handle cases where the strongsId doesn't exist in the dictionary
    // (e.g., orphaned verse_word_studies records). This silently skips missing entries.
    await prisma.strongsDictionary.updateMany({
      where: { strongsId },
      data: { verseReferences: references.length > 0 ? references : null },
    });

    syncedCount++;
    totalVersesAttached += references.length;

    if (syncedCount <= 5 || syncedCount % 50 === 0) {
      console.log(`  [${syncedCount}/${totalIds}] ${strongsId} → ${references.length} verse reference${references.length !== 1 ? 's' : ''}`);
    }
  }

  // 3. Summary
  console.log(`\n✅ Backfill complete!`);
  console.log(`   ${syncedCount} Strong's entries updated`);
  console.log(`   ${totalVersesAttached} total verse references synced`);

  await prisma.$disconnect();
}

backfill().catch((e) => {
  console.error('Backfill failed:', e);
  process.exit(1);
});
