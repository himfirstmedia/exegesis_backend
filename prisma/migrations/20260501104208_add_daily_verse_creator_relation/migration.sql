-- AddForeignKey
ALTER TABLE "daily_verse" ADD CONSTRAINT "daily_verse_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "system_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
