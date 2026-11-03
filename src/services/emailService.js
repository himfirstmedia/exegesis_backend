import { getTransporter, buildMailOptions } from "../config/email.js";
import { prisma } from "../config/db.js";
import { isTransientDbError } from "../utils/dbRetry.js";
const MAX_RETRIES = 3;
const BATCH_SIZE = 5;

export const sendEmail = async (to, subject, htmlContent) => {
  const transporter = getTransporter();

  const mailOptions = buildMailOptions({
    to,
    subject,
    html: htmlContent,
  });

  return transporter.sendMail(mailOptions);
};

export const processPendingMessages = async () => {
  let pendingMessages;

  try {
    pendingMessages = await prisma.message.findMany({
      where: {
        status: "PENDING",
        failCount: { lt: MAX_RETRIES },
      },
      take: BATCH_SIZE,
      orderBy: { createdOn: "asc" },
    });
  } catch (dbError) {
    console.error("[EmailScheduler] DB query failed:", dbError.message);
    // Let the scheduler apply backoff when the database itself is down,
    // instead of silently retrying every tick against a dead pool.
    if (isTransientDbError(dbError)) throw dbError;
    return;
  }

  if (!pendingMessages || pendingMessages.length === 0) {
    return { processed: 0, sent: 0, failed: 0 };
  }

  console.log(`[EmailScheduler] Processing ${pendingMessages.length} pending messages`);

  let sent = 0;
  let failed = 0;

  for (const msg of pendingMessages) {
    // A queued row with no usable recipient can never succeed; fail it once
    // instead of burning every retry on an SMTP error.
    if (!msg.recipient || !msg.recipient.includes("@")) {
      failed += 1;
      await prisma.message
        .update({
          where: { id: msg.id },
          data: {
            status: "FAILED",
            lastError: "Invalid recipient address",
            updatedOn: new Date(),
          },
        })
        .catch(updateError =>
          console.error(
            "[EmailScheduler] Failed to update message status:",
            updateError.message,
          ),
        );
      console.error(
        `[EmailScheduler] Message ${msg.id} has an invalid recipient; marked FAILED`,
      );
      continue;
    }

    try {
      await sendEmail(msg.recipient, msg.subject || "Exegesis Project Notification", msg.message);

      await prisma.message.update({
        where: { id: msg.id },
        data: {
          status: "SENT",
          sentOn: new Date(),
          sendCount: { increment: 1 },
          updatedOn: new Date(),
        },
      });

      sent += 1;
      console.log(`[EmailScheduler] Email sent successfully to ${msg.recipient}`);
    } catch (error) {
      failed += 1;
      console.error(`[EmailScheduler] Failed to send email to ${msg.recipient}:`, error.message);

      // Prefer the per-row cap when the queue manager set one.
      const maxRetries =
        typeof msg.maxRetries === "number" && msg.maxRetries > 0
          ? msg.maxRetries
          : MAX_RETRIES;
      const newFailCount = (msg.failCount || 0) + 1;
      const shouldStop = newFailCount >= maxRetries;

      try {
        await prisma.message.update({
          where: { id: msg.id },
          data: {
            failCount: newFailCount,
            lastError: error.message?.substring(0, 500),
            sendCount: { increment: 1 },
            status: shouldStop ? "FAILED" : "PENDING",
            updatedOn: new Date(),
          },
        });
      } catch (updateError) {
        console.error("[EmailScheduler] Failed to update message status:", updateError.message);
      }

      if (shouldStop) {
        console.log(`[EmailScheduler] Message ${msg.id} failed after ${maxRetries} attempts.`);
      }
    }
  }

  return { processed: pendingMessages.length, sent, failed };
};
