import { defaultOverviewTitle, backfillMissingOverviewTitles } from './titles.js';

test('derives a bounded title from existing metadata', () => {
  expect(defaultOverviewTitle({ bookName: 'Genesis', keyTheme: 'Creation\n and covenant' })).toBe('Genesis: Creation and covenant');
  expect(defaultOverviewTitle({ bookName: 'Genesis', keyTheme: 'x'.repeat(301) })).toBe('Genesis overview');
});
test('backfills only existing empty-title rows without overwriting editor changes or other content', async () => {
  const prisma = { bookPrologue: {
    findMany: jest.fn().mockResolvedValue([{ bookName: 'Genesis', title: null, keyTheme: 'Creation' }, { bookName: 'Exodus', title: 'Custom title' }]),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
  } };
  expect(await backfillMissingOverviewTitles(prisma, { dryRun: true })).toEqual({ missing: 1, updated: 0, preserved: 1 });
  expect(prisma.bookPrologue.updateMany).not.toHaveBeenCalled();
  expect(await backfillMissingOverviewTitles(prisma)).toEqual({ missing: 1, updated: 1, preserved: 1 });
  expect(prisma.bookPrologue.updateMany).toHaveBeenCalledWith({ where: { bookName: 'Genesis', title: null }, data: { title: 'Genesis: Creation' } });
});
