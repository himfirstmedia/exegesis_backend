// A chapter cannot contain more verses than Psalm 119 (176). Never accept a
// range string as a verse number or silently save an inverted/truncated range.
export const validVerseRange = (start, end) => {
  const first = Number(start);
  const last = end == null || end === '' ? first : Number(end);
  return Number.isInteger(first) && first >= 1 && Number.isInteger(last) && last >= first && last <= 176;
};
export const verseEndData = (end) => end === undefined ? {} : { verseEnd: end == null || end === '' ? null : BigInt(end) };
