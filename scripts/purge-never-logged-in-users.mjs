/**
 * purge-never-logged-in-users.mjs
 *
 * Soft-deletes every account that has never completed a login AND meets
 * all of the following criteria:
 *   - lastLogin IS NULL
 *   - loginCount = 0
 *   - emailVerified = false   (verified accounts are always kept)
 *   - createdOn < 24 hours ago (accounts created today/yesterday are kept)
 *   - accountStatus != 'deleted'
 *   - deletedAt IS NULL
 *
 * Safety rules
 * ─────────────
 * • DRY-RUN by default.  Pass --execute to perform real deletions.
 * • Email-verified accounts are NEVER deleted regardless of login state.
 * • Accounts created within the last 24 hours are ALWAYS kept.
 * • Users with a paid subscription tier are SKIPPED regardless of --execute.
 * • Admin accounts (userRole = 1) are SKIPPED automatically.
 * • Stripe accounts (free tier, never logged in, unverified) are included
 *   when --include-stripe is passed; the full deleteUserAccount() flow runs
 *   so the Stripe customer is cancelled and anonymized cleanly.
 * • Progress is printed to stdout and a full report is written to
 *   scripts/purge-never-logged-in-report.json when --execute is used.
 *
 * Usage
 * ─────
 * Dry run (safe, no writes):
 *   node scripts/purge-never-logged-in-users.mjs
 *
 * Dry run including Stripe accounts:
 *   node scripts/purge-never-logged-in-users.mjs --include-stripe
 *
 * Real deletion — free accounts only:
 *   node scripts/purge-never-logged-in-users.mjs --execute
 *
 * Real deletion — including Stripe accounts (cancels + anonymizes customer):
 *   node scripts/purge-never-logged-in-users.mjs --execute --include-stripe
 */

import 'dotenv/config';
import { createWriteStream } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { deleteUserAccount, ACCOUNT_DELETE_SOURCES } from '../src/services/accountDeletion.js';

const DRY_RUN = !process.argv.includes('--execute');
const INCLUDE_STRIPE = process.argv.includes('--include-stripe');
const ADMIN_ROLE = 1n;
// Accounts created within this window are always kept.
const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000;
// Process in batches to avoid holding thousands of rows in memory at once.
const BATCH_SIZE = 50;

const __filename = fileURLToPath(import.meta.url);
const __dir = dirname(__filename);

const prisma = new PrismaClient({ log: ['error'] });

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) => n.toLocaleString();

const userLabel = (u) =>
  `[${u.id}] ${u.email} (created ${u.createdOn.toISOString().slice(0, 10)})`;

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const cutoff = new Date(Date.now() - GRACE_PERIOD_MS);

  console.log('');
  console.log('══════════════════════════════════════════════════════');
  console.log(' Purge never-logged-in users');
  console.log(` Mode           : ${DRY_RUN ? '🔍 DRY RUN — no changes will be made' : '⚠️  EXECUTE — accounts will be deleted'}`);
  console.log(` Stripe accounts: ${INCLUDE_STRIPE ? 'included (--include-stripe)' : 'skipped (pass --include-stripe to include)'}`);
  console.log(` Keeping accounts created after: ${cutoff.toISOString().slice(0, 16)} UTC`);
  console.log('══════════════════════════════════════════════════════');
  console.log('');

  // ── 1. Count and preview ────────────────────────────────────────────────────

  const baseWhere = {
    lastLogin: null,
    loginCount: 0n,
    emailVerified: false,         // verified accounts are always kept
    createdOn: { lt: cutoff },    // accounts < 24 h old are always kept
    accountStatus: { not: 'deleted' },
    deletedAt: null,
  };

  const totalCandidates = await prisma.systemUser.count({ where: baseWhere });
  console.log(`Total candidates (never logged in, unverified, older than 24 h): ${fmt(totalCandidates)}`);

  if (totalCandidates === 0) {
    console.log('\n✅ No matching accounts found. Nothing to do.');
    return;
  }

  // Informational counts for the operator.
  const withStripe = await prisma.systemUser.count({
    where: { ...baseWhere, stripeCustomerId: { not: null } },
  });
  const paidTier = await prisma.systemUser.count({
    where: { ...baseWhere, subscriptionTier: { not: 'free' } },
  });
  const adminAccounts = await prisma.systemUser.count({
    where: { ...baseWhere, userRole: ADMIN_ROLE },
  });

  // The set that will actually be deleted.
  const safeWhere = {
    ...baseWhere,
    subscriptionTier: 'free',
    userRole: { not: ADMIN_ROLE },
    ...(!INCLUDE_STRIPE && { stripeCustomerId: null }),
  };
  const safeCount = await prisma.systemUser.count({ where: safeWhere });

  console.log('');
  console.log('── Breakdown ─────────────────────────────────────────');
  console.log(`  With Stripe customer record : ${fmt(withStripe)}  ← ${INCLUDE_STRIPE ? 'INCLUDED (--include-stripe)' : 'SKIPPED (pass --include-stripe to include)'}`);
  console.log(`  With paid subscription tier : ${fmt(paidTier)}  ← SKIPPED`);
  console.log(`  Admin accounts (role=1)      : ${fmt(adminAccounts)}  ← SKIPPED`);
  console.log('  ─────────────────────────────────────────────────');
  console.log(`  Will be deleted              : ${fmt(safeCount)}`);
  console.log('');

  const sample = await prisma.systemUser.findMany({
    where: safeWhere,
    select: { id: true, email: true, createdOn: true, subscriptionTier: true },
    orderBy: { createdOn: 'asc' },
    take: 10,
  });
  console.log(`── Accounts to delete (up to 10 oldest) ${'─'.repeat(14)}`);
  for (const u of sample) {
    console.log(`  ${userLabel(u)}`);
  }
  if (safeCount > 10) console.log(`  … and ${fmt(safeCount - 10)} more`);
  console.log('');

  if (DRY_RUN) {
    console.log('──────────────────────────────────────────────────────');
    console.log(`DRY RUN complete. ${fmt(safeCount)} account(s) would be soft-deleted.`);
    console.log('');
    console.log('Re-run with --execute to apply:');
    console.log(`  node scripts/purge-never-logged-in-users.mjs --execute${INCLUDE_STRIPE ? ' --include-stripe' : ''}`);
    if (!INCLUDE_STRIPE && withStripe > 0) {
      console.log('');
      console.log(`To also include the ${fmt(withStripe)} Stripe account(s), add --include-stripe:`);
      console.log('  node scripts/purge-never-logged-in-users.mjs --execute --include-stripe');
    }
    console.log('');
    return;
  }

  if (safeCount === 0) {
    console.log('✅ No accounts to delete after exclusions. Nothing to do.');
    return;
  }

  // ── 2. Process in batches ───────────────────────────────────────────────────

  const report = {
    startedAt: new Date().toISOString(),
    cutoff: cutoff.toISOString(),
    includeStripe: INCLUDE_STRIPE,
    totalCandidates,
    skippedStripe: INCLUDE_STRIPE ? 0 : withStripe,
    skippedPaid: paidTier,
    skippedAdmin: adminAccounts,
    deleted: [],
    failed: [],
  };

  let deletedCount = 0;
  let failedCount = 0;
  let cursor = undefined;

  console.log(`Starting deletion of ${fmt(safeCount)} account(s)…`);
  console.log('');

  while (true) {
    const batch = await prisma.systemUser.findMany({
      where: safeWhere,
      orderBy: { id: 'asc' },
      take: BATCH_SIZE,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    if (batch.length === 0) break;

    for (const user of batch) {
      try {
        await deleteUserAccount({
          user,
          deletedBy: 'system-cleanup',
          source: ACCOUNT_DELETE_SOURCES.ADMIN,
        });
        deletedCount++;
        report.deleted.push({ id: user.id, email: user.email, createdOn: user.createdOn });
        process.stdout.write(`  ✓ deleted ${userLabel(user)}\n`);
      } catch (err) {
        failedCount++;
        report.failed.push({ id: user.id, email: user.email, error: err.message });
        process.stdout.write(`  ✗ FAILED  ${userLabel(user)} — ${err.message}\n`);
      }
    }

    cursor = batch[batch.length - 1].id;

    // Brief pause between batches to keep the connection pool comfortable.
    await new Promise((r) => setTimeout(r, 200));
  }

  // ── 3. Summary ───────────────────────────────────────────────────────────────

  report.finishedAt = new Date().toISOString();
  report.deletedCount = deletedCount;
  report.failedCount = failedCount;

  const reportPath = join(__dir, 'purge-never-logged-in-report.json');
  const ws = createWriteStream(reportPath, { encoding: 'utf-8' });
  ws.end(JSON.stringify(report, null, 2));

  console.log('');
  console.log('══════════════════════════════════════════════════════');
  console.log(` Done.`);
  console.log(`  Deleted : ${fmt(deletedCount)}`);
  console.log(`  Failed  : ${fmt(failedCount)}`);
  console.log(`  Report  : ${reportPath}`);
  console.log('══════════════════════════════════════════════════════');
  console.log('');

  if (failedCount > 0) process.exit(1);
}

main()
  .catch((err) => {
    console.error('\n❌ Fatal error:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
