import dotenv from 'dotenv';
import { execFile } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { isDeepStrictEqual } from 'node:util';
import { promisify } from 'node:util';
import { buildVerseIndex, parseExplanationDocument, referenceLabel } from '../src/modules/bible/verseExplanationImport.js';
import { extractExplanationPdfText } from '../src/modules/bible/verseExplanationPdf.js';
import { parseStrongsIds, strongsText } from '../src/modules/shared-study/normalization.js';
import { formatExplanationPreview } from '../src/modules/bible/verseExplanationPreview.js';
dotenv.config({ quiet: true });

const help = `Usage: npm run import:verse-explanations -- (--url "<public Google Docs link>" | --file "<export.txt or export.pdf>")
  [--range "Ecclesiastes 6:10-12" [--skip-missing]] [--summary | --json]
  [--apply [--admin-email "<active admin>"] [--yes]]

Preview is the default: no database is opened. Review the formatted content,
or use --summary for counts or --json for machine-readable output. Keep tab=
for tabbed Google Docs. For private docs, export a text file or a selectable-text
PDF and use --file. PDF support requires pdftohtml (Poppler).
--apply previews the content and asks for confirmation before writing to
DATABASE_URL. The default admin email is admin@gmail.com. Use --yes only
to skip confirmation for an unattended import.
Existing references are skipped. Local and remote PostgreSQL are supported.`;
const sourceLimit = 8 * 1024 * 1024;
const defaultAdminEmail = 'admin@gmail.com';
const loopback = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

function options(args) {
  const flags = new Set(['--apply', '--allow-remote', '--json', '--summary', '--yes', '--skip-missing']);
  const values = new Set(['--url', '--file', '--range', '--admin-email']);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if ((!flags.has(arg) && !values.has(arg)) || Object.hasOwn(out, arg)) throw new Error(`Unexpected argument: ${arg}`);
    if (flags.has(arg)) out[arg] = true;
    else {
      const value = args[++i];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}.`);
      out[arg] = value;
    }
  }
  if (Boolean(out['--url']) === Boolean(out['--file'])) throw new Error('Choose one source: --url or --file.');
  if (!out['--apply'] && (out['--allow-remote'] || out['--admin-email'] || out['--yes'])) throw new Error('Write options require --apply.');
  if ((out['--json'] || out['--summary']) && out['--apply']) throw new Error('--json and --summary are preview options only.');
  if (out['--json'] && out['--summary']) throw new Error('Choose --json or --summary, not both.');
  if (out['--skip-missing'] && !out['--range']) throw new Error('--skip-missing requires --range.');
  return out;
}

function docsExport(input) {
  const url = new URL(input);
  const match = /^\/document\/d\/([a-z0-9_-]+)(?:\/(?:edit|view|export))?\/?$/i.exec(url.pathname);
  if (url.origin !== 'https://docs.google.com' || url.username || url.password || !match) {
    throw new Error('Enter a Google Docs document link from docs.google.com.');
  }
  const target = new URL(`https://docs.google.com/document/d/${match[1]}/export?format=txt`);
  const tab = url.searchParams.get('tab');
  if (tab) {
    if (!/^t\.[a-z0-9_-]+$/i.test(tab)) throw new Error('Invalid Google Docs tab.');
    target.searchParams.set('tab', tab);
  }
  return target;
}

async function fetchDocument(input, signal) {
  const original = docsExport(input);
  const deadline = AbortSignal.any([signal, AbortSignal.timeout(30000)]);
  let url = original;
  for (let redirects = 0; redirects <= 3; redirects++) {
    const response = await fetch(url, { redirect: 'manual', signal: deadline });
    if ([301, 302, 303, 307, 308].includes(response.status) && response.headers.has('location')) {
      await response.body?.cancel();
      url = new URL(response.headers.get('location'), url);
      const isExportHost = url.protocol === 'https:' && !url.port &&
        /^doc-[a-z0-9-]+-docstext\.googleusercontent\.com$/.test(url.hostname) && url.pathname.startsWith('/export/');
      if (url.username || url.password || !(isExportHost || (url.origin === original.origin && url.pathname === original.pathname))) {
        throw new Error('The Google Doc is not publicly exportable. Download it as plain text and use --file.');
      }
      continue;
    }
    if (!response.ok || !response.headers.get('content-type')?.startsWith('text/plain')) {
      await response.body?.cancel();
      throw new Error(`Could not export the Google Doc as plain text (HTTP ${response.status}). Try --file.`);
    }
    const chunks = [];
    let size = 0;
    for await (const chunk of response.body) {
      size += chunk.length;
      if (size > sourceLimit) throw new Error('Source exceeds 8 MB. Import one chapter at a time.');
      chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('utf8');
  }
  throw new Error('Too many redirects while exporting the Google Doc.');
}

async function readDocument(args, signal) {
  if (args['--url']) return fetchDocument(args['--url'], signal);
  const path = resolve(args['--file']);
  const pdf = /\.pdf$/i.test(path);
  if (!pdf && !/\.txt$/i.test(path)) throw new Error('Choose a .txt file or a selectable-text .pdf.');
  const file = await stat(path).catch(error => {
    if (error.code === 'ENOENT') throw new Error(`File not found: ${path}`);
    throw error;
  });
  if (!file.isFile() || file.size > sourceLimit) throw new Error('Choose a document file of at most 8 MB.');
  if (!pdf) return readFile(path, { encoding: 'utf8', signal });
  let xml;
  try {
    ({ stdout: xml } = await promisify(execFile)('pdftohtml', ['-xml', '-stdout', '-i', '-noroundcoord', path], {
      encoding: 'utf8', timeout: 30000, maxBuffer: 20 * 1024 * 1024, signal,
    }));
  } catch (error) {
    if (signal.aborted) throw error;
    if (error.code === 'ENOENT') throw new Error('PDF import needs pdftohtml. Install the poppler-utils package or provide a .txt export.');
    throw new Error('Could not extract text from the PDF. Check that it is unlocked and has selectable text, or try a .txt export.');
  }
  return extractExplanationPdfText(xml);
}

function matchesSaved(record, entry) {
  const sections = ({ exegesis, studyMetadata, wordStudies, practicalApps, themes, crossReferences }) => ({
    exegesis: [exegesis?.explanationText, exegesis?.applicationText],
    metadata: ['introduction', 'backgroundAuthor', 'backgroundBook', 'backgroundContext', 'finalThoughts', 'takeaways']
      .map(key => key === 'takeaways' && typeof studyMetadata?.[key] === 'string' ? JSON.parse(studyMetadata[key]) : studyMetadata?.[key]),
    words: wordStudies?.map(w => [w.surfaceText, parseStrongsIds(strongsText(w)).sort(), w.customDefinition]),
    practical: practicalApps?.map(p => p.applicationText),
    themes: themes?.map(t => t.themeName),
    crossReferences: crossReferences?.map(r => [r.bookName, Number(r.chapter), Number(r.verseNumber), r.verseEnd ? Number(r.verseEnd) : null, r.referenceText, r.commentary]),
  });
  return record?.bibleVersion === entry.bibleVersion && Number(record.verseEnd ?? 0) === Number(entry.verseEnd ?? 0) &&
    isDeepStrictEqual(sections(record), sections(entry));
}

function configuredDatabase() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing.');
  const url = new URL(process.env.DATABASE_URL);
  if (!['postgresql:', 'postgres:'].includes(url.protocol)) throw new Error('DATABASE_URL must point to PostgreSQL.');
  return url;
}

async function confirmApply(entries, args, url, signal) {
  if (args['--yes']) return true;
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('Apply requires an interactive terminal. For unattended imports, use --apply --yes explicitly.');
  }
  const target = `${url.hostname}${url.port ? `:${url.port}` : ''}${url.pathname}`;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const destination = loopback.has(url.hostname) ? target : `REMOTE PostgreSQL (${target})`;
    const answer = await rl.question(`\nImport up to ${entries.length} explanation(s) to ${destination}? Existing verses will be skipped. Type yes to proceed: `, { signal });
    return answer.trim().toLowerCase() === 'yes';
  } finally { rl.close(); }
}

async function apply(entries, args, url, signal) {
  const { prisma } = await import('../src/config/db.js');
  let cache;
  try {
    const [target] = await prisma.$queryRaw`SELECT current_database() AS name, host(inet_server_addr()) AS address`;
    const local = loopback.has(url.hostname) && loopback.has(target?.address);
    console.log(`Writing to ${local ? 'LOCAL' : 'REMOTE'} PostgreSQL: ${url.hostname}/${target.name}`);
    const adminEmail = args['--admin-email']?.trim() || defaultAdminEmail;
    const admins = await prisma.systemUser.findMany({
      where: { email: { equals: adminEmail, mode: 'insensitive' }, userRole: 1n, status: true, accountStatus: 'active' },
      select: { id: true }, take: 2,
    });
    if (admins.length !== 1) throw new Error(`Could not identify exactly one active administrator for ${adminEmail}. Override with --admin-email.`);

    const { addVerseExplanation, getVerseExplanationForEdit } = await import('../src/modules/bible/service.js');
    ({ cache } = await import('../src/services/cacheService.js'));
    let created = 0, skipped = 0;
    for (const entry of entries) {
      if (signal.aborted) break;
      const label = referenceLabel(entry);
      const reference = { bookName: entry.bookName, chapter: entry.chapter, verseNumber: entry.verseNumber };
      const findExisting = () => prisma.verseExplanation.findUnique({
        where: { bookName_chapter_verseNumber: { ...reference, chapter: BigInt(entry.chapter), verseNumber: BigInt(entry.verseNumber) } },
        select: { id: true },
      });
      const existing = await findExisting();
      if (existing) {
        skipped++;
        console.log(`[${label}] Skipped existing #${existing.id}`);
        continue;
      }
      if (signal.aborted) break;
      const { sourceVerseText: _quotation, ...payload } = entry;
      const saved = await addVerseExplanation(payload, admins[0].id);
      if (saved.status !== 200) {
        const concurrent = saved.status === 409 ? await findExisting() : null;
        if (concurrent) {
          skipped++;
          console.log(`[${label}] Skipped existing #${concurrent.id}`);
          continue;
        }
        throw new Error(`[${label}] ${saved.message} Run again to resume; existing records are skipped.`);
      }
      const result = await getVerseExplanationForEdit(reference);
      if (result.status !== 200 || String(result.data?.id) !== String(saved.data?.id) || !matchesSaved(result.data, entry)) {
        throw new Error(`[${label}] Saved #${saved.data?.id}, but its contents did not match the document. Stopped; review this entry before resuming.`);
      }
      created++;
      console.log(`[${label}] Created and verified #${saved.data.id}`);
    }
    console.log(`${created} created and verified; ${skipped} skipped.`);
  } finally {
    try { await prisma.$disconnect(); } finally { cache?.disconnect(); }
  }
}

if (process.argv.slice(2).includes('--help')) console.log(help);
else {
  const controller = new AbortController();
  const stop = () => {
    controller.abort();
    console.warn('Stopping after the current save. Re-run to resume without duplicating entries.');
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  try {
    const args = options(process.argv.slice(2));
    const bsb = new URL('../src/modules/bible-translations/Holy-Bible-XML-Format/EnglishBereanBible.xml', import.meta.url);
    const [document, xml] = await Promise.all([readDocument(args, controller.signal), readFile(bsb, 'utf8')]);
    const entries = parseExplanationDocument(document, {
      isVerse: buildVerseIndex(xml), range: args['--range'], skipMissing: args['--skip-missing'],
      onWarning: message => console.warn(message),
    });
    if (args['--json']) console.log(JSON.stringify(entries, null, 2));
    else if (args['--summary']) {
      console.log(`Preview: ${entries.length} BSB explanation(s). No database changes.`);
      for (const e of entries) console.log(`[${referenceLabel(e)}] ${e.wordStudies.length} word studies, ${e.practicalApps.length} practical applications, ${e.themes.length} themes, ${e.crossReferences.length} cross references, ${e.studyMetadata.takeaways.length} takeaways`);
    } else console.log(formatExplanationPreview(entries, process.stdout.columns));
    if (args['--apply']) {
      const url = configuredDatabase();
      if (await confirmApply(entries, args, url, controller.signal)) await apply(entries, args, url, controller.signal);
      else console.log('Import cancelled. No database changes.');
    }
  } catch (error) {
    // Do not log connection strings or credentials embedded in a DB error.
    console.error(String(error.message).replace(/postgres(?:ql)?:\/\/[^\s"'`]+/gi, '[database URL]'));
    process.exitCode = 1;
  } finally {
    process.off('SIGINT', stop);
    process.off('SIGTERM', stop);
    if (controller.signal.aborted) process.exitCode = 130;
  }
}
