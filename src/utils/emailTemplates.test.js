jest.mock("../services/objectStorage.js", () => ({
  readUiPackObject: jest.fn(),
}));

import { readUiPackObject } from "../services/objectStorage.js";
import { emailTemplates } from "./emailTemplates.js";
import { emailCopy, emailSource, emailPackKeys } from "./email-pack-data.js";

const ENGLISH_SUBJECT = "Exegesis Project - Verify Your Email";

const makePack = (language, translate = (text) => `[${language}] ${text}`) => ({
  schemaVersion: 1,
  revision: emailSource.revision,
  language,
  translations: emailSource.texts.map(translate),
});

describe("emailTemplates localization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    readUiPackObject.mockResolvedValue(null);
  });

  test("renders English copy when no language is given", async () => {
    const { subject, html } = await emailTemplates.verification("483920", "Jane");
    expect(subject).toBe(ENGLISH_SUBJECT);
    expect(html).toContain("Thank you for joining Exegesis");
    expect(html).toContain("Hello Jane,");
    expect(html).toContain("483920");
    expect(html).toContain('lang="en"');
    expect(readUiPackObject).not.toHaveBeenCalled();
  });

  test("renders localized copy from the published pack", async () => {
    readUiPackObject.mockResolvedValue(makePack("fr"));
    const { subject, html } = await emailTemplates.verification("123456", "Jane", "fr");
    expect(subject).toBe("[fr] Exegesis Project - Verify Your Email");
    expect(html).toContain("[fr] Thank you for joining Exegesis");
    expect(html).toContain("[fr] Hello Jane,");
    expect(html).toContain('lang="fr"');
    expect(readUiPackObject).toHaveBeenCalledWith(emailPackKeys("fr").final);
  });

  test("regional and unsupported tags resolve before loading", async () => {
    readUiPackObject.mockResolvedValue(makePack("de"));
    const regional = await emailTemplates.verification("1", "A", "de-DE");
    expect(regional.subject).toBe("[de] Exegesis Project - Verify Your Email");
    expect(readUiPackObject).toHaveBeenCalledWith(emailPackKeys("de").final);

    const unsupported = await emailTemplates.verification("1", "A", "zz");
    expect(unsupported.subject).toBe(ENGLISH_SUBJECT);
    expect(readUiPackObject).not.toHaveBeenCalledWith(emailPackKeys("zz").final);
  });

  test("falls back to English when a pack drops a placeholder", async () => {
    const greetingIndex = emailSource.texts.indexOf(emailCopy.verification.greeting);
    readUiPackObject.mockResolvedValue(makePack("es", (text, index) =>
      index === greetingIndex ? "Hola," : `[es] ${text}`));
    const { subject, html } = await emailTemplates.verification("1", "A", "es");
    expect(subject).toBe(ENGLISH_SUBJECT);
    expect(html).toContain("Hello A,");
  });

  test("falls back to English when pack storage fails", async () => {
    readUiPackObject.mockRejectedValueOnce(new Error("r2 unavailable"));
    const { subject } = await emailTemplates.verification("1", "A", "it");
    expect(subject).toBe(ENGLISH_SUBJECT);
  });

  test("escapes interpolated user data", async () => {
    const { html } = await emailTemplates.verification("1", "<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert(1)</script>");
  });

  test("accountCreated renders credential rows with an English role fallback", async () => {
    const { subject, html } = await emailTemplates.accountCreated({
      firstName: "Jo",
      username: "johndoe",
      password: "Xy9!kP2m",
    });
    expect(subject).toBe("Exegesis Project - Your Account Has Been Created");
    expect(html).toContain("Username");
    expect(html).toContain("Temporary password");
    expect(html).toContain("Xy9!kP2m");
    expect(html).toContain("Member");
  });

  test("newSupportTicket fills the subject token without HTML-escaping it", async () => {
    const { subject, html } = await emailTemplates.newSupportTicket({
      ticket: {
        subject: "Can't sign in",
        ticketCode: "T-100",
        category: "Account",
        priority: "high",
        deviceInfo: "Pixel 6a",
        messages: [{ body: "Help me please" }],
      },
      reporter: { firstName: "Ann", lastName: "Lee", email: "ann@example.com" },
      adminUrl: "https://app.example.com/admin/support",
    });
    expect(subject).toBe("[Support] Can't sign in");
    expect(html).toContain("Ann Lee sent a message through the app.");
    expect(html).toContain("ann@example.com");
    expect(html).toContain("T-100");
    expect(html).toContain("Help me please");
  });
});
