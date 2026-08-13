-- Add rich-content columns to the daily_devotion table
ALTER TABLE "daily_devotion" ADD COLUMN IF NOT EXISTS "bible_version" TEXT;
ALTER TABLE "daily_devotion" ADD COLUMN IF NOT EXISTS "reflection" TEXT;
ALTER TABLE "daily_devotion" ADD COLUMN IF NOT EXISTS "explanation" TEXT;
ALTER TABLE "daily_devotion" ADD COLUMN IF NOT EXISTS "learn_more" TEXT;
ALTER TABLE "daily_devotion" ADD COLUMN IF NOT EXISTS "application" TEXT;
ALTER TABLE "daily_devotion" ADD COLUMN IF NOT EXISTS "verse_introduction" TEXT;
ALTER TABLE "daily_devotion" ADD COLUMN IF NOT EXISTS "background_author" TEXT;
ALTER TABLE "daily_devotion" ADD COLUMN IF NOT EXISTS "background_book" TEXT;
ALTER TABLE "daily_devotion" ADD COLUMN IF NOT EXISTS "background_context" TEXT;
ALTER TABLE "daily_devotion" ADD COLUMN IF NOT EXISTS "word_studies" TEXT;
ALTER TABLE "daily_devotion" ADD COLUMN IF NOT EXISTS "practical_applications" TEXT;
ALTER TABLE "daily_devotion" ADD COLUMN IF NOT EXISTS "key_themes" TEXT;
ALTER TABLE "daily_devotion" ADD COLUMN IF NOT EXISTS "cross_references" TEXT;
ALTER TABLE "daily_devotion" ADD COLUMN IF NOT EXISTS "final_thoughts" TEXT;
ALTER TABLE "daily_devotion" ADD COLUMN IF NOT EXISTS "takeaways" TEXT;

-- Verse lookup index (mirrors daily_verse)
CREATE INDEX IF NOT EXISTS "daily_devotion_book_name_chapter_verse_number_idx"
  ON "daily_devotion" ("book_name", "chapter", "verse_number");
