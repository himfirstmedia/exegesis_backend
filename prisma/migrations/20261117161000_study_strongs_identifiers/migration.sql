BEGIN;
CREATE TABLE "strongs_identifiers" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "dictionary_id" TEXT,
  CONSTRAINT "strongs_identifiers_valid_id" CHECK ("id" ~ '^[HG][1-9][0-9]*$')
);
CREATE UNIQUE INDEX "strongs_identifiers_dictionary_id_key" ON "strongs_identifiers" ("dictionary_id");
ALTER TABLE "strongs_identifiers" ADD CONSTRAINT "strongs_identifiers_dictionary_id_fkey"
  FOREIGN KEY ("dictionary_id") REFERENCES "strongs_dictionary"("strongsId") ON DELETE SET NULL ON UPDATE CASCADE;
INSERT INTO "strongs_identifiers" ("id", "dictionary_id")
  SELECT DISTINCT "strongs_id", "strongs_id" FROM "study_word_strongs";
ALTER TABLE "study_word_strongs" DROP CONSTRAINT "study_word_strongs_strongs_id_fkey";
ALTER TABLE "study_word_strongs" ADD CONSTRAINT "study_word_strongs_strongs_id_fkey"
  FOREIGN KEY ("strongs_id") REFERENCES "strongs_identifiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
COMMIT;
