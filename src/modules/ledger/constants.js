// Ledger domain constants shared by the service, controller and tests.
// The ledger is the archive/read model over journal_entries; it never owns a
// second table. Keep these limits in one place so mobile and web agree.

export const LEDGER_PAGE_SIZE = 20;
export const LEDGER_MAX_PAGE_SIZE = 50;

export const LEDGER_SORT_OPTIONS = Object.freeze({
  NEWEST: "newest",
  OLDEST: "oldest",
  UPDATED: "updated",
});

export const LEDGER_SORT_VALUES = Object.freeze(
  Object.values(LEDGER_SORT_OPTIONS),
);

export const LEDGER_EXPORT_FORMATS = Object.freeze(["txt", "json", "pdf"]);

export const LEDGER_FILTER_FIELDS = Object.freeze([
  "search",
  "category",
  "bookName",
  "tag",
  "strongsId",
  "isPublished",
  "isFavorite",
  "source",
  "startDate",
  "endDate",
]);
