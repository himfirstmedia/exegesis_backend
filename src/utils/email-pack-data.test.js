import {
  emailCopy,
  emailSource,
  emailLanguages,
  emailPackKeys,
  emailCarryKey,
  completeEmailPack,
  validEmailText,
  resolveEmailLanguage,
} from "./email-pack-data.js";
import { uiLanguages } from "../modules/text-to-text-translation/ui-pack-data.js";

describe("email pack source data", () => {
  test("revision is a stable 12-char hex digest", () => {
    expect(emailSource.revision).toMatch(/^[a-f0-9]{12}$/);
    expect(emailSource.schemaVersion).toBe(1);
  });

  test("source strings are unique and non-empty", () => {
    const texts = emailSource.texts;
    expect(texts.length).toBeGreaterThan(10);
    expect(new Set(texts).size).toBe(texts.length);
    expect(texts.every((text) => typeof text === "string" && text.trim())).toBe(true);
  });

  test("every source string validates against itself (balanced tokens)", () => {
    for (const text of emailSource.texts) {
      expect({ text, valid: validEmailText(text, text) }).toEqual({ text, valid: true });
    }
  });

  test("covers the same languages as the app UI packs", () => {
    expect(emailLanguages).toEqual(uiLanguages);
    expect(emailLanguages).toContain("en");
    expect(emailLanguages).toContain("fr");
  });

  test("pack keys are namespaced by revision and language", () => {
    const keys = emailPackKeys("fr");
    expect(keys.final).toBe(`email-packs/app-${emailSource.revision}/fr.json`);
    expect(keys.partial).toBe(`email-packs/app-${emailSource.revision}/fr-partial.json`);
    expect(keys.manifest).toBe(`email-packs/app-${emailSource.revision}/fr-manifest.json`);
    expect(emailCarryKey("fr")).toBe("email-packs/carry/fr.json");
  });

  test("completeEmailPack accepts a full translation set", () => {
    const translations = emailSource.texts.map((text) => `FR::${text}`);
    expect(completeEmailPack({ schemaVersion: 1, revision: emailSource.revision, language: "fr", translations }, "fr")).toBe(true);
  });

  test("completeEmailPack rejects missing, token-dropping, or stale packs", () => {
    const good = emailSource.texts.map((text) => `FR::${text}`);
    const greetingIndex = emailSource.texts.indexOf(emailCopy.verification.greeting);
    const tokenDropped = good.map((value, index) =>
      index === greetingIndex ? value.replace("{{firstName}}", "") : value);
    const cases = [
      { translations: good.slice(1) },
      { translations: [...good.slice(0, -1), ""] },
      { translations: tokenDropped },
      { revision: "000000000000" },
      { language: "de" },
    ];
    for (const patch of cases) {
      const pack = { schemaVersion: 1, revision: emailSource.revision, language: "fr", translations: good, ...patch };
      expect(completeEmailPack(pack, "fr")).toBe(false);
    }
  });

  test("resolveEmailLanguage normalizes tags and defaults to English", () => {
    expect(resolveEmailLanguage("fr")).toBe("fr");
    expect(resolveEmailLanguage("fr-FR")).toBe("fr");
    expect(resolveEmailLanguage("pt_BR")).toBe("pt");
    expect(resolveEmailLanguage("EN")).toBe("en");
    expect(resolveEmailLanguage("xx")).toBe("en");
    expect(resolveEmailLanguage(undefined)).toBe("en");
    expect(resolveEmailLanguage("")).toBe("en");
  });

  test("copy contains the user-visible template fields", () => {
    expect(emailCopy.verification.subject).toBeTruthy();
    expect(emailCopy.verification.greeting).toContain("{{firstName}}");
    expect(emailCopy.newSupportTicket.subject).toContain("{{subject}}");
    expect(emailCopy.newSupportTicket.preview).toContain("{{reporter}}");
    expect(emailCopy.shared.unsubscribe).toBe("Unsubscribe");
    expect(emailCopy.shared.footer).toBe("© {{year}} {{company}}");
    expect(emailCopy.shared.company).toBe("Exegesis Bible App");
  });
});
