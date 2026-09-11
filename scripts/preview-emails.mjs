/**
 * Email template preview server.
 *
 * Renders all email templates as real HTML pages in the browser so the logo
 * and layout can be checked before sending. Run with:
 *
 *   APP_BASE_URL=http://localhost:4174 node scripts/preview-emails.mjs
 *
 * (APP_BASE_URL makes the templates point their logo <img> at this server,
 * which serves the real logo file from src/assets/logo.png.)
 */
import http from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { emailTemplates } from "../src/utils/emailTemplates.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PREVIEW_PORT || 4174;

const samples = {
  "verification": () =>
    emailTemplates.verification("483920", "Jane"),
  "welcome": () =>
    emailTemplates.welcome("Jane"),
  "password-reset": () =>
    emailTemplates.passwordReset("728193", "Jane"),
  "account-created": () =>
    emailTemplates.accountCreated({
      firstName: "John",
      username: "johndoe",
      password: "Xy9!kP2m",
      role: "Administrator",
    }),
};

const labels = {
  "verification": "Verification Code",
  "welcome": "Welcome",
  "password-reset": "Password Reset",
  "account-created": "Account Created (admin, credentials + role)",
};

/**
 * Sender identity used in the Gmail emulation views. Emails are sent via
 * SMTP auth as MAIL_USERNAME (opiobonniky@gmail.com), with a friendly
 * From name — exactly how Gmail will display them.
 */
const GMAIL_SENDER = {
  email: process.env.MAIL_USERNAME || "opiobonniky@gmail.com",
  name: process.env.MAIL_FROM_NAME || "Exegesis Project",
  initials: "EP",
};

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

/**
 * Gmail reading-pane chrome around the rendered template body.
 * The body itself is injected into a sandboxed iframe (srcdoc), mirroring
 * how Gmail isolates email HTML from its own app CSS.
 */
const gmailReadingPane = ({ name, subject, bodyHtml, dark }) => {
  const s = GMAIL_SENDER;
  const ui = dark
    ? {
        page: "#131314",
        pane: "#1e1f20",
        text: "#e3e3e3",
        sub: "#9aa0a6",
        hover: "#2d2e30",
        chip: "#3c4043",
        logoChip: "#e8eaed",
      }
    : {
        page: "#f6f8fc",
        pane: "#ffffff",
        text: "#202124",
        sub: "#5f6368",
        hover: "#f1f3f4",
        chip: "#e8eaed",
        logoChip: "#1e3a5f",
      };

  const iframeSrcdoc = escapeHtml(
    dark ? toGmailDark(bodyHtml) : bodyHtml,
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(subject)} — Gmail preview</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; background: ${ui.page}; font-family: Roboto, 'Segoe UI', Arial, sans-serif; color: ${ui.text}; min-height: 100vh; }
  .gmail-top { display:flex; align-items:center; gap:14px; padding:10px 20px; }
  .gmail-logo { font-size:20px; font-weight:500; color:${ui.sub}; letter-spacing:.2px; display:flex; align-items:center; gap:8px; }
  .gmail-logo svg { display:block; }
  .searchbar { flex:1; max-width:560px; margin-left:24px; background:${ui.chip}; border-radius:8px; padding:9px 16px; font-size:14px; color:${ui.sub}; }
  .wrap { max-width: 880px; margin: 8px auto 48px; padding: 0 16px; }
  .back { font-size:13px; color:${ui.sub}; margin-bottom:8px; }
  .subject-row { display:flex; align-items:baseline; gap:10px; padding: 0 8px; }
  h1.subject { font-size:22px; font-weight:400; margin:0 0 14px; color:${ui.text}; }
  .inbox-tag { font-size:11px; font-weight:700; letter-spacing:.4px; color:${ui.sub}; border:1px solid ${ui.chip}; border-radius:4px; padding:2px 6px; }
  .card { background:${ui.pane}; border-radius:16px ${dark ? "0 0" : "16px 16px"}; box-shadow: 0 1px 3px rgba(0,0,0,${dark ? ".4" : ".12"}); padding:20px 24px 8px; }
  .sender-row { display:flex; align-items:center; gap:12px; padding-bottom:16px; border-bottom:1px solid ${ui.chip}; margin-bottom:4px; }
  .avatar { width:40px; height:40px; border-radius:50%; background:linear-gradient(135deg,#1e3a5f,#2d5a87); color:#fff; font-weight:700; font-size:15px; display:flex; align-items:center; justify-content:center; flex:0 0 auto; }
  .from-line { font-size:14px; font-weight:700; color:${ui.text}; }
  .from-addr { font-size:12px; color:${ui.sub}; font-weight:400; }
  .to-line { font-size:12px; color:${ui.sub}; }
  .meta-right { margin-left:auto; display:flex; align-items:center; gap:14px; color:${ui.sub}; font-size:13px; }
  .msg-body { padding: 8px 4px 16px; }
  iframe { width:100%; border:0; display:block; }
  .note { max-width:880px; margin:0 auto; padding:10px 20px 0; font-size:12px; color:${ui.sub}; text-align:center; }
  .note a { color:#8ab4f8; }
</style>
</head>
<body>
  <div class="gmail-top">
    <div class="gmail-logo">
      <svg width="26" height="20" viewBox="0 0 26 20" fill="none"><path d="M1.6 19.2h3.2V8.1L0 4.4v13.2c0 .9.7 1.6 1.6 1.6z" fill="#4285F4"/><path d="M21.2 19.2h3.2c.9 0 1.6-.7 1.6-1.6V4.4l-4.8 3.7v11.1z" fill="#34A853"/><path d="M21.2 1.6v6.5L26 4.4V2.4c0-2-2.3-3.2-3.9-1.9l-.9.7z" fill="#FBBC04"/><path d="M4.8 8.1V1.6L13 7.8l8.2-6.2v6.5L13 14.3 4.8 8.1z" fill="#EA4335"/><path d="M4.8 1.6L13 7.8l8.2-6.2v-.1C21.2-.4 18.4-.9 16.8.3L13 3.2 9.2.3C7.6-.9 4.8-.4 4.8 1.5z" fill="#C5221F"/></svg>
      Gmail
    </div>
    <div class="searchbar">Search mail</div>
  </div>
  <div class="wrap">
    <div class="subject-row">
      <h1 class="subject">${escapeHtml(subject)}</h1>
      <span class="inbox-tag">Inbox</span>
    </div>
    <div class="card">
      <div class="sender-row">
        <div class="avatar">${s.initials}</div>
        <div>
          <div class="from-line">${escapeHtml(s.name)} <span class="from-addr">&lt;${escapeHtml(s.email)}&gt;</span></div>
          <div class="to-line">to me</div>
        </div>
        <div class="meta-right">
          <span title="Rendered as a CID attachment — renders even with remote images blocked">📎 logo.png</span>
          <span>Just now</span>
        </div>
      </div>
      <div class="msg-body">
        <iframe sandbox="allow-same-origin" srcdoc="${iframeSrcdoc}" title="email body" loading="lazy"></iframe>
        <script>
          const f = document.querySelector('iframe');
          const fit = () => {
            try { f.style.height = (f.contentDocument.body.scrollHeight + 24) + 'px'; }
            catch { f.style.height = '1200px'; }
          };
          f.addEventListener('load', () => setTimeout(fit, 60));
        <\/script>
      </div>
    </div>
    <p class="note">Gmail reading-pane emulation — sender: <b>${escapeHtml(s.name)}</b> &lt;${escapeHtml(s.email)}&gt; · <a href="/gmail/${name}">light</a> · <a href="/gmail/${name}?dark=1">dark</a> · <a href="/gmail">inbox view</a> · <a href="/">all previews</a></p>
  </div>
</body>
</html>`;
};

/**
 * Gmail inbox-list emulation: how the message appears as a row in the
 * inbox before it is opened.
 */
const gmailInboxRow = ({ name }) => {
  const { subject } = samples[name]();
  const s = GMAIL_SENDER;
  return `
  <a class="row" href="/gmail/${name}">
    <span class="star">☆</span>
    <span class="from">${escapeHtml(s.name)}</span>
    <span class="subj"><b>${escapeHtml(subject)}</b> <span class="snip">— Your ${labels[name]} email from Exegesis Project, sent from ${escapeHtml(s.email)}.</span></span>
    <span class="time">${["12:04 PM","11:58 AM","Yesterday","Jul 30"][Object.keys(samples).indexOf(name) % 4]}</span>
  </a>`;
};

const gmailInboxHtml = () => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Gmail inbox emulation</title>
<style>
  body { margin:0; background:#f6f8fc; font-family: Roboto, 'Segoe UI', Arial, sans-serif; }
  .wrap { max-width: 880px; margin: 32px auto; padding: 0 16px; }
  h1 { font-size: 18px; color:#202124; font-weight:500; }
  .card { background:#fff; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,.12); overflow:hidden; }
  a.row { display:flex; gap:12px; align-items:center; padding:14px 20px; border-bottom:1px solid #f1f3f4; text-decoration:none; color:#202124; font-size:14px; }
  a.row:last-child { border-bottom:0; }
  a.row:hover { background:#f5f8ff; box-shadow: inset 1px 0 0 #1a73e8; }
  .star { color:#c4c7c5; }
  .from { width:180px; flex:0 0 auto; }
  .subj { flex:1; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; color:#5f6368; }
  .subj b { color:#202124; font-weight:700; }
  .time { color:#5f6368; font-size:12px; }
  p.tip { color:#5f6368; font-size:13px; }
  a { color:#1a73e8; }
</style>
</head>
<body>
  <div class="wrap">
    <h1>Gmail inbox — from Exegesis Project &lt;${GMAIL_SENDER.email}&gt;</h1>
    <p class="tip">Click a row to open the reading-pane emulation (light or dark).</p>
    <div class="card">
    ${Object.keys(samples).map((n) => gmailInboxRow({ name: n })).join("\n")}
    </div>
    <p class="tip" style="margin-top:16px"><a href="/">← All previews</a></p>
  </div>
</body>
</html>`;

/**
 * Emulate Gmail's forced dark theme: light backgrounds are darkened, body
 * text is lightened, and brand accent text is swapped for a readable light
 * blue — while dark headers, images, and the white logo chip are kept as-is
 * (Gmail never inverts <img> rendering).
 */
const toGmailDark = (html) => {
  const LOGO_CHIP = "\u0000LOGO_CHIP\u0000";
  return html
    // Protect the logo's white chip — the <img> background is never inverted
    .replace(
      /(<img [^>]*?)background-color: #ffffff;([^>]*?>)/,
      `$1${"BACKGROUND-CHIP-WHITE"};$2`,
    )
    // Page + surfaces
    .replaceAll("background-color: #f4f4f4", "background-color: #121212")
    .replaceAll("background-color: #ffffff", "background-color: #1e1e24")
    .replaceAll("background-color: #f8f9fa", "background-color: #26262e")
    .replaceAll("#f8f9fa 0%, #e9ecef 100%", "#26262e 0%, #2e2e38 100%")
    .replaceAll("#fef9f0 0%, #fdf6e3 100%", "#2a2620 0%, #302b22 100%")
    .replaceAll("background-color: #fdf6e3", "background-color: #2a2620")
    .replaceAll("background-color: #e8f0fe", "background-color: #26324a")
    // Body text
    .replaceAll("color: #555555", "color: #c3c3cc")
    .replaceAll("color: #888888", "color: #a0a0ab")
    .replaceAll("color: #aaaaaa", "color: #7d7d88")
    .replaceAll("color: #bbbbbb", "color: #6e6e78")
    .replaceAll("color: #856404", "color: #d8c58e")
    .replaceAll("color: #6b5d3f", "color: #d8c58e")
    // Brand-dark text on light surfaces becomes readable light blue
    .replaceAll("color: #1e3a5f", "color: #8ab4f8")
    // Borders
    .replaceAll("border: 2px dashed #ced4da", "border: 2px dashed #45454f")
    .replaceAll("border-top: 1px solid #eee", "border-top: 1px solid #33333c")
    .replaceAll("border: 1px solid #2d5a87", "border: 1px solid #4a76a8")
    // Dark-mode opt-in for the client renderer
    .replace(
      "<head>",
      `<head>
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <style> :root { color-scheme: dark; } </style>`,
    )
    .replace("</title>", "</title>\n<!-- Gmail dark-theme emulation -->")
    // Restore the logo chip
    .replaceAll("BACKGROUND-CHIP-WHITE", "background-color: #ffffff");
};

const indexHtml = () => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Email Template Previews</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f4f4f4; margin: 0; padding: 48px 24px; }
    h1 { color: #1e3a5f; text-align: center; margin: 0 0 8px; }
    p.sub { text-align: center; color: #888; margin: 0 0 32px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; max-width: 960px; margin: 0 auto; }
    a.card { display: block; background: #fff; border-radius: 12px; padding: 24px; text-decoration: none;
             color: #1e3a5f; font-weight: 600; box-shadow: 0 6px 24px rgba(0,0,0,0.08); border: 2px solid transparent; }
    a.card:hover { border-color: #2d5a87; }
    a.card small { display: block; margin-top: 6px; color: #888; font-weight: 400; }
  </style>
</head>
<body>
  <h1>Email Template Previews</h1>
  <p class="sub">Rendered live from <code>backend/src/utils/emailTemplates.js</code></p>
  <div class="grid">
    ${Object.keys(samples)
      .map(
        (name) =>
          `<a class="card" href="/preview/${name}">${labels[name]}<small>/preview/${name} · <a href="/preview/${name}?dark=1" style="color:#d4a84b">dark mode</a></small></a>`,
      )
      .join("\n    ")}
  </div>
</body>
</html>
`;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // Serve the real logo so previews show exactly what emails will use
  if (url.pathname === "/assets/logo.png") {
    const logoPath = path.join(__dirname, "../src/assets/logo.png");
    try {
      const data = fs.readFileSync(logoPath);
      res.writeHead(200, { "Content-Type": "image/png", "Cache-Control": "no-store" });
      res.end(data);
      return;
    } catch {
      res.writeHead(404).end("logo.png not found");
      return;
    }
  }

  if (url.pathname === "/" || url.pathname === "/index.html") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(indexHtml());
    return;
  }

  // Gmail inbox-list emulation
  if (url.pathname === "/gmail") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(gmailInboxHtml());
    return;
  }

  // Gmail reading-pane emulation: /gmail/<template>[?dark=1]
  const gmailMatch = url.pathname.match(/^\/gmail\/([\w-]+)$/);
  if (gmailMatch && samples[gmailMatch[1]]) {
    const name = gmailMatch[1];
    const isDark = url.searchParams.get("dark") === "1";
    const { subject, html } = samples[name]();
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(gmailReadingPane({ name, subject, bodyHtml: html, dark: isDark }));
    return;
  }

  const match = url.pathname.match(/^\/(?:preview\/)?([\w-]+)$/);
  if (match && samples[match[1]]) {
    const isDark = url.searchParams.get("dark") === "1";
    const { subject, html } = samples[match[1]]();
    const out = isDark ? toGmailDark(html) : html;
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`<!-- subject: ${subject} -->\n${out}`);
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found. Visit / for the template list.");
});

server.listen(PORT, () => {
  console.log(`Email previews running at http://localhost:${PORT}`);
  console.log(`  Gmail inbox emulation:      http://localhost:${PORT}/gmail`);
  for (const name of Object.keys(samples)) {
    console.log(`  - http://localhost:${PORT}/preview/${name}  (${labels[name]})`);
    console.log(`  - http://localhost:${PORT}/gmail/${name}  (Gmail reading pane, from ${GMAIL_SENDER.email})`);
    console.log(`  - http://localhost:${PORT}/preview/${name}?dark=1  (${labels[name]} \u2014 Gmail dark emulation)`);
  }
});
