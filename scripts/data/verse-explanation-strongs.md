# Verse explanation Strong’s backfill

`verse-explanation-strongs.json` identifies existing editorial rows by passage,
zero-based sort order, and trimmed surface text. It is a reviewed data snapshot,
not a dictionary or an automatic matcher. The IDs were aligned using the TAHOT
and TBESH data from [STEPBible Data](https://STEPBible.github.io/STEPBible-Data)
(Tyndale House Cambridge and STEPBible.org, CC BY 4.0), supplemented by the
[Open Scriptures Hebrew lexicon](https://github.com/openscriptures/HebrewLexicon).
Extended lexicon codes were reduced to base Strong’s numbers. Compound
expressions may have multiple IDs; named roots and etymological notes can
reference lexemes outside the immediate verse.

Three rows titled “Biblical Insight from the Word Study” are commentary, not
lexical entries. An empty ID list is deliberate for those rows. The backfill
adds canonical links, not fake dictionary rows or legacy foreign keys.

From `backend/`, review the target and proposed changes with
`node scripts/backfill-verse-explanation-strongs.mjs`; then add `--apply` to write.
Existing IDs are never replaced. If new or changed rows do not match the snapshot,
the script stops before writing so their IDs can be reviewed.
