// Localized transactional-email copy, built and published to R2 exactly like
// the UI/heading packs. The English strings below are the single source of
// truth; `{{name}}` tokens are placeholders that translators may move within a
// sentence but must never drop. Packs are keyed `email-packs/app-<revision>/<language>.json`
// and carry a validated translation per source string.
//
// Build-time / offline only: runtime `emailTemplates.js` reads the published
// pack (never this builder). Language coverage matches the app UI languages.
import { createHash } from "node:crypto";
import {
  uiLanguages,
  validUiText,
} from "../modules/text-to-text-translation/ui-pack-data.js";

// Shared shell chrome used by every message. Also translatable.
const shared = {
  needHelp: "Need help?",
  contactSupport: "Contact support",
  unsubscribe: "Unsubscribe",
};

export const emailCopy = {
  shared,
  verification: {
    subject: "Exegesis Project - Verify Your Email",
    title: "Verify your email",
    preview: "Confirm your email address to finish setting up your account.",
    greeting: "Hello {{firstName}},",
    body: "Thank you for joining Exegesis. Enter this code to verify your email address:",
    codeHint: "Select the code to copy, then paste it into the app.",
    note: "This code expires in 24 hours. If you didn’t create an account, you can ignore this email.",
  },
  welcome: {
    subject: "Welcome to Exegesis - Your Spiritual Journey Begins",
    title: "Welcome to Exegesis",
    preview: "Your daily journey through Scripture starts here.",
    greeting: "Hello {{firstName}},",
    body: "Your account is ready. We’re glad you’re here to grow in Scripture with us.",
    explore: "Explore daily Bible readings, discover verse explanations, and keep track of your spiritual journey.",
    button: "Open Exegesis",
    note: "Please verify your email using the code sent in a separate message to complete your account setup.",
  },
  passwordReset: {
    subject: "Exegesis Project - Password Reset Request",
    title: "Reset your password",
    preview: "Use your reset code to choose a new password.",
    greeting: "Hello {{firstName}},",
    body: "We received a request to reset your password. Enter this code to continue:",
    codeHint: "Select the code to copy, then paste it into the app.",
    note: "This code expires in 24 hours. If you didn’t request a reset, ignore this email. Your password will remain unchanged.",
  },
  accountCreated: {
    subject: "Exegesis Project - Your Account Has Been Created",
    title: "Your account is ready",
    preview: "Sign in to your new Exegesis account.",
    greeting: "Hello {{firstName}},",
    body: "An Exegesis account has been created for you. Use these details to sign in:",
    username: "Username",
    temporaryPassword: "Temporary password",
    role: "Role",
    member: "Member",
    button: "Sign in",
  },
  newSupportTicket: {
    subject: "[Support] {{subject}}",
    title: "New support message",
    preview: "{{reporter}} sent a support request.",
    body: "{{reporter}} sent a message through the app.",
    ticket: "Ticket",
    category: "Category",
    priority: "Priority",
    from: "From",
    device: "Device",
    unknown: "unknown",
    noEmail: "no email",
    aReader: "A reader",
    button: "Open support inbox",
  },
};

// Flatten to a stable, de-duplicated list in object order. The order defines
// translation alignment, so it must stay deterministic across machines.
const collect = (node, out = []) => {
  for (const value of Object.values(node)) {
    if (typeof value === "string") {
      if (value.trim() && !out.includes(value)) out.push(value);
    } else if (value && typeof value === "object") {
      collect(value, out);
    }
  }
  return out;
};

const texts = collect(emailCopy);

export const emailSource = Object.freeze({
  schemaVersion: 1,
  revision: createHash("sha256")
    .update(`v1:${JSON.stringify(texts)}`)
    .digest("hex")
    .slice(0, 12),
  texts,
});

export const emailLanguages = uiLanguages;

export const emailPackKeys = (language, revision = emailSource.revision) => {
  const base = `email-packs/app-${revision}/${language}`;
  return {
    final: `${base}.json`,
    partial: `${base}-partial.json`,
    manifest: `${base}-manifest.json`,
  };
};

// Per-language carry record, pairing every published source string with its
// translation so a new revision reuses unchanged copy.
export const emailCarryKey = (language) => `email-packs/carry/${language}.json`;

export const validEmailText = validUiText;

export const completeEmailPack = (pack, language) =>
  pack?.schemaVersion === 1 &&
  pack.language === language &&
  pack.revision === emailSource.revision &&
  Array.isArray(pack.translations) &&
  pack.translations.length === emailSource.texts.length &&
  emailSource.texts.every((text, index) =>
    validEmailText(text, pack.translations[index]),
  );

export const emailTranslationMap = (carry) => {
  const map = new Map();
  if (!Array.isArray(carry?.texts) || !Array.isArray(carry.translations)) {
    return map;
  }
  carry.texts.forEach((text, index) => {
    const value = carry.translations[index];
    if (!map.has(text) && validEmailText(text, value)) map.set(text, value);
  });
  return map;
};

// Resolve a client-supplied language (e.g. `fr`, `fr-FR`, `pt_BR`) to a
// supported pack language, defaulting to English when unknown.
export const resolveEmailLanguage = (value) => {
  if (typeof value !== "string") return "en";
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "en";
  const primary = normalized.split(/[-_]/)[0];
  if (emailLanguages.includes(primary)) return primary;
  if (emailLanguages.includes(normalized)) return normalized;
  return "en";
};
