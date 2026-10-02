import { describe, it, expect } from "@jest/globals";
import { validatePassword, PASSWORD_REQUIREMENTS_MESSAGE } from "./passwordPolicy.js";

describe("validatePassword", () => {
  it("rejects short passwords", () => {
    expect(validatePassword("Ab1!")).toBe(PASSWORD_REQUIREMENTS_MESSAGE);
  });

  it("rejects missing character classes", () => {
    expect(validatePassword("abcdefg1!")).toBe(PASSWORD_REQUIREMENTS_MESSAGE); // no uppercase
    expect(validatePassword("ABCDEFG1!")).toBe(PASSWORD_REQUIREMENTS_MESSAGE); // no lowercase
    expect(validatePassword("Abcdefgh!")).toBe(PASSWORD_REQUIREMENTS_MESSAGE); // no number
    expect(validatePassword("Abcdefg1")).toBe(PASSWORD_REQUIREMENTS_MESSAGE); // no special
  });

  it("rejects non-strings", () => {
    expect(validatePassword(null)).toBe(PASSWORD_REQUIREMENTS_MESSAGE);
    expect(validatePassword(12345678)).toBe(PASSWORD_REQUIREMENTS_MESSAGE);
  });

  it("accepts a compliant password", () => {
    expect(validatePassword("Str0ng!Pass")).toBeNull();
  });
});