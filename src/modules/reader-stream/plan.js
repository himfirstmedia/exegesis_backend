import { createHash } from 'node:crypto';

export const CHUNK_CHARACTERS = 250;
const BODY_KEYS = new Set(['text', 'content', 'description', 'definition', 'meaning', 'label',
  'commentary', 'verseText', 'excerpt', 'translation', 'explanation', 'adminExplanation',
  'fullDefinition', 'summary']);
// Structural / canonical values. They are preserved verbatim and never sent to
// a translation provider. Anything else is reader prose.
const METADATA = new Set(['id', 'bookName', 'chapter', 'verse', 'verseNumber', 'verseStart',
  'verseEnd', 'reference', 'ref', 'passageReference', 'bibleVersion', 'translation',
  'displayDate', 'displayTime', 'createdOn', 'updatedOn', 'chapters', 'isPublished',
  'published', 'sortOrder', 'order', 'wordOrder', 'range', 'strongsId', 'strongsIds',
  'verseRefs', 'originalWord', 'original', 'surfaceText', 'surfaceTextOriginal', 'word',
  'transliteration', 'pronunciation', 'language', 'usageCount', 'url', 'href', 'author',
  'toolType', 'strongs', 'lemma', 'grammar', 'morphology', 'abbreviation', 'type', 'code',
  'slug', 'key', 'verseWords']);

const reference = /^(?:[1-3]\s+)?[A-Za-z][A-Za-z ]+\s+\d+(?::[\d,; :–—-]+)?$/;
/** "John 3:16", "John 3:16; Romans 5:8", "Genesis 1:1, 2:3" and similar. */
const isReferenceList = value => value.trim().split(/\s*[;\n]\s*/).filter(Boolean)
  .every(part => reference.test(part.trim()));

export function splitReaderText(value) {
  const chunks = [];
  let rest = value.trim();
  let separator = '';
  while (rest) {
    const paragraph = rest.search(/\r?\n[ \t]*\r?\n+/);
    let end = paragraph < 0 ? rest.length : paragraph;
    if (end > CHUNK_CHARACTERS) {
      const window = rest.slice(0, CHUNK_CHARACTERS);
      const sentences = [...window.matchAll(/[.!?。！？]["'”’)]*(?=\s|$)/g)];
      const sentence = sentences.at(-1);
      end = sentence && sentence.index >= CHUNK_CHARACTERS / 3
        ? sentence.index + sentence[0].length
        : Math.max(window.lastIndexOf(' '), window.lastIndexOf('\n'));
      if (end < 1) end = CHUNK_CHARACTERS;
      const last = rest.charCodeAt(end - 1);
      if (last >= 0xd800 && last <= 0xdbff) end -= 1;
    }
    chunks.push({ text: rest.slice(0, end).trim(), separator });
    rest = rest.slice(end);
    separator = rest.match(/^\s*/)?.[0] || '';
    rest = rest.slice(separator.length);
  }
  return chunks;
}

/** Only allowlisted reader fields leave the server; source prose never does. */
export function buildReaderPlan(source, fields, atomicFields = []) {
  const jobs = [];
  const literal = (value, display = false) => ({ kind: 'literal', value, display });
  const build = (value, key, field, atomic = false) => {
    atomic ||= atomicFields.includes(key);
    if (typeof value === 'string') {
      // Bible versions, names, original-language words, Strong's ids, etc.
      // stay canonical. `translation` is prose only in the interlinear table,
      // and the book author is prose only when it is the requested field.
      if (METADATA.has(key) && !(key === 'translation' && field === 'interlinearWords') &&
        !(key === 'author' && field === 'author')) return literal(value);
      if (/^[\s\d\p{P}\p{S}]*$/u.test(value) || /^(https?:\/\/|mailto:)/i.test(value.trim()) ||
        (['crossReferences', 'keyVerses'].includes(key) && isReferenceList(value))) return literal(value, true);
      if (/^\s*[\[{]/.test(value)) {
        try { return { kind: 'json', node: build(JSON.parse(value), key, field, atomic) }; }
        catch { return literal('', true); }
      }
      if (/<[a-z][^>]*>/i.test(value)) return { kind: 'html', parts: value.split(/(<[^>]+>)/g).filter(Boolean).map(part =>
        /^<[^>]+>$/.test(part) || !part.trim() ? part : {
          node: build(part.trim(), key, field, atomic), before: part.match(/^\s*/)?.[0] || '', after: part.match(/\s*$/)?.[0] || '',
        }) };
      return { kind: 'text', atomic, chunks: splitReaderText(value).map(chunk => {
        const index = jobs.length;
        jobs.push({ text: chunk.text, field, key });
        return { index, separator: chunk.separator };
      }) };
    }
    if (Array.isArray(value)) return { kind: 'array', items: value.map(item => build(item, key, field, atomic)) };
    if (value && typeof value === 'object') return { kind: 'object', fields: Object.entries(value)
      // Preserve every structural property (ids, grammar tags, word order,
      // study-tool metadata) while translating the prose inside it.
      .map(([name, item]) => [name, build(item, name, field, atomic)]) };
    return literal(value);
  };
  const nodes = fields.filter(field => source[field] != null).map(field => [field, build(source[field], field, field)]);
  const metadata = Object.fromEntries(Object.entries(source).filter(([key]) => METADATA.has(key)));
  // Root author is a display field when explicitly requested, not duplicated metadata.
  for (const field of fields) delete metadata[field];
  const render = values => {
    let blocked = false;
    const read = node => {
      if (node.kind === 'literal') return blocked && node.display
        ? { value: '', complete: false, visible: false }
        : { value: node.value, complete: true, visible: node.display && !!node.value };
      if (node.kind === 'text') {
        let text = '';
        let complete = true;
        for (const chunk of node.chunks) {
          const value = blocked ? null : values[chunk.index];
          if (!value?.trim()) { blocked = true; complete = false; break; }
          text += (text ? chunk.separator : '') + value.trim();
        }
        if (node.atomic && !complete) text = '';
        return { value: text, complete, visible: !!text };
      }
      if (node.kind === 'json') { const result = read(node.node); return { ...result, value: JSON.stringify(result.value) }; }
      if (node.kind === 'array') {
        const items = [];
        let complete = true;
        for (const item of node.items) {
          const result = read(item);
          if (result.complete || result.visible) items.push(result.value);
          if (!result.complete) { complete = false; break; }
        }
        return { value: items, complete, visible: !!items.length };
      }
      if (node.kind === 'html') {
        let html = ''; let visible = false; const open = [];
        for (const part of node.parts) {
          if (blocked) break;
          if (typeof part !== 'string') {
            const result = read(part.node); html += part.before + result.value + (result.complete ? part.after : ''); visible ||= result.visible; continue;
          }
          html += part;
          const tag = part.match(/^<\s*(\/?)\s*([a-z][\w-]*)/i);
          if (!tag) continue;
          const name = tag[2].toLowerCase();
          if (tag[1]) { if (open.at(-1) === name) open.pop(); }
          else if (!/\/\s*>$/.test(part) && !['br', 'hr', 'img', 'input', 'meta', 'link', 'wbr'].includes(name)) open.push(name);
        }
        if (blocked) html += open.reverse().map(name => `</${name}>`).join('');
        return { value: visible ? html : '', complete: !blocked, visible };
      }
      const results = node.fields.map(([key, child]) => [key, read(child)]);
      const body = results.filter(([key]) => BODY_KEYS.has(key));
      return { value: Object.fromEntries(results.map(([key, result]) => [key, result.value])),
        complete: results.every(([, result]) => result.complete), visible: (body.length ? body : results).some(([, result]) => result.visible) };
    };
    return { ...metadata, ...Object.fromEntries(nodes.map(([field, node]) => [field, read(node).value])) };
  };
  return { jobs, fields: nodes.map(([field]) => field), render,
    sourceVersion: createHash('sha256').update(JSON.stringify([metadata, fields, source])).digest('hex') };
}
