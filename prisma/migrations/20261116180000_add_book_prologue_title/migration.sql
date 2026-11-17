-- Preserve all existing prologues; older records have no custom title.
ALTER TABLE "book_prologues" ADD COLUMN "title" TEXT;
