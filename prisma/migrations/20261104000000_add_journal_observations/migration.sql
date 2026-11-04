-- Add observations to journal entries.
-- The wireframe's journal_entries model distinguishes "observations"
-- (what the text says) from "reflection" (stored as content) and "prayer"
-- (stored as prayers). Additive and nullable, so no backfill is required.
ALTER TABLE "journal_entries" ADD COLUMN IF NOT EXISTS "observations" TEXT;
