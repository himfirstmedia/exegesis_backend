-- CreateEnum
-- Additive only: legacy content and response contracts remain untouched.
BEGIN;
CREATE TYPE "SharedStudyStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED');

-- AlterTable
ALTER TABLE "daily_verse" ADD COLUMN     "shared_study_id" BIGINT;

-- AlterTable
ALTER TABLE "daily_devotion" ADD COLUMN     "shared_study_id" BIGINT;

-- AlterTable
ALTER TABLE "verse_explanations" ADD COLUMN     "shared_study_id" BIGINT;

-- CreateTable
CREATE TABLE "bible_books" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "bible_books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bible_editions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "bible_editions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scripture_passages" (
    "id" BIGSERIAL NOT NULL,
    "book_id" INTEGER NOT NULL,
    "start_chapter" INTEGER NOT NULL,
    "start_verse" INTEGER NOT NULL,
    "end_chapter" INTEGER NOT NULL,
    "end_verse" INTEGER NOT NULL,

    CONSTRAINT "scripture_passages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passage_studies" (
    "id" BIGSERIAL NOT NULL,
    "passage_id" BIGINT NOT NULL,
    "bible_edition_id" TEXT NOT NULL,
    "language_code" TEXT NOT NULL DEFAULT 'en',
    "status" "SharedStudyStatus" NOT NULL DEFAULT 'DRAFT',
    "introduction" TEXT,
    "explanation" TEXT,
    "application" TEXT,
    "background_author" TEXT,
    "background_book" TEXT,
    "background_context" TEXT,
    "final_thoughts" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_on" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "passage_studies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_takeaways" (
    "id" BIGSERIAL NOT NULL,
    "study_id" BIGINT NOT NULL,
    "text" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "study_takeaways_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_practical_applications" (
    "id" BIGSERIAL NOT NULL,
    "study_id" BIGINT NOT NULL,
    "text" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "study_practical_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_themes" (
    "id" BIGSERIAL NOT NULL,
    "study_id" BIGINT NOT NULL,
    "text" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "study_themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_words" (
    "id" BIGSERIAL NOT NULL,
    "study_id" BIGINT NOT NULL,
    "surface_text" TEXT NOT NULL,
    "contextual_meaning" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "study_words_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_word_strongs" (
    "study_word_id" BIGINT NOT NULL,
    "strongs_id" TEXT NOT NULL,

    CONSTRAINT "study_word_strongs_pkey" PRIMARY KEY ("study_word_id","strongs_id")
);

-- CreateTable
CREATE TABLE "study_cross_references" (
    "id" BIGSERIAL NOT NULL,
    "study_id" BIGINT NOT NULL,
    "passage_id" BIGINT NOT NULL,
    "bible_edition_id" TEXT NOT NULL,
    "quotation_override" TEXT,
    "commentary" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "study_cross_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_migration_sources" (
    "id" BIGSERIAL NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_id" BIGINT NOT NULL,
    "source_hash" TEXT NOT NULL,
    "original" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "issues" JSONB NOT NULL,
    "study_id" BIGINT,
    "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_migration_sources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bible_books_name_key" ON "bible_books"("name");

-- CreateIndex
CREATE UNIQUE INDEX "scripture_passages_book_id_start_chapter_start_verse_end_ch_key" ON "scripture_passages"("book_id", "start_chapter", "start_verse", "end_chapter", "end_verse");

-- CreateIndex
CREATE UNIQUE INDEX "passage_studies_passage_id_bible_edition_id_language_code_key" ON "passage_studies"("passage_id", "bible_edition_id", "language_code");

-- CreateIndex
CREATE INDEX "study_takeaways_study_id_sort_order_idx" ON "study_takeaways"("study_id", "sort_order");

-- CreateIndex
CREATE INDEX "study_practical_applications_study_id_sort_order_idx" ON "study_practical_applications"("study_id", "sort_order");

-- CreateIndex
CREATE INDEX "study_themes_study_id_sort_order_idx" ON "study_themes"("study_id", "sort_order");

-- CreateIndex
CREATE INDEX "study_words_study_id_sort_order_idx" ON "study_words"("study_id", "sort_order");

-- CreateIndex
CREATE INDEX "study_word_strongs_strongs_id_idx" ON "study_word_strongs"("strongs_id");

-- CreateIndex
CREATE INDEX "study_cross_references_study_id_sort_order_idx" ON "study_cross_references"("study_id", "sort_order");

-- CreateIndex
CREATE INDEX "study_cross_references_passage_id_idx" ON "study_cross_references"("passage_id");

-- CreateIndex
CREATE INDEX "study_migration_sources_status_idx" ON "study_migration_sources"("status");

-- CreateIndex
CREATE UNIQUE INDEX "study_migration_sources_source_type_source_id_key" ON "study_migration_sources"("source_type", "source_id");

-- AddForeignKey
ALTER TABLE "daily_verse" ADD CONSTRAINT "daily_verse_shared_study_id_fkey" FOREIGN KEY ("shared_study_id") REFERENCES "passage_studies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_devotion" ADD CONSTRAINT "daily_devotion_shared_study_id_fkey" FOREIGN KEY ("shared_study_id") REFERENCES "passage_studies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verse_explanations" ADD CONSTRAINT "verse_explanations_shared_study_id_fkey" FOREIGN KEY ("shared_study_id") REFERENCES "passage_studies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scripture_passages" ADD CONSTRAINT "scripture_passages_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "bible_books"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passage_studies" ADD CONSTRAINT "passage_studies_passage_id_fkey" FOREIGN KEY ("passage_id") REFERENCES "scripture_passages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passage_studies" ADD CONSTRAINT "passage_studies_bible_edition_id_fkey" FOREIGN KEY ("bible_edition_id") REFERENCES "bible_editions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_takeaways" ADD CONSTRAINT "study_takeaways_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "passage_studies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_practical_applications" ADD CONSTRAINT "study_practical_applications_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "passage_studies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_themes" ADD CONSTRAINT "study_themes_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "passage_studies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_words" ADD CONSTRAINT "study_words_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "passage_studies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_word_strongs" ADD CONSTRAINT "study_word_strongs_study_word_id_fkey" FOREIGN KEY ("study_word_id") REFERENCES "study_words"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_word_strongs" ADD CONSTRAINT "study_word_strongs_strongs_id_fkey" FOREIGN KEY ("strongs_id") REFERENCES "strongs_dictionary"("strongsId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_cross_references" ADD CONSTRAINT "study_cross_references_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "passage_studies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_cross_references" ADD CONSTRAINT "study_cross_references_passage_id_fkey" FOREIGN KEY ("passage_id") REFERENCES "scripture_passages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_cross_references" ADD CONSTRAINT "study_cross_references_bible_edition_id_fkey" FOREIGN KEY ("bible_edition_id") REFERENCES "bible_editions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_migration_sources" ADD CONSTRAINT "study_migration_sources_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "passage_studies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "scripture_passages" ADD CONSTRAINT "scripture_passages_valid_range"
CHECK ("start_chapter" > 0 AND "start_verse" > 0 AND "end_chapter" >= "start_chapter" AND "end_verse" > 0
  AND ("end_chapter" > "start_chapter" OR "end_verse" >= "start_verse"));
ALTER TABLE "study_migration_sources" ADD CONSTRAINT "study_migration_sources_valid_status"
CHECK ("status" IN ('LINKED', 'CONFLICT', 'INVALID', 'NO_PASSAGE'));
COMMIT;
