-- Converge the migration-built database with schema.prisma.
--
-- The chain of migrations was written against a database that was created
-- with `prisma db push`, so a database built from the migrations alone was
-- missing a number of columns and indexes that the schema declares. This
-- migration brings the two into agreement.
--
-- Every statement is idempotent, so it is a no-op on a database that was
-- already created with `prisma db push`.

-- AlterTable
ALTER TABLE "activity" ALTER COLUMN "user_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "book_prologues" ADD COLUMN IF NOT EXISTS     "sort_order" INTEGER NOT NULL DEFAULT 9999,
ALTER COLUMN "updated_on" DROP DEFAULT;

-- AlterTable
ALTER TABLE "journal_entries" ADD COLUMN IF NOT EXISTS     "source" TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS     "strongs_ids" TEXT,
ADD COLUMN IF NOT EXISTS     "strongs_words" TEXT;

-- AlterTable
ALTER TABLE "journal_prompts" ADD COLUMN IF NOT EXISTS     "book_name" TEXT,
ADD COLUMN IF NOT EXISTS     "chapter" BIGINT,
ADD COLUMN IF NOT EXISTS     "verse_number" BIGINT;

-- AlterTable
ALTER TABLE "system_users" ADD COLUMN IF NOT EXISTS     "access_expires_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS     "account_status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS     "legacy_sower_slot" INTEGER,
ADD COLUMN IF NOT EXISTS     "must_change_password" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS     "stripe_customer_id" TEXT,
ADD COLUMN IF NOT EXISTS     "stripe_subscription_id" TEXT,
ADD COLUMN IF NOT EXISTS     "subscription_tier" TEXT NOT NULL DEFAULT 'free',
ADD COLUMN IF NOT EXISTS     "supporter_badge_text" TEXT;

-- AlterTable
ALTER TABLE "verse_explanations" ADD COLUMN IF NOT EXISTS     "sort_order" INTEGER NOT NULL DEFAULT 9999;

-- AlterTable
ALTER TABLE "verse_study_metadata" ADD COLUMN IF NOT EXISTS     "takeaways" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "daily_verse_display_date_idx" ON "daily_verse"("display_date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "daily_verse_book_name_chapter_verse_number_idx" ON "daily_verse"("book_name", "chapter", "verse_number");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "daily_verse_is_published_display_date_idx" ON "daily_verse"("is_published", "display_date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "journal_prompts_book_name_idx" ON "journal_prompts"("book_name");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "system_users_stripe_customer_id_key" ON "system_users"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "system_users_stripe_subscription_id_key" ON "system_users"("stripe_subscription_id");

