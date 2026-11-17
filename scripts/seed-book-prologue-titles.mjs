import 'dotenv/config';
import { prisma } from '../src/config/db.js';
import { backfillMissingOverviewTitles } from '../src/modules/book-prologues/titles.js';

try {
  const args = process.argv.slice(2);
  if (args.some(arg => !['--apply', '--dry-run'].includes(arg)) || (args.includes('--apply') && args.includes('--dry-run'))) throw new Error('Invalid arguments');
  const dryRun = !args.includes('--apply');
  const result = await backfillMissingOverviewTitles(prisma, { dryRun });
  console.log(JSON.stringify({ dryRun, ...result }));
} catch {
  console.error('Title backfill failed. Check DB connectivity; use --dry-run or --apply. Existing authored titles are never replaced.');
  process.exitCode = 1;
} finally { await prisma.$disconnect(); }
