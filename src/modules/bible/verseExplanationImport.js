import { canonicalBook, parseStrongsIds, same } from '../shared-study/normalization.js';
import { CANONICAL_BOOK_ORDER } from '../../constants/bible-books.js';

const bsbSuffix = String.raw`[^\S\r\n]+(?:\(BSB\)|BSB)`;
const referenceCore = String.raw`([^\r\n]+?)[^\S\r\n]+(\d+):(\d+)(?:[^\S\r\n]*[-–—][^\S\r\n]*(\d+))?`;
const referencePattern = new RegExp(`^${referenceCore}(?:${bsbSuffix})?$`, 'i');
const explicitBsbHeading = new RegExp(`^${referenceCore}${bsbSuffix}$`, 'i');
const crossReferenceSection = new RegExp(`^cross references(${bsbSuffix})?$`, 'i');
const bullet = /^[*•●-]\s*/;
const numberedWord = /^\d+[.)][ \t]+/;
const numberedSection = String.raw`(?:section\s+\d+\s*[.:\-–—]?\s*)?`;
export const referenceLabel = ({ bookName, chapter, verseNumber, verseEnd }) =>
  `${bookName} ${chapter}:${verseNumber}${verseEnd ? `–${verseEnd}` : ''}`;

export const isExplicitBsbHeading = text => explicitBsbHeading.test(text.trim().replace(bullet, ''));
export const isBsbCrossReferenceSection = text => crossReferenceSection.test(text.trim());

export function parseExplanationReference(text) {
  const match = referencePattern.exec(text.trim());
  const bookName = match && canonicalBook(match[1]);
  if (!bookName) throw new Error(`Invalid Bible reference: ${text}`);
  const chapter = Number(match[2]);
  const verseNumber = Number(match[3]);
  const verseEnd = match[4] ? Number(match[4]) : null;
  if (![chapter, verseNumber, verseEnd ?? verseNumber].every(n => Number.isSafeInteger(n) && n > 0) ||
      (verseEnd !== null && verseEnd < verseNumber)) throw new Error(`Invalid Bible reference: ${text}`);
  return { bookName, chapter, verseNumber, verseEnd };
}

// Index the bundled BSB by actual verse number, not by chapter length (some
// editions skip numbers). Load it once per import, without a database or API.
export function buildVerseIndex(xml) {
  const books = new Map();
  for (const [, book, contents] of xml.matchAll(/<book number="(\d+)"[^>]*>([\s\S]*?)<\/book>/g)) {
    const chapters = new Map();
    books.set(CANONICAL_BOOK_ORDER[Number(book) - 1], chapters);
    for (const [, chapter, text] of contents.matchAll(/<chapter number="(\d+)"[^>]*>([\s\S]*?)<\/chapter>/g)) {
      chapters.set(Number(chapter), new Set([...text.matchAll(/<verse number="(\d+)"/g)].map(match => Number(match[1]))));
    }
  }
  if (books.size !== CANONICAL_BOOK_ORDER.length || books.has(undefined)) throw new Error('Could not read the bundled BSB verse index.');
  return ({ bookName, chapter, verseNumber, verseEnd }) => {
    const numbers = books.get(bookName)?.get(chapter);
    return numbers?.has(verseNumber) && numbers.has(verseEnd ?? verseNumber);
  };
}

function clean(text) {
  return text.replace(/[\u200B\uFEFF]/g, '').split(/\r?\n/).map(line => line.trim()).filter(line => !/^[_─━]{3,}$/.test(line))
    .join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function labeledItems(text, pattern, parse, label) {
  const matches = [...text.matchAll(pattern)];
  if (!matches.length || text.slice(0, matches[0].index).trim()) throw new Error(`Expected ${label}.`);
  return matches.map((match, i) => {
    const body = clean(text.slice(match.index + match[0].length, matches[i + 1]?.index));
    if (!body) throw new Error(`Missing text for ${label} item ${i + 1}.`);
    return parse(match, body, i);
  });
}

const numbered = (text, label) => labeledItems(text, /^(\d+)[.)][ \t]+([^\n]+)$/gm, ([, n, title], body, i) => {
  if (Number(n) !== i + 1) throw new Error(`Unexpected ${label} item number ${n}.`);
  return `${title.trim()}\n\n${body}`;
}, label);

const strongIdList = String.raw`[HG]\d+[a-z]?(?:\s*(?:[/+,;&]|\band\b)\s*[HG]\d+[a-z]?)*`;
const idThenName = new RegExp(String.raw`^(?:strong['’]s\s+)?(${strongIdList})\s*[-–—]\s*(.+)$`, 'i');
const nameThenId = new RegExp(String.raw`^(.+?)\s+[-–—]\s+(.+?)\s+(?:[-–—]\s+)?\(?strong['’]s\s+(${strongIdList})\)?$`, 'i');
const originalLanguageHeading = new RegExp(String.raw`^(Hebrew|Greek):\s*(.+),\s*strong['’]s\s+(${strongIdList})$`, 'i');

function wordHeading(title) {
  const name = title.replace(bullet, '').replace(numberedWord, '');
  const parenthesized = /^(.+?)\s*\((.+)\)$/.exec(name);
  if (parenthesized) {
    const [, surface, metadata] = parenthesized;
    const standard = idThenName.exec(metadata);
    if (standard) return [surface, standard[1], standard[2]];
    const language = originalLanguageHeading.exec(metadata);
    if (language) {
      const [, label, originalAndName, ids] = language;
      const parts = /^(.*?)\s*(?:,\s*|\s+[-–—]\s+)([^,]+)$/.exec(originalAndName);
      if (parts?.[1].trim() && parts[2].trim()) return [surface, ids, parts[2], `${label}: ${parts[1].trim()}`];
    }
  }
  const separated = nameThenId.exec(name);
  if (separated) return [separated[1], separated[3], separated[2]];
  return null;
}

function parseWordStudies(text) {
  const pattern = /^(?:[*•●-]\s*)?[^\n]*\b[HG]\d+[a-z]?\b[^\n]*$/gmi;
  // Only exact heading formats are boundaries. A Strong’s ID in a definition
  // must not split that entry; bullets which cannot be parsed require review.
  const matches = [];
  for (const match of text.matchAll(pattern)) {
    const heading = wordHeading(match[0]);
    if (heading) matches.push({ match, heading });
    else if (/^[*•●]\s+\S/.test(match[0]) || numberedWord.test(match[0]) || /\((?:Hebrew:|Greek:|[HG]\d)/i.test(match[0])) {
      throw new Error(`Unrecognized Strong’s heading: ${match[0]}`);
    }
  }
  const missingId = text.split('\n').find(line => (/^[*•●]\s+\S/.test(line) ||
    (numberedWord.test(line) && /\bstrong['’]s\b/i.test(line))) && !/\b[HG]\d+[a-z]?\b/i.test(line));
  if (missingId) throw new Error(`A Strong’s heading is missing its ID: ${missingId}`);
  if (!matches.length || text.slice(0, matches[0].match.index).trim()) throw new Error('Expected Strong’s word studies.');
  return matches.map(({ match, heading: [surface, ids, transliteration, original] }, sortOrder) => {
    const strongsIds = parseStrongsIds(ids);
    const body = clean(text.slice(match.index + match[0].length, matches[sortOrder + 1]?.match.index));
    if (!strongsIds.length || !body) throw new Error(`Incomplete word study: ${surface}.`);
    const label = surface.trim();
    const name = transliteration.trim();
    return {
      surfaceText: `${label.charAt(0).toUpperCase()}${label.slice(1)} - ${name}`,
      strongsId: strongsIds.join('/'),
      customDefinition: [original, /^Meaning:/i.test(body) ? name : null, body].filter(Boolean).join('\n'),
      sortOrder,
    };
  });
}

function parseEntry(reference, lines, isVerse) {
  // Match headings on separate lines so words like "Application" within the
  // explanation are never mistaken for a field boundary.
  const headings = [
    ['explanation', /^section\s*2\s*[.:\-–—]?\s*(?:explanation|explain the verse)$/i],
    ['application', /^application(?:\s*:\s*(.*))?$/i],
    ['learnMore', /^section\s*3\s*[.:\-–—]?\s*learn more$/i],
    ['introduction', /^(?:practical|verse) introduction(?: to the verse)?$/i],
    ['background', /^background$/i],
    ['backgroundAuthor', /^(?:[*•●-]\s*)?author(?:\s*:\s*(.*))?$/i],
    ['backgroundBook', /^(?:[*•●-]\s*)?book(?:\s*:\s*(.*))?$/i],
    ['backgroundContext', /^(?:[*•●-]\s*)?context(?:\s*:\s*(.*))?$/i],
    ['words', new RegExp(`^${numberedSection}(?:detailed )?strong(?:['’]s)? concordance word study$`, 'i')],
    ['practical', new RegExp(`^${numberedSection}(?:(\\d+) )?practical applications(?: for today)?$`, 'i')],
    ['insights', /^(?:biblical )?insights and cross references$/i],
    ['themes', /^key themes$/i],
    ['crossReferences', crossReferenceSection],
    ['finalThoughts', /^final thoughts$/i],
    ['takeaways', /^(?:\d+ )?takeaways$/i],
  ];
  let previous = 0;
  const positions = headings.map(([key, pattern]) => {
    const index = lines.findIndex((line, i) => i > previous && pattern.test(line.trim()));
    if (index === -1) throw new Error(`Missing or out-of-order section: ${key}.`);
    previous = index;
    return index;
  });
  const fields = Object.fromEntries(headings.map(([key, pattern], i) => {
    const inline = key === 'practical' || key === 'crossReferences' ? undefined : pattern.exec(lines[positions[i]].trim())?.[1];
    return [key, clean([inline, ...lines.slice(positions[i] + 1, positions[i + 1])].join('\n'))];
  }));
  const sourceVerseText = clean(lines.slice(1, positions[0]).join('\n'));
  if (!sourceVerseText) throw new Error('Missing the verse quotation.');
  for (const key of ['application', 'introduction', 'backgroundAuthor', 'backgroundBook', 'backgroundContext', 'finalThoughts']) {
    if (!fields[key]) throw new Error(`Empty section: ${key}.`);
  }
  if (fields.explanation.length < 20) throw new Error('Explanation must contain at least 20 characters.');
  const wordStudies = parseWordStudies(fields.words);
  const practicalApps = numbered(fields.practical, 'practical applications').map((applicationText, sortOrder) => ({ applicationText, sortOrder }));
  const themes = fields.themes.split('\n').filter(Boolean).map((theme, sortOrder) => ({
    themeName: theme.replace(bullet, '').trim(), sortOrder,
  }));
  if (!themes.length || themes.some(t => !t.themeName)) throw new Error('Add at least one key theme.');
  const inheritedEdition = Boolean(crossReferenceSection.exec(lines[positions[12]].trim())?.[1]);
  const edition = inheritedEdition ? `(?:${bsbSuffix})?` : bsbSuffix;
  const crossHeading = new RegExp(`^(?:[*•●-][ \\t]*)?(${referenceCore}${edition})$`, 'gmi');
  const crossReferences = labeledItems(fields.crossReferences, crossHeading,
    ([, heading], body, sortOrder) => {
      const passage = parseExplanationReference(heading);
      const boundary = /^(?:Insight|Explanation):[ \t]*/mi.exec(body);
      if (!isVerse(passage)) throw new Error(`Cross reference does not exist in BSB: ${heading}.`);
      if (!boundary) throw new Error(`Missing cross-reference insight: ${heading}.`);
      const referenceText = body.slice(0, boundary.index).trim();
      const commentary = body.slice(boundary.index + boundary[0].length).trim();
      if (!referenceText || !commentary) throw new Error(`Incomplete cross reference: ${heading}.`);
      return { ...passage, referenceText, commentary, sortOrder };
    }, 'BSB cross references');
  const takeaways = numbered(fields.takeaways, 'takeaways');
  for (const [name, count, i] of [['practical applications', practicalApps.length, 9], ['takeaways', takeaways.length, 14]]) {
    const declared = /^\d+/.exec(lines[positions[i]].trim());
    if (declared && Number(declared[0]) !== count) throw new Error(`Expected ${declared[0]} ${name}, found ${count}.`);
  }
  return {
    ...reference, bibleVersion: 'BSB', createOnly: true, sourceVerseText,
    exegesis: { explanationText: fields.explanation, applicationText: fields.application },
    studyMetadata: { introduction: fields.introduction, backgroundAuthor: fields.backgroundAuthor,
      backgroundBook: fields.backgroundBook, backgroundContext: fields.backgroundContext, finalThoughts: fields.finalThoughts, takeaways },
    wordStudies, practicalApps, themes, crossReferences,
  };
}

function normalizeWhitespace(value) {
  if (typeof value === 'string') return value.replace(/\s+/g, ' ').trim();
  if (Array.isArray(value)) return value.map(normalizeWhitespace);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeWhitespace(item)]));
  }
  return value;
}

export function parseExplanationDocument(text, { isVerse, range, onWarning, skipMissing = false } = {}) {
  if (typeof isVerse !== 'function') throw new Error('BSB verse validation is required.');
  const selected = range ? parseExplanationReference(range) : null;
  if (selected && !isVerse(selected)) throw new Error(`${referenceLabel(selected)} does not exist in BSB.`);
  const source = text.replace(/[\u200B\uFEFF]/g, '');
  const headings = [...source.matchAll(/^[ \t]*section[ \t]*1[ \t]*[.:\-–—]?[ \t]*mention the verse[ \t]*\r?$/gmi)];
  if (!headings.length) throw new Error('No “Section 1. Mention the Verse” headings found.');
  const entries = [];
  const seen = new Map();
  let previousIndex = 0;
  let sectionLine = 1;
  for (const [index, heading] of headings.entries()) {
    sectionLine += (source.slice(previousIndex, heading.index).match(/\n/g) ?? []).length;
    previousIndex = heading.index;
    const block = source.slice(heading.index + heading[0].length, headings[index + 1]?.index);
    const lines = clean(block).split('\n');
    if (!isExplicitBsbHeading(lines[0])) {
      throw new Error(`Expected a BSB verse heading (e.g. Numbers 5:1 BSB or Numbers 5:1 (BSB)), got: ${lines[0] || '(empty)'}`);
    }
    const reference = parseExplanationReference(lines[0].replace(bullet, ''));
    if (selected && (reference.bookName !== selected.bookName || reference.chapter !== selected.chapter ||
      reference.verseNumber < selected.verseNumber || (reference.verseEnd ?? reference.verseNumber) > (selected.verseEnd ?? selected.verseNumber))) continue;
    const label = referenceLabel(reference);
    if (!isVerse(reference)) throw new Error(`${label} does not exist in BSB.`);
    const key = `${reference.bookName}:${reference.chapter}:${reference.verseNumber}`;
    let entry;
    try { entry = parseEntry(reference, lines, isVerse); }
    catch (error) { throw new Error(`${label}: ${error.message}`); }
    const prior = seen.get(key);
    if (prior) {
      if (!same(normalizeWhitespace(prior.entry), normalizeWhitespace(entry))) {
        throw new Error(`Conflicting duplicate explanation starting at ${label} (sections at source lines ${prior.sectionLine} and ${sectionLine}). Correct the document or select a range that excludes this verse.`);
      }
      onWarning?.(`Ignored a repeated copy of ${label}; extracted content matches apart from spacing.`);
      continue;
    }
    seen.set(key, { entry, sectionLine });
    entries.push(entry);
  }
  if (!entries.length) throw new Error('No matching explanations found.');
  if (selected) {
    for (let number = selected.verseNumber; number <= (selected.verseEnd ?? selected.verseNumber); number++) {
      if (isVerse({ ...selected, verseNumber: number, verseEnd: null }) && !entries.some(row =>
        row.verseNumber <= number && (row.verseEnd ?? row.verseNumber) >= number)) {
        const label = referenceLabel({ ...selected, verseNumber: number, verseEnd: null });
        if (!skipMissing) throw new Error(`The document is missing ${label}. Add its source content or use --skip-missing to import only the verses present.`);
        onWarning?.(`Skipping ${label}: no explanation in the source document.`);
      }
    }
  }
  return entries;
}
