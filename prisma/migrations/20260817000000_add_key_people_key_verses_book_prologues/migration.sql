-- Add "Key People" and "Key Verses" detail lines to book prologues.
ALTER TABLE "book_prologues"
  ADD COLUMN "key_people" JSONB,
  ADD COLUMN "key_verses" JSONB;
