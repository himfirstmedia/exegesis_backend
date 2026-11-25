-- Exegesis Lab Phase 2: additive artifact persistence and explicit lifecycle markers.
-- Existing sessions remain on artifact version 1; new API-created sessions use version 2.
-- Nullable artifact columns require no backfill. Legacy fields remain authoritative
-- fallbacks when aggregating older sessions into the Legacy Ledger.
BEGIN;

ALTER TABLE "exegesis_sessions" ADD COLUMN IF NOT EXISTS "artifact_version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "exegesis_sessions" ALTER COLUMN "artifact_version" SET DEFAULT 2;
ALTER TABLE "exegesis_sessions" ADD COLUMN IF NOT EXISTS "look_observations" JSONB;
ALTER TABLE "exegesis_sessions" ADD COLUMN IF NOT EXISTS "look_highlights" JSONB;
ALTER TABLE "exegesis_sessions" ADD COLUMN IF NOT EXISTS "look_questions" JSONB;
ALTER TABLE "exegesis_sessions" ADD COLUMN IF NOT EXISTS "listen_selections" JSONB;
ALTER TABLE "exegesis_sessions" ADD COLUMN IF NOT EXISTS "listen_notes" TEXT;
ALTER TABLE "exegesis_sessions" ADD COLUMN IF NOT EXISTS "listen_questions" JSONB;
ALTER TABLE "exegesis_sessions" ADD COLUMN IF NOT EXISTS "listen_repeats" INTEGER;
ALTER TABLE "exegesis_sessions" ADD COLUMN IF NOT EXISTS "listen_repeat_count" INTEGER;
ALTER TABLE "exegesis_sessions" ADD COLUMN IF NOT EXISTS "learn_summary" TEXT;
ALTER TABLE "exegesis_sessions" ADD COLUMN IF NOT EXISTS "learn_questions" JSONB;
ALTER TABLE "exegesis_sessions" ADD COLUMN IF NOT EXISTS "abide_selected_verse" TEXT;
ALTER TABLE "exegesis_sessions" ADD COLUMN IF NOT EXISTS "abide_truth" TEXT;
ALTER TABLE "exegesis_sessions" ADD COLUMN IF NOT EXISTS "apply_principle" TEXT;
ALTER TABLE "exegesis_sessions" ADD COLUMN IF NOT EXISTS "apply_response" TEXT;
ALTER TABLE "exegesis_sessions" ADD COLUMN IF NOT EXISTS "apply_challenge" TEXT;
ALTER TABLE "exegesis_sessions" ADD COLUMN IF NOT EXISTS "apply_timing" JSONB;
ALTER TABLE "exegesis_sessions" ADD COLUMN IF NOT EXISTS "apply_reminder" JSONB;
ALTER TABLE "exegesis_sessions" ADD COLUMN IF NOT EXISTS "apply_results" JSONB;
ALTER TABLE "exegesis_sessions" ADD COLUMN IF NOT EXISTS "apply_saved_on" TIMESTAMP(3);
ALTER TABLE "exegesis_sessions" ADD COLUMN IF NOT EXISTS "completed_on" TIMESTAMP(3);

-- A second stable link prevents replayed Ledger saves from creating duplicates
-- when the session's journal_entry_id is null or points to a deleted entry.
ALTER TABLE "journal_entries" ADD COLUMN IF NOT EXISTS "source_session_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "journal_entries_source_session_id_key"
  ON "journal_entries" ("source_session_id");

COMMIT;
