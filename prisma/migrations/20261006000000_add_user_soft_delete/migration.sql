-- Soft-delete support for account deletion.
-- Billing records are retained (audit/tax) instead of hard-deleting the user.
ALTER TABLE "system_users" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "system_users" ADD COLUMN "deleted_email" TEXT;