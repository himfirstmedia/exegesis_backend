-- Baseline: create the tables that the migration chain never created.
--
-- The production database was originally built with `prisma db push`, which
-- applies the schema directly and records no migration history. These tables
-- only ever existed in that live database, so a database built from the
-- migration chain was missing them and later migrations failed against a
-- missing table.
--
-- The tables are created in their final shape. The later migrations that
-- originally added columns to them are idempotent, so re-running them is a
-- no-op.

-- CreateTable
CREATE TABLE IF NOT EXISTS "bible_topics" (
    "id" BIGSERIAL NOT NULL,
    "topic_name" TEXT NOT NULL,
    "description" TEXT,
    "verse_refs" TEXT,
    "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_on" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bible_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "chapter_study_tools" (
    "id" BIGSERIAL NOT NULL,
    "book_name" TEXT NOT NULL,
    "chapter" BIGINT NOT NULL,
    "tool_type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "verse_refs" JSONB NOT NULL,
    "strongs_ids" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "chapter_study_tools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "daily_devotion" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "book_name" TEXT,
    "chapter" BIGINT,
    "verse_number" BIGINT,
    "bible_version" TEXT,
    "display_date" TIMESTAMP(3) NOT NULL,
    "display_time" TIMESTAMP(3),
    "reflection" TEXT,
    "explanation" TEXT,
    "learn_more" TEXT,
    "application" TEXT,
    "verse_introduction" TEXT,
    "background_author" TEXT,
    "background_book" TEXT,
    "background_context" TEXT,
    "word_studies" TEXT,
    "practical_applications" TEXT,
    "key_themes" TEXT,
    "cross_references" TEXT,
    "final_thoughts" TEXT,
    "takeaways" TEXT,
    "created_by" TEXT NOT NULL,
    "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_on" TIMESTAMP(3) NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "daily_devotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "daily_exegesis" (
    "id" BIGSERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "passage_reference" TEXT NOT NULL,
    "introduction" TEXT,
    "context_summary" TEXT,
    "teaching_body" TEXT NOT NULL,
    "application" TEXT,
    "prayer" TEXT,
    "tags" TEXT,
    "display_date" TIMESTAMP(3) NOT NULL,
    "display_time" TIMESTAMP(3),
    "created_by" TEXT,
    "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_on" TIMESTAMP(3) NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "daily_exegesis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "exegesis_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "passage_ref" TEXT NOT NULL,
    "book_name" TEXT NOT NULL,
    "chapter" BIGINT NOT NULL,
    "verse_start" BIGINT,
    "verse_end" BIGINT,
    "current_stage" TEXT NOT NULL DEFAULT 'look',
    "look_notes" TEXT,
    "look_prompts_json" TEXT,
    "listen_completed" BOOLEAN NOT NULL DEFAULT false,
    "listen_duration" INTEGER,
    "listen_elapsed" INTEGER,
    "learn_notes" TEXT,
    "abide_reflection" TEXT,
    "abide_prayer" TEXT,
    "abide_application" TEXT,
    "abide_tags" TEXT,
    "strongs_words" TEXT,
    "strongs_ids" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "journal_entry_id" BIGINT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_on" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exegesis_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "journal_likes" (
    "id" BIGSERIAL NOT NULL,
    "entry_id" BIGINT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "popular_search_log" (
    "id" BIGSERIAL NOT NULL,
    "query" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'bible',
    "language" TEXT NOT NULL DEFAULT 'en',
    "user_id" TEXT,
    "ip_address" TEXT,
    "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "popular_search_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "push_settings" (
    "user_id" TEXT NOT NULL,
    "daily_verse_reminder" BOOLEAN NOT NULL DEFAULT true,
    "reminder_time" TEXT NOT NULL DEFAULT '09:00',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "last_pushed_on" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_settings_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "push_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'web',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "search_index" (
    "id" BIGSERIAL NOT NULL,
    "translation" TEXT NOT NULL,
    "book_number" INTEGER NOT NULL,
    "book_name" TEXT NOT NULL,
    "chapter" INTEGER NOT NULL,
    "verse" INTEGER NOT NULL,
    "verse_text" TEXT NOT NULL,
    "verse_tsv" tsvector,

    CONSTRAINT "search_index_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "site_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_by" TEXT,
    "updated_on" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "strongs_dictionary" (
    "strongsId" TEXT NOT NULL,
    "originalWord" TEXT,
    "transliteration" TEXT,
    "pronunciation" TEXT,
    "short_definition" TEXT NOT NULL,
    "full_definition" TEXT,
    "language" TEXT NOT NULL DEFAULT 'greek',
    "usage_count" INTEGER,
    "part_of_speech" TEXT,
    "grammatical_case" TEXT,
    "gender" TEXT,
    "number" TEXT,
    "cross_references" TEXT,
    "admin_explanation" TEXT,
    "verse_references" JSONB,
    "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_on" TIMESTAMP(3),

    CONSTRAINT "strongs_dictionary_pkey" PRIMARY KEY ("strongsId")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "study_tool_words" (
    "id" BIGSERIAL NOT NULL,
    "study_tool_id" BIGINT NOT NULL,
    "strongs_id" TEXT NOT NULL,
    "book_name" TEXT NOT NULL,
    "chapter" BIGINT NOT NULL,
    "verse" BIGINT NOT NULL,
    "surface_text" TEXT NOT NULL,
    "original_word" TEXT,
    "transliteration" TEXT,
    "admin_explanation" TEXT,
    "word_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "study_tool_words_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "subscription_events" (
    "id" BIGSERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "stripe_event_id" TEXT,
    "metadata" JSONB,
    "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "subscription_tiers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "interval" TEXT NOT NULL DEFAULT 'year',
    "stripe_product_id" TEXT,
    "stripe_price_id" TEXT,
    "features" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "max_slots" INTEGER,
    "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_on" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "trivia_answers" (
    "id" BIGSERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "question_id" BIGINT NOT NULL,
    "selected_answer" INTEGER NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "answered_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trivia_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "trivia_questions" (
    "id" BIGSERIAL NOT NULL,
    "question" TEXT NOT NULL,
    "options_json" TEXT NOT NULL,
    "correct_answer" INTEGER NOT NULL,
    "explanation" TEXT,
    "book_name" TEXT,
    "chapter" BIGINT,
    "verse_number" BIGINT,
    "category" TEXT DEFAULT 'general',
    "difficulty" TEXT DEFAULT 'medium',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_on" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trivia_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "verse_resources" (
    "id" BIGSERIAL NOT NULL,
    "book_name" TEXT NOT NULL,
    "chapter" BIGINT NOT NULL,
    "verse_start" BIGINT NOT NULL,
    "verse_end" BIGINT,
    "commentaries" TEXT,
    "cross_references" TEXT,
    "word_studies" TEXT,
    "dictionary_terms" TEXT,
    "interlinear_words" TEXT,
    "related_topics" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "created_by" TEXT,
    "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_on" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verse_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "verse_word_studies" (
    "id" BIGSERIAL NOT NULL,
    "strongs_id" TEXT NOT NULL,
    "book_name" TEXT NOT NULL,
    "chapter" INTEGER NOT NULL,
    "verse" INTEGER,
    "translation" TEXT NOT NULL DEFAULT 'BSB',
    "surface_text" TEXT,
    "admin_explanation" TEXT,
    "created_by" TEXT,
    "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,
    "updated_on" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verse_word_studies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "verse_words" (
    "id" BIGSERIAL NOT NULL,
    "translation" TEXT NOT NULL DEFAULT 'BSB',
    "book_name" TEXT NOT NULL,
    "chapter" BIGINT NOT NULL,
    "verse" BIGINT NOT NULL,
    "word_order" INTEGER NOT NULL,
    "surface_text" TEXT NOT NULL,
    "strongs_id" TEXT,
    "lemma" TEXT,
    "morphology" TEXT,

    CONSTRAINT "verse_words_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "bible_topics_topic_name_key" ON "bible_topics"("topic_name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "bible_topics_topic_name_idx" ON "bible_topics"("topic_name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "chapter_study_tools_book_name_chapter_idx" ON "chapter_study_tools"("book_name", "chapter");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "chapter_study_tools_book_name_chapter_tool_type_label_key" ON "chapter_study_tools"("book_name", "chapter", "tool_type", "label");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "daily_devotion_display_date_idx" ON "daily_devotion"("display_date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "daily_devotion_book_name_chapter_verse_number_idx" ON "daily_devotion"("book_name", "chapter", "verse_number");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "daily_devotion_is_published_display_date_idx" ON "daily_devotion"("is_published", "display_date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "daily_exegesis_display_date_idx" ON "daily_exegesis"("display_date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "daily_exegesis_is_published_display_date_idx" ON "daily_exegesis"("is_published", "display_date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "exegesis_sessions_user_id_idx" ON "exegesis_sessions"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "exegesis_sessions_user_id_completed_idx" ON "exegesis_sessions"("user_id", "completed");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "exegesis_sessions_user_id_created_on_idx" ON "exegesis_sessions"("user_id", "created_on");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "journal_likes_entry_id_idx" ON "journal_likes"("entry_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "journal_likes_user_id_idx" ON "journal_likes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "journal_likes_entry_id_user_id_key" ON "journal_likes"("entry_id", "user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "popular_search_log_created_on_idx" ON "popular_search_log"("created_on");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "popular_search_log_query_scope_created_on_idx" ON "popular_search_log"("query", "scope", "created_on");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "popular_search_log_scope_created_on_idx" ON "popular_search_log"("scope", "created_on");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "push_tokens_token_key" ON "push_tokens"("token");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "push_tokens_user_id_idx" ON "push_tokens"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "search_index_translation_book_number_idx" ON "search_index"("translation", "book_number");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "search_index_verse_tsv_idx" ON "search_index" USING GIN ("verse_tsv");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "study_tool_words_study_tool_id_idx" ON "study_tool_words"("study_tool_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "study_tool_words_strongs_id_idx" ON "study_tool_words"("strongs_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "subscription_events_user_id_idx" ON "subscription_events"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "subscription_events_created_on_idx" ON "subscription_events"("created_on");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "subscription_tiers_name_key" ON "subscription_tiers"("name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "trivia_answers_user_id_idx" ON "trivia_answers"("user_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "trivia_answers_question_id_idx" ON "trivia_answers"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "trivia_answers_user_id_question_id_key" ON "trivia_answers"("user_id", "question_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "trivia_questions_category_idx" ON "trivia_questions"("category");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "trivia_questions_difficulty_idx" ON "trivia_questions"("difficulty");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "trivia_questions_is_active_idx" ON "trivia_questions"("is_active");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "verse_resources_book_name_chapter_idx" ON "verse_resources"("book_name", "chapter");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "verse_resources_book_name_chapter_verse_start_key" ON "verse_resources"("book_name", "chapter", "verse_start");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "verse_word_studies_strongs_id_idx" ON "verse_word_studies"("strongs_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "verse_word_studies_book_name_chapter_idx" ON "verse_word_studies"("book_name", "chapter");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "verse_word_studies_strongs_id_book_name_chapter_verse_trans_key" ON "verse_word_studies"("strongs_id", "book_name", "chapter", "verse", "translation");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "verse_words_translation_book_name_chapter_verse_idx" ON "verse_words"("translation", "book_name", "chapter", "verse");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "verse_words_strongs_id_idx" ON "verse_words"("strongs_id");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "verse_words_translation_book_name_chapter_verse_word_order_key" ON "verse_words"("translation", "book_name", "chapter", "verse", "word_order");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "daily_devotion" ADD CONSTRAINT "daily_devotion_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "system_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "daily_exegesis" ADD CONSTRAINT "daily_exegesis_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "system_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "exegesis_sessions" ADD CONSTRAINT "exegesis_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "system_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "journal_likes" ADD CONSTRAINT "journal_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "system_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "push_settings" ADD CONSTRAINT "push_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "system_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "system_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "study_tool_words" ADD CONSTRAINT "study_tool_words_study_tool_id_fkey" FOREIGN KEY ("study_tool_id") REFERENCES "chapter_study_tools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "study_tool_words" ADD CONSTRAINT "study_tool_words_strongs_id_fkey" FOREIGN KEY ("strongs_id") REFERENCES "strongs_dictionary"("strongsId") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "subscription_events" ADD CONSTRAINT "subscription_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "system_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "trivia_answers" ADD CONSTRAINT "trivia_answers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "system_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "trivia_answers" ADD CONSTRAINT "trivia_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "trivia_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "verse_word_studies" ADD CONSTRAINT "verse_word_studies_strongs_id_fkey" FOREIGN KEY ("strongs_id") REFERENCES "strongs_dictionary"("strongsId") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "verse_words" ADD CONSTRAINT "verse_words_strongs_id_fkey" FOREIGN KEY ("strongs_id") REFERENCES "strongs_dictionary"("strongsId") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
