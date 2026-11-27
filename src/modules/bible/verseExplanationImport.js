import { canonicalBook, parseStrongsIds, same } from '../shared-study/normalization.js';
import { CANONICAL_BOOK_ORDER } from '../../constants/bible-books.js';

const space = String.raw`[^\S\r\n]`;
const bsbName = String.raw`(?:BSB|Berean${space}+Standard${space}+Bible)`;
const bsbSuffix = String.raw`${space}+(?:[-–—]${space}*)?(?:\(${bsbName}\)|${bsbName})`;
const referenceCore = String.raw`([^\r\n]+?)[^\S\r\n]+(\d+):(\d+)(?:[^\S\r\n]*[-–—][^\S\r\n]*(\d+))?`;
const referencePattern = new RegExp(`^${referenceCore}(?:${bsbSuffix})?$`, 'i');
const explicitBsbHeading = new RegExp(`^${referenceCore}${bsbSuffix}$`, 'i');
const headingReference = new RegExp(`^${referenceCore}(?=${space}|$)`, 'i');
const crossReferenceSection = new RegExp(String.raw`^cross\s+references?(?:\s+\d+)?(${bsbSuffix})?$`, 'i');
const bullet = /^[*•●-]\s*/;
const numberedWord = /^\d+[.)][ \t]+/;
const numberedSection = String.raw`(?:section\s+\d+\s*[.:\-–—]?\s*)?`;
const wordStudySection = new RegExp(String.raw`^\.?\s*${numberedSection}(?:detailed\s+)?strong(?:['’]s)?\s+concordance\s+word(?:\s+stud(?:y|ies))?$`, 'i');
const practicalSection = new RegExp(String.raw`^${numberedSection}(?:\d+\s*[.):\-–—]?\s*)?(?:five\s+)?practical applications?(?: for today)?$`, 'i');
export const referenceLabel = ({ bookName, chapter, verseNumber, verseEnd }) =>
  `${bookName} ${chapter}:${verseNumber}${verseEnd ? `–${verseEnd}` : ''}`;

export const isExplicitBsbHeading = text => explicitBsbHeading.test(text.trim().replace(bullet, ''));
export const isBsbCrossReferenceSection = text => crossReferenceSection.test(text.trim());
export const isWordStudySection = text => wordStudySection.test(text.trim());
export const isPracticalSection = text => practicalSection.test(text.trim());

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
      chapters.set(Number(chapter), new Map([...text.matchAll(/<verse number="(\d+)"[^>]*>([\s\S]*?)<\/verse>/g)]
        .map(([, number, value]) => [Number(number), value])));
    }
  }
  if (books.size !== CANONICAL_BOOK_ORDER.length || books.has(undefined)) throw new Error('Could not read the bundled BSB verse index.');
  const isVerse = ({ bookName, chapter, verseNumber, verseEnd }) => {
    const numbers = books.get(bookName)?.get(chapter);
    return numbers?.has(verseNumber) && numbers.has(verseEnd ?? verseNumber);
  };
  isVerse.quotation = ({ bookName, chapter, verseNumber }) => books.get(bookName)?.get(chapter)?.get(verseNumber);
  return isVerse;
}

function parseCrossReference(heading, referenceText, isVerse) {
  const match = referencePattern.exec(heading);
  if (!match || canonicalBook(match[1])) return parseExplanationReference(heading);
  // Recover a missing book number only when exactly one edition quotation
  // matches the source. Otherwise the author must supply the number.
  const candidates = CANONICAL_BOOK_ORDER
    .filter(book => /^\d+ /.test(book) && book.replace(/^\d+ /, '').toLowerCase() === match[1].toLowerCase())
    .map(book => parseExplanationReference(`${book}${heading.slice(match[1].length)}`))
    .filter(passage => referenceText && passage.verseEnd === null &&
      normalizeWhitespace(isVerse.quotation?.(passage)) === normalizeWhitespace(referenceText));
  if (candidates.length === 1) return candidates[0];
  return parseExplanationReference(heading);
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

function parseList(text, label) {
  const markedHeading = /^(?:\d+[.)]|[*•●-])[ \t]+(\S[^\n]*)$/gm;
  const titleCaseHeading = /^(\p{Lu}[\p{L}’'-]*(?:[ \t]+(?:\p{Lu}[\p{L}’'-]*|a|an|and|as|at|by|for|from|in|of|on|or|the|to|with))+)$/gmu;
  // Bullets and numbers mark boundaries without constraining the count or order.
  return labeledItems(text, text.search(markedHeading) !== -1 ? markedHeading : titleCaseHeading,
    ([, title], body) => `${title.trim()}\n\n${body}`, label);
}

const strongIdList = String.raw`[HG]\d+[a-z]?(?:\s*(?:[/+,;&]|\band\b)\s*[HG]\d+[a-z]?)*`;
const idThenName = new RegExp(String.raw`^(?:strong['’]s\s+)?(${strongIdList})\s*[-–—]\s*(.+)$`, 'i');
const surfaceIdName = new RegExp(String.raw`^(.+?)\s+[-–—]\s+(${strongIdList})(?:\s+[-–—]\s+|\s*:\s*|\s*,(?!\s*[HG]\d)\s*)(.+)$`, 'i');
const nameThenId = new RegExp(String.raw`^(.+?)\s+[-–—]\s+(.+?)\s+(?:[-–—]\s+)?\(?strong['’]s\s+(${strongIdList})\)?$`, 'i');
const originalLanguageHeading = new RegExp(String.raw`^(Hebrew|Greek):\s*(.+),\s*strong['’]s\s+(${strongIdList})$`, 'i');
const annotatedName = new RegExp(String.raw`^(.+?)\s+\(strong['’]s\s+(${strongIdList})\)$`, 'i');
const contextualNote = /^(.+?)\s+[-–—]\s+((?:though\s+)?not represented by a single (?:Hebrew|Greek) word\b.*)$/i;
const strongId = /\b[HG]\d+[a-z]?\b/i;

function wordHeading(title) {
  const name = title.replace(bullet, '').replace(numberedWord, '');
  if (bullet.test(title) || numberedWord.test(title)) {
    const note = contextualNote.exec(name);
    if (note) return [note[1], null, '', undefined, note[2]];
  }
  const components = name.split(/(?<=\))\s*(\/|\band\b)\s*/i);
  if (components.length > 1) {
    const first = /^(.+?)\s+[-–—]\s+(.+)$/.exec(components[0]);
    if (first) {
      const words = [first[2], ...components.slice(2).filter((_, index) => index % 2 === 0)]
        .map(part => annotatedName.exec(part));
      if (words[0]) {
        if (!words.every(Boolean)) return null;
        const names = words.map((word, index) =>
          index === 0 ? word[1] : ` ${components[index * 2 - 1].toLowerCase()} ${word[1]}`).join('');
        return [first[1], words.map(word => word[2]).join(', '), names];
      }
    }
  }
  const middleId = surfaceIdName.exec(name);
  if (middleId) {
    const [, surface, ids, tail] = middleId;
    const inline = /^([^:]+):[ \t]*(meaning|definition|context|explanation|biblical significance|contextual meaning|spiritual insight):[ \t]*(.*)$/i.exec(tail);
    if (!inline) return [surface, ids, tail];
    const [, transliteration, label, definition] = inline;
    return [surface, ids, transliteration, undefined, `${label}: ${definition}`];
  }
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
  // Only exact heading formats are boundaries. Parenthesized IDs also appear
  // in prose; malformed list entries or explicit language labels still fail.
  const matches = [];
  for (const match of text.matchAll(/^.+$/gm)) {
    const line = match[0];
    const heading = wordHeading(line);
    if (heading) {
      matches.push({ match, heading });
      continue;
    }
    const bulleted = /^[*•●]\s+\S/.test(line);
    const numbered = numberedWord.test(line);
    if (strongId.test(line)) {
      if (bulleted || numbered || /\((?:Hebrew|Greek):[^()]+\)$/i.test(line)) {
        throw new Error(`Unrecognized Strong’s heading: ${line}`);
      }
    } else if (bulleted || (numbered && /\bstrong['’]s\b/i.test(line))) {
      throw new Error(`A Strong’s heading is missing its ID: ${line}`);
    }
  }
  if (!matches.length || text.slice(0, matches[0].match.index).trim()) throw new Error('Expected Strong’s word studies.');
  return matches.map(({ match, heading: [surface, ids, transliteration, original, inline] }, sortOrder) => {
    const strongsIds = ids === null ? [] : parseStrongsIds(ids);
    const continuation = text.slice(match.index + match[0].length, matches[sortOrder + 1]?.match.index);
    const body = clean(`${inline ?? ''}${continuation}`);
    if ((ids !== null && !strongsIds.length) || !body) throw new Error(`Incomplete word study: ${surface}.`);
    const label = surface.trim();
    const name = transliteration.trim();
    return {
      surfaceText: `${label.charAt(0).toUpperCase()}${label.slice(1)}${name ? ` - ${name}` : ''}`,
      strongsId: strongsIds.length ? strongsIds.join('/') : null,
      customDefinition: [original, /^Meaning:/i.test(body) ? name : null, body].filter(Boolean).join('\n'),
      sortOrder,
    };
  });
}

function parseEntry(reference, lines, isVerse) {
  // Match headings on separate lines so words like "Application" within the
  // explanation are never mistaken for a field boundary.
  const headings = [
    ['explanation', /^(?:section\s+)?section\s*2\s*[.:\-–—]?\s*(?:explanati?on|explain the verse)$/i],
    ['application', /^application(?:\s*:\s*(.*))?$/i],
    ['learnMore', /^section\s*3\s*[.:\-–—]?\s*learn more$/i],
    ['introduction', /^(?:practical|verse)\s*introduction(?: to the verse)?$/i],
    ['background', /^\.?[ \t]*background$/i],
    ['backgroundAuthor', /^(?:[*•●-]\s*)?(?:author(?:\s*[:;]|$)|autho[:;]r(?=\s|[:;]|$)(?:\s*[:;])?)\s*(.*)$/i],
    ['backgroundBook', /^(?:[*•●-]\s*)?book(?:\s*[:;]\s*(.*))?$/i],
    ['backgroundContext', /^(?:[*•●-]\s*)?context(?:\s*[:;]\s*(.*))?$/i],
    ['words', wordStudySection],
    ['practical', practicalSection],
    ['insights', /^(?:biblical )?insights and cross references?$/i],
    ['themes', /^key themes?$/i],
    ['crossReferences', crossReferenceSection],
    ['finalThoughts', /^\.?[ \t]*final thoughts?$/i],
    ['takeaways', /^(?:\d+[.)]?\s*)?takeaways?$/i],
  ];
  let previous = 0;
  let implicitWords = false;
  const missingSections = [];
  const positions = headings.map(([key, pattern]) => {
    let index = lines.findIndex((line, i) => i > previous && pattern.test(line.trim()));
    if (key === 'words' && index === -1) {
      const start = lines.findIndex((line, i) => i > previous && wordHeading(line));
      if (start !== -1) {
        implicitWords = true;
        index = start;
      }
    }
    if (key === 'themes') {
      const crossIndex = lines.findIndex((line, i) => i > previous && crossReferenceSection.test(line));
      if (crossIndex !== -1 && (index === -1 || index > crossIndex)) return null;
    }
    if (index === -1) {
      missingSections.push(key);
      return null;
    }
    previous = index;
    return index;
  });
  if (missingSections.length) {
    const label = missingSections.length === 1 ? 'section' : 'sections';
    throw new Error(`Missing or out-of-order ${label}: ${missingSections.join(', ')}.`);
  }
  const fields = Object.fromEntries(headings.map(([key, pattern], i) => {
    if (positions[i] === null) return [key, ''];
    const inline = key === 'practical' || key === 'crossReferences' ? undefined : pattern.exec(lines[positions[i]].trim())?.[1];
    const end = positions[i + 1] === null ? positions[i + 2] : positions[i + 1];
    const start = positions[i] + (key === 'words' && implicitWords ? 0 : 1);
    return [key, clean([inline, ...lines.slice(start, end)].join('\n'))];
  }));
  const sourceVerseText = clean(lines.slice(1, positions[0]).join('\n'));
  const fieldErrors = sourceVerseText ? [] : ['Missing the verse quotation.'];
  for (const key of ['application', 'introduction', 'backgroundAuthor', 'backgroundBook', 'backgroundContext', 'finalThoughts']) {
    if (!fields[key]) fieldErrors.push(`Empty section: ${key}.`);
  }
  if (fields.explanation.length < 20) fieldErrors.push('Explanation must contain at least 20 characters.');
  if (fieldErrors.length) throw new Error(fieldErrors.join(' '));
  const wordStudies = parseWordStudies(fields.words);
  const practicalApps = parseList(fields.practical, 'practical applications')
    .map((applicationText, sortOrder) => ({ applicationText, sortOrder }));
  const themeText = positions[11] === null ? fields.insights : fields.themes;
  const themeItems = positions[11] === null && !bullet.test(themeText)
    ? themeText.split(/\n\n+/) : themeText.split('\n');
  const themes = themeItems.filter(Boolean).map((theme, sortOrder) => ({
    themeName: theme.replace(bullet, '').trim(), sortOrder,
  }));
  if (positions[11] !== null && (!themes.length || themes.some(t => !t.themeName))) {
    throw new Error('Add at least one key theme.');
  }
  const inheritedEdition = Boolean(crossReferenceSection.exec(lines[positions[12]].trim())?.[1]);
  // An unlabeled cross reference inherits the explicitly declared study edition.
  const crossHeading = new RegExp(`^(?:[.*•●-][ \\t]*)?(${referenceCore}(?:${bsbSuffix})?)$`, 'gmi');
  const crossReferences = labeledItems(fields.crossReferences, crossHeading,
    ([, heading], body, sortOrder) => {
      const boundary = /^(?:Insight|Explanation):[ \t]*/mi.exec(body);
      let referenceText = '';
      let commentary = body;
      if (boundary) {
        referenceText = body.slice(0, boundary.index).trim().replace(/^(?:BSB|Berean Standard Bible):[ \t]*/i, '').trim();
        commentary = body.slice(boundary.index + boundary[0].length).trim();
        if (!referenceText || !commentary) throw new Error(`Incomplete cross reference: ${heading}.`);
      } else if (!inheritedEdition && !isExplicitBsbHeading(heading)) {
        // Some text exports glue the end of the quotation to the first word
        // of commentary. Split only when there is one clear joined boundary.
        const joins = [...body.matchAll(/[.!?][”’"')\]]*(?=\p{Lu}\p{Ll})/gu)];
        if (joins.length === 1) {
          const offset = joins[0].index + joins[0][0].length;
          referenceText = body.slice(0, offset).trim().replace(/^(?:BSB|Berean Standard Bible):[ \t]*/i, '').trim();
          commentary = body.slice(offset).trim();
        }
      } else {
        throw new Error(`Missing cross-reference insight: ${heading}.`);
      }
      const passage = parseCrossReference(heading, referenceText, isVerse);
      if (!isVerse(passage)) throw new Error(`Cross reference does not exist in BSB: ${heading}.`);
      return { ...passage, referenceText, commentary, sortOrder };
    }, 'BSB cross references');
  const takeaways = parseList(fields.takeaways, 'takeaways');
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
  let firstError;
  const repeated = [];
  const covered = new Set();
  const missingVerses = [];
  const seen = new Map();
  let previousIndex = 0;
  let sectionLine = 1;
  for (const [index, heading] of headings.entries()) {
    sectionLine += (source.slice(previousIndex, heading.index).match(/\n/g) ?? []).length;
    previousIndex = heading.index;
    const block = source.slice(heading.index + heading[0].length, headings[index + 1]?.index);
    const lines = clean(block).split('\n');
    let label;
    try {
      const headingText = lines[0].replace(bullet, '');
      const explicitEdition = isExplicitBsbHeading(headingText);
      const referenceText = explicitEdition ? headingText : headingReference.exec(headingText)?.[0];
      const headingError = `Expected a BSB verse heading ending in BSB, (BSB), or Berean Standard Bible, got: ${lines[0] || '(empty)'}`;
      if (!referenceText) throw new Error(headingError);
      const reference = parseExplanationReference(referenceText);
      if (selected && (reference.bookName !== selected.bookName || reference.chapter !== selected.chapter ||
        reference.verseNumber < selected.verseNumber || (reference.verseEnd ?? reference.verseNumber) > (selected.verseEnd ?? selected.verseNumber))) continue;
      label = referenceLabel(reference);
      if (!isVerse(reference)) {
        firstError ??= `${label} does not exist in BSB.`;
        continue;
      }
      if (selected) {
        for (let number = reference.verseNumber; number <= (reference.verseEnd ?? reference.verseNumber); number++) covered.add(number);
      }
      if (!explicitEdition) throw new Error(headingError);
      // After the first validation error, only keep scanning verse headings
      // so the range check can still report every absent explanation.
      if (firstError) continue;
      const key = `${reference.bookName}:${reference.chapter}:${reference.verseNumber}`;
      const entry = parseEntry(reference, lines, isVerse);
      const prior = seen.get(key);
      if (prior) {
        if (!same(normalizeWhitespace(prior.entry), normalizeWhitespace(entry))) {
          firstError = `Conflicting duplicate explanation starting at ${label} (sections at source lines ${prior.sectionLine} and ${sectionLine}). Correct the document or select a range that excludes this verse.`;
        } else {
          repeated.push(label);
        }
        continue;
      }
      seen.set(key, { entry, sectionLine });
      entries.push(entry);
    } catch (error) {
      firstError ??= label ? `${label}: ${error.message}` : `Source line ${sectionLine}: ${error.message}`;
    }
  }
  if (selected) {
    for (let number = selected.verseNumber; number <= (selected.verseEnd ?? selected.verseNumber); number++) {
      if (isVerse({ ...selected, verseNumber: number, verseEnd: null }) && !covered.has(number)) {
        const label = referenceLabel({ ...selected, verseNumber: number, verseEnd: null });
        if (!skipMissing) missingVerses.push(label);
        else onWarning?.(`Skipping ${label}: no explanation in the source document.`);
      }
    }
  }
  if (missingVerses.length) {
    throw new Error(`The document is missing ${missingVerses.join(', ')}. Add the source content or use --skip-missing to omit absent verses.`);
  }
  if (firstError) throw new Error(firstError);
  if (!entries.length) throw new Error('No matching explanations found.');
  for (const label of repeated) onWarning?.(`Ignored a repeated copy of ${label}; extracted content matches apart from spacing.`);
  return entries;
}
