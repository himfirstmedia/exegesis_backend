import { emailCopy, emailSource, emailPackKeys, completeEmailPack, resolveEmailLanguage } from "./email-pack-data.js";
import { readUiPackObject } from "../services/objectStorage.js";

const CURRENT_YEAR = new Date().getFullYear();
const SUPPORT_EMAIL = process.env.MAIL_SUPPORT_EMAIL || process.env.MAIL_USERNAME ||
  "support@exegesisproject.org";
const UNSUBSCRIBE_URL = process.env.UNSUBSCRIBE_URL || `mailto:${SUPPORT_EMAIL}?subject=unsubscribe`;
const FRONTEND_APP_URL = (process.env.FRONTEND_URL || process.env.CLIENT_URL ||
  "https://app.exegesisproject.org").replace(/\/+$/, "");
const COMPANY_ADDRESS = process.env.COMPANY_ADDRESS || "Exegesis Bible App";

const shared = emailCopy.shared;

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

// Fill {{name}} placeholders. `escapeValues` controls whether substituted user
// data is HTML-escaped (body content) or left verbatim (email subjects).
const fill = (template, vars, escapeValues) => String(template ?? "")
  .replace(/\{\{(\w+)\}\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(vars, key)
      ? (escapeValues ? escapeHtml(vars[key] ?? "") : String(vars[key] ?? ""))
      : match);
const fillHtml = (template, vars) => fill(template, vars, true);
const fillText = (template, vars) => fill(template, vars, false);

const paragraph = (content) => `<p style="margin: 0 0 12px;">${content}</p>`;
const note = (content) => `<p style="margin: 12px 0 0; color: #596579; font-size: 12px; line-height: 1.5;">${content}</p>`;
const button = (label, url) => `
<table role="presentation" cellspacing="0" cellpadding="0" style="margin: 16px 0 8px;">
  <tr><td bgcolor="#1e3a5f" style="border-radius: 6px; text-align: center;">
    <a href="${escapeHtml(url)}" style="display: inline-block; padding: 11px 20px; border: 1px solid #1e3a5f; border-radius: 6px; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none;">${escapeHtml(label)}</a>
  </td></tr>
</table>`;

// One shared, table-based shell keeps branding and spacing consistent in mail
// clients. `title`/`preview`/`content` must already be HTML-ready (translated
// copy escaped, user data escaped by the caller) — this shell does not escape
// them again. `lang` drives the document language.
const layout = (t, lang, title, preview, content) => `<!DOCTYPE html>
<html lang="${escapeHtml(lang)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f5f7; font-family: Arial, Helvetica, sans-serif; color: #334155; -webkit-text-size-adjust: 100%;">
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all;">${preview}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#f3f5f7">
    <tr><td align="center" style="padding: 20px 12px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#ffffff" style="max-width: 520px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <tr><td align="center" style="padding: 20px 24px 16px; border-bottom: 1px solid #edf0f3;">
          <img src="${escapeHtml(EMAIL_LOGO_URL)}" alt="Exegesis Project" width="80" style="display: block; width: 80px; max-width: 100%; height: auto; border: 0;" />
        </td></tr>
        <tr><td style="padding: 20px 24px; font-size: 14px; line-height: 1.6;">
          <h1 style="margin: 0 0 14px; color: #1e3a5f; font-size: 20px; line-height: 1.3; font-weight: 600;">${title}</h1>
          ${content}
        </td></tr>
        <tr><td style="padding: 14px 24px; border-top: 1px solid #edf0f3; font-size: 12px; line-height: 1.5; color: #596579; text-align: center;">
          <p style="margin: 0 0 6px;">${escapeHtml(t(shared.needHelp))} <a href="mailto:${escapeHtml(SUPPORT_EMAIL)}" style="color: #1e3a5f; text-decoration: underline;">${escapeHtml(t(shared.contactSupport))}</a>
            &nbsp;&middot;&nbsp; <a href="${escapeHtml(UNSUBSCRIBE_URL)}" style="color: #596579; text-decoration: underline;">${escapeHtml(t(shared.unsubscribe))}</a></p>
          <p style="margin: 0;">${fillHtml(t(shared.footer), { year: CURRENT_YEAR, company: t(COMPANY_ADDRESS) })}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const codeBlock = (code, hint) => `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 16px 0;">
  <tr><td align="center" bgcolor="#f3f5f7" style="padding: 14px; border: 1px solid #e2e8f0; border-radius: 6px; color: #1e3a5f; font-family: 'Courier New', monospace; font-size: 26px; line-height: 1.3; font-weight: 700; letter-spacing: 4px;"><span dir="ltr" style="user-select: all; -webkit-user-select: all;">${escapeHtml(code)}</span></td></tr>
</table>
<p style="margin: -8px 0 12px; text-align: center; font-size: 12px; color: #596579;">${hint}</p>`;

const details = (rows) => `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 12px 0; font-size: 14px; line-height: 1.5;">
${rows.map(([label, value]) => `<tr>
  <td valign="top" style="padding: 5px 12px 5px 0; width: 34%; color: #596579;">${escapeHtml(label)}</td>
  <td valign="top" style="padding: 5px 0; color: #1e3a5f; word-break: break-word;">${escapeHtml(value)}</td>
</tr>`).join("\n")}
</table>`;

// ── Localized copy resolution ─────────────────────────────────────────────
// Published packs are read once per language and cached briefly. Any failure
// (missing pack, storage outage, malformed output) silently falls back to the
// authored English copy so an email is never dropped because of translation.
const PACK_TTL_MS = 5 * 60 * 1000;
const packCache = new Map();
const packInFlight = new Map();

const buildTranslationMap = (language, pack) => {
  if (language === "en" || !completeEmailPack(pack, language)) return new Map();
  return new Map(
    emailSource.texts.map((text, index) => [text, pack.translations[index]]),
  );
};

const loadPackMap = (language) => {
  const cached = packCache.get(language);
  if (cached && cached.until > Date.now()) return Promise.resolve(cached.map);
  if (packInFlight.has(language)) return packInFlight.get(language);
  const promise = (async () => {
    try {
      const pack = await readUiPackObject(emailPackKeys(language).final);
      const map = buildTranslationMap(language, pack);
      packCache.set(language, { map, until: Date.now() + PACK_TTL_MS });
      return map;
    } catch (error) {
      console.warn(
        `[email] Could not load the ${language} email pack; using English:`,
        error.message,
      );
      packCache.set(language, { map: new Map(), until: Date.now() + PACK_TTL_MS });
      return new Map();
    }
  })().finally(() => packInFlight.delete(language));
  packInFlight.set(language, promise);
  return promise;
};

/**
 * Resolve the translator for a recipient language. Returns `{ lang, t, te }`
 * where `t` maps an authored English string to its translation (English when
 * unavailable) and `te` additionally HTML-escapes the result.
 */
export const emailTranslator = async (language) => {
  const lang = resolveEmailLanguage(language);
  const map = lang === "en" ? new Map() : await loadPackMap(lang);
  const t = (text) => map.get(text) || text;
  return { lang, t, te: (text) => escapeHtml(t(text)) };
};

export const emailTemplates = {
  verification: async (code, firstName, language) => {
    const { lang, t, te } = await emailTranslator(language);
    const copy = emailCopy.verification;
    return {
      subject: t(copy.subject),
      html: layout(t, lang, te(copy.title), te(copy.preview),
        paragraph(fillHtml(te(copy.greeting), { firstName: firstName || "there" })) +
        paragraph(te(copy.body)) +
        codeBlock(code, te(copy.codeHint)) +
        note(te(copy.note))),
    };
  },

  welcome: async (firstName, language) => {
    const { lang, t, te } = await emailTranslator(language);
    const copy = emailCopy.welcome;
    return {
      subject: t(copy.subject),
      html: layout(t, lang, te(copy.title), te(copy.preview),
        paragraph(fillHtml(te(copy.greeting), { firstName: firstName || "there" })) +
        paragraph(te(copy.body)) +
        paragraph(te(copy.explore)) +
        button(t(copy.button), FRONTEND_APP_URL) +
        note(te(copy.note))),
    };
  },

  passwordReset: async (code, firstName, language) => {
    const { lang, t, te } = await emailTranslator(language);
    const copy = emailCopy.passwordReset;
    return {
      subject: t(copy.subject),
      html: layout(t, lang, te(copy.title), te(copy.preview),
        paragraph(fillHtml(te(copy.greeting), { firstName: firstName || "there" })) +
        paragraph(te(copy.body)) +
        codeBlock(code, te(copy.codeHint)) +
        note(te(copy.note))),
    };
  },

  accountCreated: async ({ firstName, username, password, role }, language) => {
    const { lang, t, te } = await emailTranslator(language);
    const copy = emailCopy.accountCreated;
    return {
      subject: t(copy.subject),
      html: layout(t, lang, te(copy.title), te(copy.preview),
        paragraph(fillHtml(te(copy.greeting), { firstName: firstName || "there" })) +
        paragraph(te(copy.body)) +
        details([
          [t(copy.username), username],
          [t(copy.temporaryPassword), password],
          [t(copy.role), role || t(copy.member)],
        ]) +
        button(t(copy.button), `${FRONTEND_APP_URL}/login`)),
    };
  },

  newSupportTicket: async ({ ticket, reporter, adminUrl }, language) => {
    const { lang, t, te } = await emailTranslator(language);
    const copy = emailCopy.newSupportTicket;
    const reporterName = [reporter?.firstName, reporter?.lastName].filter(Boolean).join(" ") ||
      reporter?.username || t(copy.aReader);
    return {
      subject: fillText(t(copy.subject), { subject: ticket.subject }),
      html: layout(t, lang, te(copy.title), fillHtml(te(copy.preview), { reporter: reporterName }),
        paragraph(fillHtml(te(copy.body), { reporter: reporterName })) +
        details([
          [t(copy.ticket), ticket.ticketCode],
          [t(copy.category), ticket.category],
          [t(copy.priority), ticket.priority],
          [t(copy.from), `${reporterName} (${reporter?.email || t(copy.noEmail)})`],
          [t(copy.device), ticket.deviceInfo || t(copy.unknown)],
        ]) +
        `<p style="margin: 12px 0; padding: 12px; background-color: #f3f5f7; border-left: 3px solid #1e3a5f; white-space: pre-wrap; overflow-wrap: anywhere;">${escapeHtml(ticket.messages?.[0]?.body || "")}</p>` +
        button(t(copy.button), adminUrl)),
    };
  },
};

export default emailTemplates;
