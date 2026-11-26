CREATE TABLE "lab_studies" (
    "id" TEXT NOT NULL,
    "pathway" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "sessions" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "lab_studies_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "exegesis_sessions"
    ADD COLUMN "lab_study_id" TEXT,
    ADD COLUMN "lab_study_position" INTEGER;

CREATE INDEX "exegesis_sessions_user_id_lab_study_id_lab_study_position_idx"
    ON "exegesis_sessions"("user_id", "lab_study_id", "lab_study_position");
