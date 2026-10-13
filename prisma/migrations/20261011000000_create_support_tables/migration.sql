CREATE TABLE IF NOT EXISTS "support_tickets" (
  "id" BIGSERIAL NOT NULL,
  "ticket_code" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'other',
  "priority" TEXT NOT NULL DEFAULT 'normal',
  "status" TEXT NOT NULL DEFAULT 'open',
  "device_info" TEXT,
  "admin_unread" BOOLEAN NOT NULL DEFAULT true,
  "user_unread" BOOLEAN NOT NULL DEFAULT false,
  "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolved_at" TIMESTAMP(3),
  "resolved_by" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_on" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id")
    REFERENCES "system_users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "support_messages" (
  "id" BIGSERIAL NOT NULL,
  "ticket_id" BIGINT NOT NULL,
  "sender_id" TEXT NOT NULL,
  "sender_role" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "attachment" TEXT,
  "attachment_name" TEXT,
  "created_on" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "support_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id")
    REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "support_messages_sender_id_fkey" FOREIGN KEY ("sender_id")
    REFERENCES "system_users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "support_tickets_ticket_code_key"
  ON "support_tickets"("ticket_code");
CREATE INDEX IF NOT EXISTS "support_tickets_user_id_last_message_at_idx"
  ON "support_tickets"("user_id", "last_message_at");
CREATE INDEX IF NOT EXISTS "support_tickets_status_last_message_at_idx"
  ON "support_tickets"("status", "last_message_at");
CREATE INDEX IF NOT EXISTS "support_messages_ticket_id_created_on_idx"
  ON "support_messages"("ticket_id", "created_on");
