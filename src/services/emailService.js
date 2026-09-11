import { createTransporter, buildMailOptions } from "../config/email.js";
import { prisma } from "../config/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { EMAIL_LOGO_URL, EMAIL_LOGO_CID } from "../utils/emailTemplates.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.join(__dirname, "../assets/logo.png");
const MAX_RETRIES = 3;
const BATCH_SIZE = 5;

// Cache the logo buffer — read once per process
let logoBase64 = null;
const getLogoAttachment = () => {
  if (logoBase64 === null) {
    try {
      logoBase64 = fs.readFileSync(LOGO_PATH).toString("base64");
    } catch {
      logoBase64 = false; // logo missing — fall back to remote URL
    }
  }
  return logoBase64
    ? {
        filename: "logo.png",
        content: Buffer.from(logoBase64, "base64"),
        cid: EMAIL_LOGO_CID,
      }
    : null;
};

/**
 * Embed the brand logo as a CID attachment so it renders even when the
 * client blocks remote images (Gmail's default for unknown senders — the
 * exact cause of the "Exegesis Project" alt-text showing instead).
 */
export const embedLogo = (html) => {
  const attachment = getLogoAttachment();
  if (!attachment) return html;
  const escaped = EMAIL_LOGO_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return html.replace(
    new RegExp(`src="${escaped}"`, "g"),
    `src="cid:${EMAIL_LOGO_CID}"`,
  );
};

export const sendEmail = async (to, subject, htmlContent) => {
  const transporter = createTransporter();

  const mailOptions = buildMailOptions({
    to,
    subject,
    html: embedLogo(htmlContent),
  });

  // Attach the logo file so the cid: reference in the HTML resolves
  const attachment = getLogoAttachment();
  if (attachment) {
    mailOptions.attachments = [attachment];
  }

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
        console.error("[EmailScheduler] Failed to update message status:", updateError.message);
      }

      if (shouldStop) {
        console.log(`[EmailScheduler] Message ${msg.id} failed after ${MAX_RETRIES} attempts.`);
      }
    }
  }
};
