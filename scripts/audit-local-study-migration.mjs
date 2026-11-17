import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { jsonSafe, normalizeSource, same, sourceHash } from '../src/modules/shared-study/normalization.js';
import { studyDocument, studyInclude } from '../src/modules/shared-study/repository.js';

const url = new URL(process.env.DATABASE_URL);
if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || url.pathname !== '/exegesis') throw new Error('Audit only supports the local exegesis database');
const reportPath = process.argv.find(arg => arg.startsWith('--report='))?.slice(9);
if (!reportPath || !reportPath.startsWith('/tmp/opencode/')) throw new Error('Provide --report=/tmp/opencode/<private-report>.json');
const prisma = new PrismaClient();
const children = ['wordStudies', 'practicalApps', 'crossReferences', 'themes'];
const include = { exegesis: true, studyMetadata: true,
  ...Object.fromEntries(children.map(field => [field, { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }])),
};
const tieStable = row => {
  const result = jsonSafe(row);
  delete result.sharedStudyId;
  for (const field of children) if (Array.isArray(result[field])) result[field].sort((a, b) =>
    Number(a.sortOrder) - Number(b.sortOrder) || (BigInt(a.id) < BigInt(b.id) ? -1 : BigInt(a.id) > BigInt(b.id) ? 1 : 0));
  return result;
};
const canonicalDocument = document => {
  for (const word of document.words) word.strongsIds.sort();
  return document;
};
try {
  const report = await prisma.$transaction(async tx => {
    await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
    const migrations = await tx.$queryRawUnsafe('SELECT migration_name, checksum, finished_at, rolled_back_at FROM _prisma_migrations ORDER BY started_at');
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../prisma/migrations');
    const migrationIssues = [];
    for (const migration of migrations) {
      if (migration.rolled_back_at) continue;
      const name = migration.migration_name;
      if (!migration.finished_at) migrationIssues.push({ name, issue: 'unfinished migration' });
      const file = path.join(root, name, 'migration.sql');
      if (!fs.existsSync(file)) migrationIssues.push({ name, issue: 'missing migration file' });
      else if (createHash('sha256').update(fs.readFileSync(file)).digest('hex') !== migration.checksum) migrationIssues.push({ name, issue: 'applied checksum differs from file' });
    }
    const appliedNames = new Set(migrations.filter(row => row.finished_at && !row.rolled_back_at).map(row => row.migration_name));
    for (const entry of fs.readdirSync(root, { withFileTypes: true })) if (entry.isDirectory() && fs.existsSync(path.join(root, entry.name, 'migration.sql')) && !appliedNames.has(entry.name)) {
      migrationIssues.push({ name: entry.name, issue: 'unapplied migration' });
    }
    const receipts = await tx.studyMigrationSource.findMany();
    const studies = await tx.passageStudy.findMany({ include: studyInclude });
    const byId = new Map(studies.map(study => [String(study.id), study]));
    const receiptMap = new Map(receipts.map(receipt => [`${receipt.sourceType}:${receipt.sourceId}`, receipt]));
    const groups = [['explanation', await tx.verseExplanation.findMany({ include })], ['verse', await tx.dailyVerse.findMany()], ['devotion', await tx.dailyDevotion.findMany()]];
    const statuses = {};
    const findings = [];
    const seen = new Set();
    for (const [type, rows] of groups) for (const row of rows) {
      const key = `${type}:${row.id}`;
      seen.add(key);
      const receipt = receiptMap.get(key);
      if (!receipt) { findings.push({ type, id: String(row.id), issue: 'source not inventoried' }); continue; }
      statuses[receipt.status] = (statuses[receipt.status] || 0) + 1;
      if (sourceHash(receipt.original) !== receipt.sourceHash) findings.push({ type, id: String(row.id), issue: 'archived evidence hash mismatch' });
      const normalized = normalizeSource(type, row);
      if (sourceHash(row) !== receipt.sourceHash) {
        const orderOnly = type === 'explanation' && same(tieStable(row), tieStable(receipt.original));
        const current = jsonSafe(row);
        delete current.sharedStudyId;
        findings.push({ type, id: String(row.id), issue: orderOnly ? 'tied child ordering only' : 'source changed after backfill',
          fields: Object.keys(current).filter(field => !same(current[field], receipt.original[field])) });
      }
      if (receipt.status !== 'LINKED') {
        findings.push({ type, id: String(row.id), issue: 'pending source review', status: receipt.status, details: receipt.issues });
        if (row.sharedStudyId != null) findings.push({ type, id: String(row.id), issue: 'pending source unexpectedly linked' });
        continue;
      }
      const study = row.sharedStudyId == null ? null : byId.get(String(row.sharedStudyId));
      if (!study) { findings.push({ type, id: String(row.id), issue: 'linked study missing' }); continue; }
      if (String(receipt.studyId) !== String(row.sharedStudyId)) findings.push({ type, id: String(row.id), issue: 'source link differs from migration receipt' });
      if (normalized.status !== 'LINKED') findings.push({ type, id: String(row.id), issue: 'linked source now invalid', details: normalized.issues });
      else {
        const live = canonicalDocument(normalized.payload.study);
        const stored = canonicalDocument(studyDocument(study));
        // An original source may contribute only a subset of the shared study.
        const populated = value => value != null && value !== '' && (!Array.isArray(value) || value.length > 0);
        const fields = Object.keys(live).filter(field => populated(live[field]) && !same(live[field], stored[field]));
        if (fields.length) findings.push({ type, id: String(row.id), issue: 'shared study differs from populated source fields', fields });
      }
    }
    for (const receipt of receipts) if (!seen.has(`${receipt.sourceType}:${receipt.sourceId}`)) findings.push({ type: receipt.sourceType, id: String(receipt.sourceId), issue: 'inventoried source missing' });
    return { checkedAt: new Date().toISOString(), target: 'localhost/exegesis', appliedMigrations: appliedNames.size,
      migrationIssues, sources: seen.size, receipts: receipts.length, sharedStudies: studies.length, statuses, findings,
      dataReady: !migrationIssues.length && !findings.some(finding => finding.issue !== 'tied child ordering only'),
      cutoverReady: false, cutoverBlocker: 'Feature readers/writers and dependent cache invalidation are not integrated',
    };
  }, { isolationLevel: 'RepeatableRead', timeout: 30000 });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
  console.log(JSON.stringify(report, null, 2));
  if (!report.dataReady || !report.cutoverReady) process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
