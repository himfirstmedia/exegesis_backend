-- backfill_missing_strongs.sql
-- Backfill minimal StrongsDictionary entries for any strongsId referenced
-- by verse_word_studies_detailed but missing in strongs_dictionary.
-- This script inserts safe placeholder rows so FK constraints on
-- verse_word_studies_detailed can reference existing strongs_id values.

-- IMPORTANT: Review results after running and replace placeholder
-- short_definition/full_definition with authoritative data when available.

BEGIN;

INSERT INTO strongs_dictionary (strongs_id, short_definition, full_definition, language, created_on)
SELECT DISTINCT v.strongs_id,
       CONCAT('Backfilled placeholder for ', v.strongs_id) AS short_definition,
       NULL::text as full_definition,
       'hebrew' as language,
       NOW() as created_on
FROM verse_word_studies_detailed v
LEFT JOIN strongs_dictionary s ON v.strongs_id = s.strongs_id
WHERE v.strongs_id IS NOT NULL
  AND s.strongs_id IS NULL
ON CONFLICT (strongs_id) DO NOTHING;

COMMIT;

-- How to run:
-- psql "$DATABASE_URL" -f backend/scripts/backfill_missing_strongs.sql

-- Verification after run:
-- SELECT COUNT(*) FROM verse_word_studies_detailed v
-- LEFT JOIN strongs_dictionary s ON v.strongs_id = s.strongs_id
-- WHERE v.strongs_id IS NOT NULL AND s.strongs_id IS NULL;
-- This should return 0.
