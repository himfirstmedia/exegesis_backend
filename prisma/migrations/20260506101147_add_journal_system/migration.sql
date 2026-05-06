-- CreateTable
CREATE TABLE "journal_entries" (
    "id" BIGSERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "book_name" TEXT,
    "chapter" BIGINT,
    "verse_number" BIGINT,
    "category" TEXT DEFAULT 'general',
    "mood" TEXT,
    "prayers" TEXT,
    "gratitude" TEXT,
    "learnings" TEXT,
    "application" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT,
    "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_on" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_prompts" (
    "id" BIGSERIAL NOT NULL,
    "prompt" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_on" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_prompts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_templates" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "prompts_json" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_on" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "journal_entries_user_id_idx" ON "journal_entries"("user_id");

-- CreateIndex
CREATE INDEX "journal_entries_user_id_created_on_idx" ON "journal_entries"("user_id", "created_on");

-- CreateIndex
CREATE INDEX "journal_entries_book_name_chapter_idx" ON "journal_entries"("book_name", "chapter");

-- CreateIndex
CREATE INDEX "journal_entries_category_idx" ON "journal_entries"("category");

-- CreateIndex
CREATE INDEX "journal_prompts_category_idx" ON "journal_prompts"("category");

-- CreateIndex
CREATE INDEX "journal_prompts_is_active_idx" ON "journal_prompts"("is_active");

-- CreateIndex
CREATE INDEX "journal_templates_category_idx" ON "journal_templates"("category");

-- CreateIndex
CREATE INDEX "journal_templates_is_active_idx" ON "journal_templates"("is_active");

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "system_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
