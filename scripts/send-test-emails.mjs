/**
 * Send all four email templates through the REAL sending path
 * (emailService.sendEmail -> Gmail SMTP, with the CID-embedded logo)
 * so deliverability and rendering can be verified in an actual inbox.
 *
 * Usage:
 *   node --env-file=.env scripts/send-test-emails.mjs [recipient@example.com] [template]
 *
 * Recipient defaults to the sender account (MAIL_USERNAME) if omitted.
 * Optional template filter: account-created | verification | welcome | password-reset.
 * Credentials are never printed — only the SMTP result per message.
 */
import { emailTemplates } from "../src/utils/emailTemplates.js";
import { sendEmail } from "../src/services/emailService.js";

const recipient = process.argv[2] || process.env.MAIL_USERNAME;
const onlyTemplate = process.argv[3];

if (!recipient) {
  console.error("Usage: node --env-file=.env scripts/send-test-emails.mjs [recipient] [template]");
  console.error("  (or set MAIL_USERNAME in .env so a recipient can be defaulted)");
  process.exit(1);
}

if (!process.env.MAIL_USERNAME || !process.env.MAIL_PASSWORD) {
  console.error("MAIL_USERNAME / MAIL_PASSWORD are not set in the environment — cannot send.");
  process.exit(1);
}

const jobs = [
  ["account-created", () =>
    emailTemplates.accountCreated({
      firstName: "John",
      username: "johndoe",
      password: "Xy9!kP2m",
      role: "Administrator",
    })],
  ["verification", () => emailTemplates.verification("483920", "John")],
  ["welcome", () => emailTemplates.welcome("John")],
  ["password-reset", () => emailTemplates.passwordReset("728193", "John")],
];

const selected = onlyTemplate ? jobs.filter(([name]) => name === onlyTemplate) : jobs;
if (selected.length === 0) {
  console.error(`Unknown template "${onlyTemplate}". Options: ${jobs.map(([n]) => n).join(", ")}`);
  process.exit(1);
}

console.log(`Sending ${selected.length} test email(s) via ${process.env.MAIL_HOST || "smtp.gmail.com"}`);
console.log(`  from: ${process.env.MAIL_FROM_NAME || "Exegesis Project"} <${process.env.MAIL_USERNAME}>`);
console.log(`  to:   ${recipient}\n`);

let ok = 0;
let failed = 0;

for (const [name, build] of selected) {
  const { subject, html } = build();
  try {
    const info = await sendEmail(recipient, subject, html);
    const rejected = info.rejected?.length ? ` (REJECTED: ${info.rejected.join(", ")})` : "";
    console.log(`  ✓ ${name.padEnd(16)} → sent  [${info.messageId}]${rejected}`);
    ok += 1;
  } catch (err) {
    console.error(`  ✗ ${name.padEnd(16)} → FAILED  ${err.message}`);
    failed += 1;
  }
}

console.log(`\nDone: ${ok} sent, ${failed} failed.`);
if (ok > 0) {
  console.log(`Check the inbox at ${recipient} — allow ~1 minute for delivery.`);
  console.log("If messages land in Spam, mark one as 'Not spam' to train the filter.");
}
process.exit(failed > 0 ? 1 : 0);
