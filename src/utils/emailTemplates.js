const CURRENT_YEAR = new Date().getFullYear();
const SUPPORT_EMAIL = process.env.MAIL_SUPPORT_EMAIL || process.env.MAIL_USERNAME ||
  "support@exegesisproject.org";
const UNSUBSCRIBE_URL = process.env.UNSUBSCRIBE_URL || `mailto:${SUPPORT_EMAIL}?subject=unsubscribe`;
const FRONTEND_APP_URL = (process.env.FRONTEND_URL || process.env.CLIENT_URL ||
  "https://app.exegesisproject.org").replace(/\/+$/, "");
const COMPANY_ADDRESS = process.env.COMPANY_ADDRESS || "Exegesis Bible App";

// Upload a replacement with scripts/upload-email-logo.js /path/to/logo.png,
// then set LOGO_URL to the verified public URL. Emails never attach the image.
export const EMAIL_LOGO_URL = process.env.LOGO_URL ||
  "https://pub-43e3d79507e34e51a10793bd5a620284.r2.dev/branding/email-logo-bef71893e184.png";

const escapeHtml = (value) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

const paragraph = (content) => `<p style="margin: 0 0 12px;">${content}</p>`;
const note = (content) => `<p style="margin: 12px 0 0; color: #596579; font-size: 12px; line-height: 1.5;">${content}</p>`;
const button = (label, url) => `
<table role="presentation" cellspacing="0" cellpadding="0" style="margin: 16px 0 8px;">
  <tr><td bgcolor="#1e3a5f" style="border-radius: 6px; text-align: center;">
    <a href="${escapeHtml(url)}" style="display: inline-block; padding: 11px 20px; border: 1px solid #1e3a5f; border-radius: 6px; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none;">${escapeHtml(label)}</a>
  </td></tr>
</table>`;

// One shared, table-based shell keeps branding and spacing consistent in mail clients.
// The logo includes the wordmark, so there is no repeated brand title or footer logo.
const layout = (title, preview, content) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f5f7; font-family: Arial, Helvetica, sans-serif; color: #334155; -webkit-text-size-adjust: 100%;">
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all;">${escapeHtml(preview)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#f3f5f7">
    <tr><td align="center" style="padding: 20px 12px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="max-width: 520px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <tr><td align="center" style="padding: 20px 24px 16px; border-bottom: 1px solid #edf0f3;">
          <img src="${escapeHtml(EMAIL_LOGO_URL)}" alt="Exegesis Project" width="80" style="display: block; width: 80px; max-width: 100%; height: auto; border: 0;" />
        </td></tr>
        <tr><td style="padding: 20px 24px; font-size: 14px; line-height: 1.6;">
          <h1 style="margin: 0 0 14px; color: #1e3a5f; font-size: 20px; line-height: 1.3; font-weight: 600;">${escapeHtml(title)}</h1>
          ${content}
        </td></tr>
        <tr><td style="padding: 14px 24px; border-top: 1px solid #edf0f3; font-size: 12px; line-height: 1.5; color: #596579; text-align: center;">
          <p style="margin: 0 0 6px;">Need help? <a href="mailto:${escapeHtml(SUPPORT_EMAIL)}" style="color: #1e3a5f; text-decoration: underline;">Contact support</a>
            &nbsp;&middot;&nbsp; <a href="${escapeHtml(UNSUBSCRIBE_URL)}" style="color: #596579; text-decoration: underline;">Unsubscribe</a></p>
          <p style="margin: 0;">&copy; ${CURRENT_YEAR} ${escapeHtml(COMPANY_ADDRESS)}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const codeBlock = (code) => `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 16px 0;">
  <tr><td align="center" bgcolor="#f3f5f7" style="padding: 14px; border: 1px solid #e2e8f0; border-radius: 6px; color: #1e3a5f; font-family: 'Courier New', monospace; font-size: 26px; line-height: 1.3; font-weight: 700; letter-spacing: 4px;"><span dir="ltr" style="user-select: all; -webkit-user-select: all;">${escapeHtml(code)}</span></td></tr>
</table>
<p style="margin: -8px 0 12px; text-align: center; font-size: 12px; color: #596579;">Select the code to copy, then paste it into the app.</p>`;

const details = (rows) => `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 12px 0; font-size: 14px; line-height: 1.5;">
${rows.map(([label, value]) => `<tr>
  <td valign="top" style="padding: 5px 12px 5px 0; width: 34%; color: #596579;">${escapeHtml(label)}</td>
  <td valign="top" style="padding: 5px 0; color: #1e3a5f; word-break: break-word;">${escapeHtml(value)}</td>
</tr>`).join("\n")}
</table>`;

export const emailTemplates = {
  verification: (code, firstName) => ({
    subject: "Exegesis Project - Verify Your Email",
    html: layout("Verify your email", "Confirm your email address to finish setting up your account.",
      paragraph(`Hello ${escapeHtml(firstName || "there")},`) +
      paragraph("Thank you for joining Exegesis. Enter this code to verify your email address:") +
      codeBlock(code) +
      note("This code expires in 24 hours. If you didn’t create an account, you can ignore this email.")),
  }),

  welcome: (firstName) => ({
    subject: "Welcome to Exegesis - Your Spiritual Journey Begins",
    html: layout("Welcome to Exegesis", "Your daily journey through Scripture starts here.",
      paragraph(`Hello ${escapeHtml(firstName || "there")},`) +
      paragraph("Your account is ready. We’re glad you’re here to grow in Scripture with us.") +
      paragraph("Explore daily Bible readings, discover verse explanations, and keep track of your spiritual journey.") +
      button("Open Exegesis", FRONTEND_APP_URL) +
      note("Please verify your email using the code sent in a separate message to complete your account setup.")),
  }),

  passwordReset: (code, firstName) => ({
    subject: "Exegesis Project - Password Reset Request",
    html: layout("Reset your password", "Use your reset code to choose a new password.",
      paragraph(`Hello ${escapeHtml(firstName || "there")},`) +
      paragraph("We received a request to reset your password. Enter this code to continue:") +
      codeBlock(code) +
      note("This code expires in 24 hours. If you didn’t request a reset, ignore this email. Your password will remain unchanged.")),
  }),

  accountCreated: ({ firstName, username, password, role }) => ({
    subject: "Exegesis Project - Your Account Has Been Created",
    html: layout("Your account is ready", "Sign in to your new Exegesis account.",
      paragraph(`Hello ${escapeHtml(firstName || "there")},`) +
      paragraph("An Exegesis account has been created for you. Use these details to sign in:") +
      details([["Username", username], ["Temporary password", password], ["Role", role || "Member"]]) +
      button("Sign in", `${FRONTEND_APP_URL}/login`)),
  }),

  newSupportTicket: ({ ticket, reporter, adminUrl }) => {
    const reporterName = [reporter?.firstName, reporter?.lastName].filter(Boolean).join(" ") ||
      reporter?.username || "A reader";
    return {
      subject: `[Support] ${ticket.subject}`,
      html: layout("New support message", `${reporterName} sent a support request.`,
        paragraph(`${escapeHtml(reporterName)} sent a message through the app.`) +
        details([
          ["Ticket", ticket.ticketCode], ["Category", ticket.category], ["Priority", ticket.priority],
          ["From", `${reporterName} (${reporter?.email || "no email"})`],
          ["Device", ticket.deviceInfo || "unknown"],
        ]) +
        `<p style="margin: 12px 0; padding: 12px; background-color: #f3f5f7; border-left: 3px solid #1e3a5f; white-space: pre-wrap; overflow-wrap: anywhere;">${escapeHtml(ticket.messages?.[0]?.body || "")}</p>` +
        button("Open support inbox", adminUrl)),
    };
  },
};

export default emailTemplates;
