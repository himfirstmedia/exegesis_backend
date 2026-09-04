-- verify_strongs.sql
-- Run this against your Postgres database to find Strong's IDs referenced
-- by verse_word_studies_detailed that are missing from strongs_dictionary.

-- 1) List distinct missing strongs IDs referenced by word studies
SELECT DISTINCT v.strongs_id
FROM verse_word_studies_detailed v
LEFT JOIN strongs_dictionary s ON v.strongs_id = s.strongs_id
WHERE v.strongs_id IS NOT NULL
  AND s.strongs_id IS NULL
ORDER BY v.strongs_id;

-- 2) Show counts (how many rows reference each missing strongsId)
SELECT v.strongs_id, COUNT(*) AS occurrences
FROM verse_word_studies_detailed v
LEFT JOIN strongs_dictionary s ON v.strongs_id = s.strongs_id
WHERE v.strongs_id IS NOT NULL
  AND s.strongs_id IS NULL
GROUP BY v.strongs_id
ORDER BY occurrences DESC;

-- 3) Inspect existing strongs entries for a small list (replace IDs as needed)
-- Example:
-- SELECT strongs_id, short_definition, full_definition, language, created_on
-- FROM strongs_dictionary
-- WHERE strongs_id IN ('H3034','H3068');

-- 4) Inspect verse_word_studies_detailed rows for a given explanation id
-- Replace <EXPLANATION_ID> with the numeric id you want to inspect
-- SELECT * FROM verse_word_studies_detailed WHERE explanation_id = <EXPLANATION_ID>;

-- Notes:
-- Run with psql: psql "$DATABASE_URL" -f backend/scripts/verify_strongs.sql
-- Or paste the queries into your DB client.
