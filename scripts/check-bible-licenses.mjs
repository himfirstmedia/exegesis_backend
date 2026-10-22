#!/usr/bin/env node
/**
 * Licence gate for the Bible translations the backend ships.
 *
 * Every XML in the shipped directory must have a reviewed licence record in
 * `src/modules/bible-translations/licensing.js`. A translation whose licence
 * grants redistribution must say so in the record; anything else is a
 * blocker for a production launch.
 *
 * Usage: node scripts/check-bible-licenses.mjs
 * Exits non-zero when a licence is missing or a translation is not
 * redistributable.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..');
const xmlDir = path.join(
  backendRoot,
  'src/modules/bible-translations/Holy-Bible-XML-Format',
);
const licensingModule = path.join(
  backendRoot,
  'src/modules/bible-translations/licensing.js',
);

// The registry is plain ESM without side effects, so it can be imported.
const {
  TRANSLATION_LICENSES,
  LICENSE_TYPES,
  REVIEWED_PERMISSION_TRANSLATIONS,
} = await import(licensingModule);

const REDISTRIBUTABLE = new Set([
  LICENSE_TYPES.PUBLIC_DOMAIN,
  LICENSE_TYPES.ATTRIBUTION,
  LICENSE_TYPES.PERMISSION,
]);

const problems = [];

if (!fs.existsSync(xmlDir)) {
  console.error(`Bible XML directory not found: ${xmlDir}`);
  process.exit(1);
}

const files = fs
  .readdirSync(xmlDir)
  .filter((name) => name.endsWith('.xml'))
  .sort();

for (const fileName of files) {
  const fileId = fileName.replace(/\.xml$/, '');
  const record = TRANSLATION_LICENSES[fileId];

  if (!record) {
    problems.push(`${fileName}: no licence record in licensing.js`);
    continue;
  }

  if (!Object.values(LICENSE_TYPES).includes(record.license)) {
    problems.push(
      `${fileName}: unknown licence type "${record.license}" ` +
        `(expected one of ${Object.values(LICENSE_TYPES).join(', ')})`,
    );
    continue;
  }

  if (!REDISTRIBUTABLE.has(record.license)) {
    problems.push(
      `${fileName}: licence "${record.license}" does not grant redistribution`,
    );
  }

  if (
    (record.license === LICENSE_TYPES.ATTRIBUTION ||
      record.license === LICENSE_TYPES.PERMISSION) &&
    !record.attribution
  ) {
    problems.push(
      `${fileName}: licence "${record.license}" requires an attribution string`,
    );
  }

  // A permission-based translation needs an explicit, reviewed entry so a new
  // one cannot be added to the catalogue without a signed agreement.
  if (
    record.license === LICENSE_TYPES.PERMISSION &&
    !REVIEWED_PERMISSION_TRANSLATIONS.has(fileId)
  ) {
    problems.push(
      `${fileName}: permission-based licence without a reviewed entry in ` +
        'REVIEWED_PERMISSION_TRANSLATIONS',
    );
  }
}

// Every licence record must point at a file that actually ships, so the
// registry cannot drift out of sync with the directory.
for (const fileId of Object.keys(TRANSLATION_LICENSES)) {
  if (!files.includes(`${fileId}.xml`)) {
    problems.push(
      `licensing.js: "${fileId}" is registered but ${fileId}.xml is not shipped`,
    );
  }
}

if (problems.length > 0) {
  console.error('Bible licence check failed:\n');
  for (const problem of problems) {
    console.error(`  - ${problem}`);
  }
  console.error(
    `\n${problems.length} problem(s). Review the licence of each translation ` +
      'before shipping it, and record it in src/modules/bible-translations/licensing.js.',
  );
  process.exit(1);
}

const counts = {};
for (const fileName of files) {
  const fileId = fileName.replace(/\.xml$/, '');
  const type = TRANSLATION_LICENSES[fileId].license;
  counts[type] = (counts[type] || 0) + 1;
}

const summary = Object.entries(counts)
  .map(([type, count]) => `${type}=${count}`)
  .join(' ');

console.log(`Bible licence check passed: ${files.length} translations (${summary}).`);
