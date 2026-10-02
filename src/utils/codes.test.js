import { describe, it, expect, beforeAll } from "@jest/globals";

beforeAll(async () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-key";
});

const load = () => import("./codes.js");

describe("codes util", () => {
  it("hashes deterministically", async () => {
    const { hashCode } = await load();
    expect(hashCode("123456")).toBe(hashCode("123456"));
    expect(hashCode("123456")).not.toBe("123456");
  });

  it("matches a stored hash", async () => {
    const { hashCode, codeMatches } = await load();
    const stored = hashCode("654321");
    expect(codeMatches("654321", stored)).toBe(true);
    expect(codeMatches("000000", stored)).toBe(false);
  });

  it("supports legacy plaintext rows", async () => {
    const { codeMatches } = await load();
    expect(codeMatches("123456", "123456")).toBe(true);
    expect(codeMatches("123456", "999999")).toBe(false);
  });

  it("rejects null-ish input", async () => {
    const { hashCode, codeMatches } = await load();
    expect(codeMatches(null, hashCode("1"))).toBe(false);
    expect(codeMatches("1", null)).toBe(false);
  });
});