ALTER TABLE verse_study_metadata
  ADD COLUMN IF NOT EXISTS takeaways TEXT;

-- Optional backfill for existing rows when the metadata was previously stored elsewhere.
UPDATE verse_study_metadata
SET takeaways = NULL
WHERE takeaways IS NULL;
