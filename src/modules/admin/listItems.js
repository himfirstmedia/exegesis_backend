// List cards only render these fields. Keep hydrated study internals out of the
// response so admin lists stay small; `source` carries the canonical record for
// edit/detail navigation and is only attached when explicitly requested.
const pick = (row, keys) =>
  Object.fromEntries(keys.filter((key) => key in row).map((key) => [key, row[key]]));

export const DAILY_VERSE_LIST_FIELDS = [
  "id",
  "bookName",
  "chapter",
  "verseNumber",
  "verseEnd",
  "bibleVersion",
  "displayDate",
  "isPublished",
  "creatorName",
  "createdOn",
];

export const DAILY_DEVOTION_LIST_FIELDS = [
  "id",
  "title",
  "bookName",
  "chapter",
  "verseNumber",
  "displayDate",
  "displayTime",
  "isPublished",
  "creatorName",
  "createdOn",
];

const selectForCard = (fields, textFields) => ({
  ...Object.fromEntries([...fields.filter(field => field !== 'creatorName'), ...textFields].map(field => [field, true])),
  user: { select: { firstName: true, lastName: true, username: true } },
});

export const dailyVerseCardSelect = selectForCard(DAILY_VERSE_LIST_FIELDS, ['explanation', 'application', 'reflection']);
export const dailyDevotionCardSelect = selectForCard(DAILY_DEVOTION_LIST_FIELDS, ['explanation', 'content']);

const withListExtras = (row, fields, includeSource) => {
  if (!row) return row;
  const item = pick(row, fields);
  if (row.preview) item.preview = row.preview;
  if (includeSource) {
    const { preview: _preview, ...source } = row;
    item.source = source;
  }
  return item;
};

export const toDailyVerseListItem = (row, includeSource = false) =>
  withListExtras(row, DAILY_VERSE_LIST_FIELDS, includeSource);

export const toDailyDevotionListItem = (row, includeSource = false) =>
  withListExtras(row, DAILY_DEVOTION_LIST_FIELDS, includeSource);
