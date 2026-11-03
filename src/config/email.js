import nodemailer from "nodemailer";

const toPositiveInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const emailConfig = {
  host: process.env.MAIL_HOST || "smtp.gmail.com",
  port: toPositiveInt(process.env.MAIL_PORT, 587),
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
  // A stalled SMTP socket used to hang the whole scheduler sweep: `isRunning`
  // stayed true, the distributed lock expired, and the next instance started
  // re-sending the same batch. Fail fast instead.
  connectionTimeout: toPositiveInt(process.env.MAIL_CONNECTION_TIMEOUT_MS, 15000),
  greetingTimeout: toPositiveInt(process.env.MAIL_GREETING_TIMEOUT_MS, 15000),
  socketTimeout: toPositiveInt(process.env.MAIL_SOCKET_TIMEOUT_MS, 30000),
};

const createTransportOptions = () => ({
  host: emailConfig.host,
  port: emailConfig.port,
  secure: emailConfig.secure,
  auth: emailConfig.auth,
  pool: emailConfig.pool,
  maxConnections: emailConfig.maxConnections,
  maxMessages: emailConfig.maxMessages,
  rateDelta: emailConfig.rateDelta,
  rateLimit: emailConfig.rateLimit,
  connectionTimeout: emailConfig.connectionTimeout,
  greetingTimeout: emailConfig.greetingTimeout,
  socketTimeout: emailConfig.socketTimeout,
  tls: {
    // Only reject in production
    rejectUnauthorized: process.env.NODE_ENV === "production",
  },
});

/**
 * A fresh transporter (used by tests and one-off scripts).
 *
 * Do NOT call this per message: with `pool: true` every call opens its own
 * connection pool that is never closed, so a 5-message batch used to open five
 * pools — the classic "Too many connections" / stalled-send pattern with
 * Gmail. Application code should use {@link getTransporter}.
 */
export const createTransporter = () => nodemailer.createTransport(createTransportOptions());

let sharedTransporter = null;

/** Lazily-created, process-wide pooled transporter reused by every send. */
export const getTransporter = () => {
  if (!sharedTransporter) sharedTransporter = createTransporter();
  return sharedTransporter;
};

/** Close and forget the shared transporter (shutdown / config change). */
export const resetTransporter = () => {
  try {
    sharedTransporter?.close?.();
  } catch {
    // Never fail shutdown over SMTP cleanup.
  }
  sharedTransporter = null;
};

/**
 * Build mail options with deliverability headers.
 *
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.subject - Subject line
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

  
  const headers = {};
  if (listUnsubscribe) {
    headers["List-Unsubscribe"] = `<${listUnsubscribe}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

  return {
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
   
    // Plain-text fallback. It must describe the message, not just repeat the
    // subject line, or some clients show an empty body.
    text: html
      ? html
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
      : subject,
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