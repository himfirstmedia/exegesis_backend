/** Derive a heading from existing editorial metadata; never invent new prose. */
export function defaultOverviewTitle({ bookName, keyTheme }) {
  const theme = typeof keyTheme === 'string' ? keyTheme.replace(/\s+/g, ' ').trim() : '';
  return theme && `${bookName}: ${theme}`.length <= 300 ? `${bookName}: ${theme}` : `${bookName} overview`;
}

export async function backfillMissingOverviewTitles(prisma, { dryRun = false } = {}) {
  const rows = await prisma.bookPrologue.findMany({ select: { bookName: true, title: true, keyTheme: true } });
  const missing = rows.filter(row => !row.title?.trim());
  let updated = 0;
  for (const row of missing) {
    if (dryRun) continue;
    // Compare-and-set: do not overwrite a title saved by an editor after this read.
    const result = await prisma.bookPrologue.updateMany({ where: { bookName: row.bookName, title: row.title }, data: { title: defaultOverviewTitle(row) } });
    updated += result.count;
  }
  return { missing: missing.length, updated, preserved: rows.length - missing.length };
}
