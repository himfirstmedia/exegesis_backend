import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { PrismaClient } from '@prisma/client';

const manifest = JSON.parse(await readFile(
  new URL('./data/verse-explanation-strongs.json', import.meta.url), 'utf8',
));
const apply = process.argv.includes('--apply');
const prisma = new PrismaClient();
const select = {
  bookName: true, chapter: true, verseNumber: true, verseEnd: true,
  sharedStudy: { select: {
    id: true, version: true,
    _count: { select: { explanations: true, dailyVerses: true, devotions: true } },
    words: { select: { id: true, sortOrder: true, surfaceText: true, strongLinks: { select: { strongsId: true } } } },
  } },
};

function plan(explanations) {
  const result = { wordsToLink: 0, existing: 0, notes: 0, unresolved: [], touched: [], links: [], identifiers: new Set() };
  for (const { bookName, chapter, verseNumber, verseEnd, sharedStudy } of explanations) {
    const ref = `${bookName} ${chapter}:${verseNumber}`;
    if (!sharedStudy) {
      result.unresolved.push(`${ref}: no shared study`);
      continue;
    }
    const missing = sharedStudy.words.filter(word => !word.strongLinks.length);
    result.existing += sharedStudy.words.length - missing.length;
    // A range, newly shared explanation, or devotion must be reviewed separately.
    if (missing.length && ((verseEnd != null && verseEnd !== verseNumber) ||
      sharedStudy._count.explanations !== 1 || sharedStudy._count.devotions > 0)) {
      result.unresolved.push(`${ref}: unexpected passage or study ownership`);
      continue;
    }
    const review = manifest[ref] ?? [];
    let affected = false;
    for (const word of missing) {
      const label = word.surfaceText.trim();
      const matches = review.filter(([order, surface]) => word.sortOrder === order && label === surface);
      const ids = matches.length === 1 ? matches[0][2] : null;
      if (!ids || ids.some(id => !/^H\d+$/.test(id))) {
        result.unresolved.push(`${ref}, word ${word.sortOrder + 1}: ${label}`);
        continue;
      }
      if (!ids.length) {
        result.notes++;
        continue;
      }
      result.wordsToLink++;
      affected = true;
      for (const strongsId of new Set(ids)) {
        result.identifiers.add(strongsId);
        result.links.push({ studyWordId: word.id, strongsId });
      }
    }
    if (affected) result.touched.push({
      id: sharedStudy.id, version: sharedStudy.version, key: `${bookName}:${chapter}:${verseNumber}`,
      linkedDailyVerses: sharedStudy._count.dailyVerses,
    });
  }
  return result;
}

let cache;
try {
  const { hostname, port, pathname } = new URL(process.env.DATABASE_URL);
  console.log(`${apply ? 'Apply' : 'Dry run'}: ${hostname}${port ? `:${port}` : ''}${pathname}`);
  const result = await prisma.$transaction(async tx => {
    const explanations = await tx.verseExplanation.findMany({ select });
    const result = plan(explanations);
    console.log({
      explanations: explanations.length, existing: result.existing,
      wordsToLink: result.wordsToLink, linksToAdd: result.links.length, notes: result.notes,
      linkedDailyVerses: result.touched.reduce((n, row) => n + row.linkedDailyVerses, 0),
    });
    if (result.unresolved.length) {
      console.error('Unreviewed rows:', result.unresolved);
      if (apply) throw new Error('Review unmatched rows before applying this backfill.');
      process.exitCode = 1;
    }
    if (!apply || !result.links.length) return result;

    // The editor relies on optimistic locking. Only advance versions if the
    // same studies are still current; a conflict rolls the whole repair back.
    const updated = await tx.passageStudy.updateMany({
      where: { OR: result.touched.map(({ id, version }) => ({ id, version })) },
      data: { version: { increment: 1 } },
    });
    if (updated.count !== result.touched.length) throw new Error('A study changed; rerun the dry run.');
    await tx.strongsIdentifier.createMany({
      data: [...result.identifiers].map(id => ({ id })), skipDuplicates: true,
    });
    const inserted = await tx.studyWordStrong.createMany({ data: result.links });
    if (inserted.count !== result.links.length) throw new Error('Unexpected link count; rolling back.');
    return result;
  }, { isolationLevel: 'Serializable', timeout: 60000 });

  if (apply) {
    const verified = plan(await prisma.verseExplanation.findMany({ select }));
    if (verified.wordsToLink || verified.unresolved.length) {
      throw new Error('Post-commit verification found missing or unreviewed links; rerun the dry run.');
    }
    console.log(`Verified ${verified.existing} linked word rows and ${verified.notes} non-lexical notes.`);
    if (result.touched.length && (process.env.REDIS_URL || process.env.REDIS_HOST)) {
      ({ cache } = await import('../src/services/cacheService.js'));
      if (await cache.waitUntilReady()) {
        for (let i = 0; i < result.touched.length; i += 20) {
          await Promise.all(result.touched.slice(i, i + 20).flatMap(({ key }) => [
            cache.del('bible', `explanation-detailed:v4:${key}`),
            cache.del('verse-resources', key),
          ]));
        }
      } else {
        console.warn('Redis unavailable; public reads may be stale until the cache expires.');
      }
    }
  }
} finally {
  cache?.disconnect();
  await prisma.$disconnect();
}
