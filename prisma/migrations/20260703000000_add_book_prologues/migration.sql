CREATE TABLE IF NOT EXISTS "book_prologues" (
  "book_name" TEXT PRIMARY KEY,
  "author" TEXT,
  "audience" TEXT,
  "date_written" TEXT,
  "location_written" TEXT,
  "purpose" TEXT,
  "key_theme" TEXT,
  "summary" TEXT,
  "main_themes" JSONB,
  "christ_connection" TEXT,
  "created_by" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_by" TEXT,
  "updated_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
