-- Add rich Book Overview sections to book prologues (Genesis seed data).
ALTER TABLE "book_prologues"
  ADD COLUMN "author_detail" TEXT,
  ADD COLUMN "background" TEXT,
  ADD COLUMN "lessons" TEXT,
  ADD COLUMN "chapters" INTEGER,
  ADD COLUMN "structure" JSONB,
  ADD COLUMN "applications" JSONB,
  ADD COLUMN "key_scripture" JSONB;
