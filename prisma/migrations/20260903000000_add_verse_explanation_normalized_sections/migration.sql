-- CreateTable: verse_exegesis
CREATE TABLE "verse_exegesis" (
    "id" BIGSERIAL NOT NULL,
    "explanation_id" BIGINT NOT NULL,
    "explanation_text" TEXT NOT NULL,
    "application_text" TEXT,
    CONSTRAINT "verse_exegesis_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "verse_exegesis_explanation_id_key" ON "verse_exegesis"("explanation_id");
ALTER TABLE "verse_exegesis" ADD CONSTRAINT "verse_exegesis_explanation_id_fkey" FOREIGN KEY ("explanation_id") REFERENCES "verse_explanations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: verse_study_metadata
CREATE TABLE "verse_study_metadata" (
    "id" BIGSERIAL NOT NULL,
    "explanation_id" BIGINT NOT NULL,
    "introduction" TEXT,
    "background_author" TEXT,
    "background_book" TEXT,
    "background_context" TEXT,
    "final_thoughts" TEXT,
    CONSTRAINT "verse_study_metadata_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "verse_study_metadata_explanation_id_key" ON "verse_study_metadata"("explanation_id");
ALTER TABLE "verse_study_metadata" ADD CONSTRAINT "verse_study_metadata_explanation_id_fkey" FOREIGN KEY ("explanation_id") REFERENCES "verse_explanations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: verse_word_studies_detailed
CREATE TABLE "verse_word_studies_detailed" (
    "id" BIGSERIAL NOT NULL,
    "explanation_id" BIGINT NOT NULL,
    "strongsId" TEXT,
    "surface_text" TEXT,
    "custom_definition" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "verse_word_studies_detailed_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "verse_word_studies_detailed" ADD CONSTRAINT "verse_word_studies_detailed_explanation_id_fkey" FOREIGN KEY ("explanation_id") REFERENCES "verse_explanations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "verse_word_studies_detailed" ADD CONSTRAINT "verse_word_studies_detailed_strongsId_fkey" FOREIGN KEY ("strongsId") REFERENCES "strongs_dictionary"("strongsId") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: verse_practical_applications
CREATE TABLE "verse_practical_applications" (
    "id" BIGSERIAL NOT NULL,
    "explanation_id" BIGINT NOT NULL,
    "application_text" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "verse_practical_applications_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "verse_practical_applications" ADD CONSTRAINT "verse_practical_applications_explanation_id_fkey" FOREIGN KEY ("explanation_id") REFERENCES "verse_explanations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: verse_cross_references
CREATE TABLE "verse_cross_references" (
    "id" BIGSERIAL NOT NULL,
    "explanation_id" BIGINT NOT NULL,
    "book_name" TEXT NOT NULL,
    "chapter" BIGINT NOT NULL,
    "verse_number" BIGINT NOT NULL,
    "reference_text" TEXT,
    "commentary" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "verse_cross_references_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "verse_cross_references" ADD CONSTRAINT "verse_cross_references_explanation_id_fkey" FOREIGN KEY ("explanation_id") REFERENCES "verse_explanations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: verse_themes
CREATE TABLE "verse_themes" (
    "id" BIGSERIAL NOT NULL,
    "explanation_id" BIGINT NOT NULL,
    "theme_name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "verse_themes_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "verse_themes" ADD CONSTRAINT "verse_themes_explanation_id_fkey" FOREIGN KEY ("explanation_id") REFERENCES "verse_explanations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- MigrateData: existing explanation/learn_more columns into verse_exegesis
INSERT INTO "verse_exegesis" ("explanation_id", "explanation_text", "application_text")
SELECT "id", "explanation", "learn_more" FROM "verse_explanations"
WHERE "explanation" IS NOT NULL;

-- DropColumns: remove old JSON-blob columns
ALTER TABLE "verse_explanations" DROP COLUMN "explanation",
DROP COLUMN "learn_more",
DROP COLUMN "prompt_ids";
