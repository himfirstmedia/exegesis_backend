const MIN_BOUNDARY_RATIO = 0.5;
const LIBRE_LANGUAGE_CODES = { fil: "tl" };

export const toLibreLanguageCode = (language) =>
  LIBRE_LANGUAGE_CODES[language] || language;

export const normalizeTranslationText = (text) =>
  text.replace(/([.!?])(?=\[\d+\])/g, "$1 ");

const findSplitPoint = (text, start, maxChunkSize) => {
  const end = Math.min(start + maxChunkSize, text.length);
  if (end === text.length) return end;

  const window = text.slice(start, end);
  const minimum = Math.floor(maxChunkSize * MIN_BOUNDARY_RATIO);
  const paragraph = window.lastIndexOf("\n\n");
  if (paragraph >= minimum) return start + paragraph + 2;

  const line = window.lastIndexOf("\n");
  if (line >= minimum) return start + line + 1;

  let sentence = -1;
  for (const match of window.matchAll(/[.!?](?:\s+|$)/g)) {
    sentence = match.index + match[0].length;
  }
  if (sentence >= minimum) return start + sentence;

  let whitespace = -1;
  for (const match of window.matchAll(/\s+/g)) {
    whitespace = match.index + match[0].length;
  }
  return whitespace >= minimum ? start + whitespace : end;
};

export const splitText = (text, maxChunkSize) => {
  if (text.length <= maxChunkSize) return [text];

  const chunks = [];
  let offset = 0;
  while (offset < text.length) {
    const end = findSplitPoint(text, offset, maxChunkSize);
    chunks.push(text.slice(offset, end));
    offset = end;
  }
  return chunks;
};

export const preserveOuterWhitespace = (text) => {
  const leading = text.match(/^\s*/)?.[0] || "";
  const trailing = text.match(/\s*$/)?.[0] || "";
  return {
    leading,
    value: text.slice(leading.length, text.length - trailing.length),
    trailing,
  };
};

export const mapWithConcurrency = async (items, concurrency, worker) => {
  const results = new Array(items.length);
  let nextIndex = 0;

  const run = async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await worker(items[index], index);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, run),
  );
  return results;
};
