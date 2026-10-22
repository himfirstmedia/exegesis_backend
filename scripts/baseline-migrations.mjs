#!/usr/bin/env node
/**
 * Baseline an existing database onto the migration chain.
 *
 * The production database was created with `prisma db push`, which applies
 * the schema directly and records no migration history. `prisma migrate
 * deploy` therefore has nothing to compare against and would try to replay
 * the whole chain against a database that already has every table.
 *
 * This script records the migrations that the existing database already
 * reflects, so that only the genuinely new migrations run from now on.
 * It is safe to run more than once: if the database already has migration
 * history, it does nothing.
 *
 * Usage: node scripts/baseline-migrations.mjs [--dry-run]
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..');
const migrationsDir = path.join(backendRoot, 'prisma/migrations');
const configFile = path.join(migrationsDir, 'baseline.json');

const dryRun = process.argv.includes('--dry-run');

if (!fs.existsSync(configFile)) {
  console.error(`Missing ${configFile}. It must list the migrations the live database already has.`);
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
const appliedThrough = config.appliedThrough;

const allMigrations = fs
  .readdirSync(migrationsDir)
  .filter((name) => fs.statSync(path.join(migrationsDir, name)).isDirectory())
  .sort();

if (!allMigrations.includes(appliedThrough)) {
  console.error(`baseline.json names "${appliedThrough}", which is not a migration directory.`);
  process.exit(1);
}

const cutOffIndex = allMigrations.indexOf(appliedThrough);
const alreadyApplied = allMigrations.slice(0, cutOffIndex + 1);
const pending = allMigrations.slice(cutOffIndex + 1);

console.log(`Migrations already reflected in the live database: ${alreadyApplied.length}`);
console.log(`Migrations that will run: ${pending.join(', ') || '(none)'}`);

if (dryRun) {
  console.log('\nDry run — nothing was recorded.');
  process.exit(0);
}

const prismaBin = path.join(backendRoot, 'node_modules/.bin/prisma');

for (const migration of alreadyApplied) {
  try {
    execFileSync(prismaBin, ['migrate', 'resolve', '--applied', migration], {
      cwd: backendRoot,
      stdio: 'pipe',
    });
    console.log(`  recorded ${migration}`);
  } catch (error) {
    const output = `${error.stdout || ''}${error.stderr || ''}`;
    if (output.includes('already recorded') || output.includes('P3014')) {
      console.log(`  ${migration} was already recorded`);
      continue;
    }
    console.error(`Failed to record ${migration}:\n${output}`);
    process.exit(1);
  }
}

console.log('\nBaseline complete. Run `npm run db:deploy` to apply the pending migrations.');
