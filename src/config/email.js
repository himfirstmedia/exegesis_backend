import nodemailer from "nodemailer";

export const emailConfig = {
  host: process.env.MAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.MAIL_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
  // Pool connections for better performance and reliability
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  rateDelta: 1000,
  rateLimit: 5, // 5 messages per second max
};

export const createTransporter = () => {
  return nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: emailConfig.auth,
    pool: emailConfig.pool,
    maxConnections: emailConfig.maxConnections,
    maxMessages: emailConfig.maxMessages,
    rateDelta: emailConfig.rateDelta,
    rateLimit: emailConfig.rateLimit,
    tls: {
      // Only reject in production
      rejectUnauthorized: process.env.NODE_ENV === "production",
    },
  });
};

/**
 * Build mail options with deliverability headers.
 *
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.subject - Email subject
 * @param {string} params.html - HTML body
 * @param {string} [params.listUnsubscribe] - Unsubscribe URL
 * @returns {Object} Nodemailer mail options
 */
export const buildMailOptions = ({
  to,
  subject,
  html,
  listUnsubscribe,
}) => {
  const fromName = process.env.MAIL_FROM_NAME || "Exegesis Project";
  const fromEmail = process.env.MAIL_USERNAME;
  const supportEmail = process.env.MAIL_SUPPORT_EMAIL || fromEmail;

  // Transactional-appropriate headers. NOTE: "Precedence: bulk",
  // "List-Id", "Auto-Submitted", and List-Unsubscribe on transactional
  // mail (verification codes, receipts, credentials) are strong spam
  // signals — Gmail files them as Promotions/spam. Real marketing mail
  // should pass a listUnsubscribe URL instead.
  const headers = {};
  if (listUnsubscribe) {
    headers["List-Unsubscribe"] = `<${listUnsubscribe}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

  return {
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    // Plain-text fallback improves deliverability and accessibility.
    // Derived from the subject so it never leaks credentials.
    text: subject,
    html,
    headers,
    // Reply-To so users can respond to support
    replyTo: supportEmail,
  };
};

// Legacy mailOptions for backward compatibility
export const mailOptions = {
  from: process.env.MAIL_FROM_NAME
    ? `${process.env.MAIL_FROM_NAME} <${process.env.MAIL_USERNAME}>`
    : process.env.MAIL_USERNAME,
};
