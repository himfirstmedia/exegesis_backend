-- Journal read paths are all owner- or visibility-scoped. Add the composite
-- indexes those queries actually use, and widen the passage index to include
-- the verse so verse-scoped lookups can be served by one index scan.
--
-- Additive and reversible: index only, no data changes.

-- Owner lists: filter by favorite / visibility and sort by recent edits.
CREATE INDEX IF NOT EXISTS "journal_entries_user_id_updated_on_idx"
  ON "journal_entries" ("user_id", "updated_on");
CREATE INDEX IF NOT EXISTS "journal_entries_user_id_is_favorite_idx"
  ON "journal_entries" ("user_id", "is_favorite");
CREATE INDEX IF NOT EXISTS "journal_entries_user_id_is_published_idx"
  ON "journal_entries" ("user_id", "is_published");

-- Passage lookups: book + chapter + verse filtering.
DROP INDEX IF EXISTS "journal_entries_book_name_chapter_idx";
CREATE INDEX IF NOT EXISTS "journal_entries_book_name_chapter_verse_number_idx"
  ON "journal_entries" ("book_name", "chapter", "verse_number");

-- Public discovery feed: published entries ordered by recency.
CREATE INDEX IF NOT EXISTS "journal_entries_is_published_created_on_idx"
  ON "journal_entries" ("is_published", "created_on");