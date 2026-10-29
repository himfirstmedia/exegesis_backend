import { validUiText } from '../text-to-text-translation/ui-pack-data.js';

/** Derive names from the editor's people/author metadata, not arbitrary echoed prose. */
function personNames(source) {
  const names = new Set();
  const people = [...(Array.isArray(source.keyPeople) ? source.keyPeople : []), source.author];
  for (const entry of people) {
    if (typeof entry !== 'string') continue;
    for (const part of entry.split(/\s+(?:and|&)\s+|\s*[,;→]\s*/)) {
      const name = part.replace(/\s*\([^)]*\)\s*$/, '').trim();
      // Deliberately exclude sentences/descriptive labels such as "The people of Israel".
      if (/^[A-Z][\p{L}'’-]*(?:\s+[A-Z][\p{L}'’-]*){0,2}$/u.test(name) && !/^(?:The|An?|All)\b/.test(name)) names.add(name);
    }
  }
  return names;
}

export function overviewTranslationIssue(job, value, source, language) {
  if (typeof value !== 'string' || !value.trim()) return 'EMPTY_TRANSLATION';
  if (!validUiText(job.text, value)) return 'ALTERED_PLACEHOLDERS';
  if (value.trim() !== job.text.trim()) return null;
  if (['author', 'keyPeople', 'dateWritten', 'locationWritten'].includes(job.field)) return null;
  if (language === 'fr' && ['Introduction', 'Application', 'Conclusion', 'Question', 'Questions'].includes(value.trim())) return null;
  // Single proper names and punctuation-only name chains can legitimately be
  // identical across languages. An English sentence mentioning a name cannot.
  const names = personNames(source);
  const parts = job.text.trim().split(/\s*(?:→|->|[,;/])\s*/);
  if (parts.length && parts.every(part => names.has(part))) return null;
  return 'UNCHANGED_SOURCE';
}
