-- The default explanation browse query ranks timestamped rows by this expression.
-- Legacy rows without root timestamps are ranked separately using the linked study.
CREATE INDEX "verse_explanations_activity_idx"
ON "verse_explanations" ((GREATEST("created_on", "updated_on")) DESC, "book_name", "chapter", "verse_number")
WHERE "created_on" IS NOT NULL OR "updated_on" IS NOT NULL;

CREATE INDEX "verse_explanations_created_by_idx" ON "verse_explanations" ("created_by");
CREATE INDEX "verse_explanations_updated_by_idx" ON "verse_explanations" ("updated_by");

CREATE INDEX "daily_verse_activity_idx" ON "daily_verse" ("updated_on" DESC, "created_on" DESC, "id" DESC);
CREATE INDEX "daily_verse_created_by_idx" ON "daily_verse" ("created_by");
CREATE INDEX "daily_verse_updated_by_idx" ON "daily_verse" ("updated_by");
