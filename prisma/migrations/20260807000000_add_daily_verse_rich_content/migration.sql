-- Add rich-content columns to the daily_verse table
ALTER TABLE "daily_verse" ADD COLUMN IF NOT EXISTS "application" TEXT;
ALTER TABLE "daily_verse" ADD COLUMN IF NOT EXISTS "verse_introduction" TEXT;
ALTER TABLE "daily_verse" ADD COLUMN IF NOT EXISTS "background_author" TEXT;
ALTER TABLE "daily_verse" ADD COLUMN IF NOT EXISTS "background_book" TEXT;
ALTER TABLE "daily_verse" ADD COLUMN IF NOT EXISTS "background_context" TEXT;
ALTER TABLE "daily_verse" ADD COLUMN IF NOT EXISTS "word_studies" TEXT;
ALTER TABLE "daily_verse" ADD COLUMN IF NOT EXISTS "practical_applications" TEXT;
ALTER TABLE "daily_verse" ADD COLUMN IF NOT EXISTS "key_themes" TEXT;
ALTER TABLE "daily_verse" ADD COLUMN IF NOT EXISTS "cross_references" TEXT;
ALTER TABLE "daily_verse" ADD COLUMN IF NOT EXISTS "final_thoughts" TEXT;
ALTER TABLE "daily_verse" ADD COLUMN IF NOT EXISTS "takeaways" TEXT;