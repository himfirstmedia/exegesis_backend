import { createTransporter, buildMailOptions } from "../config/email.js";
import { prisma } from "../config/db.js";

const MAX_RETRIES = 3;
const BATCH_SIZE = 5;

export const sendEmail = async (to, subject, htmlContent) => {
  const transporter = createTransporter();

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
    return;
  }

  if (!pendingMessages || pendingMessages.length === 0) {
    return;
  }

  console.log(`[EmailScheduler] Processing ${pendingMessages.length} pending messages`);

  for (const msg of pendingMessages) {
    try {
      await sendEmail(msg.recipient, msg.subject || "Exegesis App Notification", msg.message);

      await prisma.message.update({
        where: { id: msg.id },
        data: {
          status: "SENT",
          sentOn: new Date(),
          sendCount: { increment: 1 },
          updatedOn: new Date(),
        },
      });

      console.log(`[EmailScheduler] Email sent successfully to ${msg.recipient}`);
    } catch (error) {
      console.error(`[EmailScheduler] Failed to send email to ${msg.recipient}:`, error.message);

      const newFailCount = (msg.failCount || 0) + 1;
      const shouldStop = newFailCount >= MAX_RETRIES;

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
        console.error(`[EmailScheduler] Failed to update message status:`, updateError.message);
      }

      if (shouldStop) {
        console.log(`[EmailScheduler] Message ${msg.id} failed after ${MAX_RETRIES} attempts.`);
      }
    }
  }
};
