-- Idempotent Stripe webhook delivery.
--
-- A webhook event can be delivered more than once (Stripe retries, and two
-- replicas can receive the same delivery at the same time). The handler
-- previously checked for an existing row and then inserted one, which left a
-- window in which two deliveries of the same event both applied the change.
--
-- A dedicated receipt table with a unique constraint on the event id lets the
-- handler claim an event atomically: the first insert wins, a duplicate fails
-- on the unique index and the handler returns early.
CREATE TABLE IF NOT EXISTS "stripe_webhook_receipts" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stripe_webhook_receipts_pkey" PRIMARY KEY ("id")
);
