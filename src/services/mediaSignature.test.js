import {
  isPrivateMediaKey,
  signMediaPath,
  verifyMediaSignature,
} from "./mediaSignature.js";

describe("media signatures", () => {
  const privateKey = "support/123e4567-e89b-12d3-a456-426614174000.png";
  const publicKey = "profile-photos/123e4567-e89b-12d3-a456-426614174000.png";

  it("treats support attachments as private and profile photos as public", () => {
    expect(isPrivateMediaKey(privateKey)).toBe(true);
    expect(isPrivateMediaKey(publicKey)).toBe(false);
  });

  it("signs a media path with an expiry and a signature", () => {
    const signed = signMediaPath(`/media/${privateKey}`);
    expect(signed).toContain("exp=");
    expect(signed).toContain("sig=");
  });

  it("verifies a freshly signed path", () => {
    const signed = signMediaPath(`/media/${privateKey}`);
    const url = new URL(signed, "http://localhost");
    expect(
      verifyMediaSignature(privateKey, url.searchParams.get("exp"), url.searchParams.get("sig")),
    ).toBe(true);
  });

  it("rejects a tampered key", () => {
    const signed = signMediaPath(`/media/${privateKey}`);
    const url = new URL(signed, "http://localhost");
    expect(
      verifyMediaSignature(
        "support/00000000-0000-4000-8000-000000000000.png",
        url.searchParams.get("exp"),
        url.searchParams.get("sig"),
      ),
    ).toBe(false);
  });

  it("rejects a tampered expiry", () => {
    const signed = signMediaPath(`/media/${privateKey}`);
    const url = new URL(signed, "http://localhost");
    const expired = String(Number(url.searchParams.get("exp")) + 3600);
    expect(
      verifyMediaSignature(privateKey, expired, url.searchParams.get("sig")),
    ).toBe(false);
  });

  it("rejects an expired signature", () => {
    const signed = signMediaPath(`/media/${privateKey}`, -10);
    const url = new URL(signed, "http://localhost");
    expect(
      verifyMediaSignature(privateKey, url.searchParams.get("exp"), url.searchParams.get("sig")),
    ).toBe(false);
  });

  it("rejects a missing signature", () => {
    expect(verifyMediaSignature(privateKey, undefined, undefined)).toBe(false);
    expect(verifyMediaSignature(privateKey, "9999999999", "")).toBe(false);
  });

  it("does not double-sign an already signed path", () => {
    const once = signMediaPath(`/media/${privateKey}`);
    const twice = signMediaPath(once);
    expect(twice).toBe(once);
  });

  it("appends to a path that already has a query string", () => {
    const signed = signMediaPath(`/media/${privateKey}?v=2`);
    expect(signed).toContain("?v=2&exp=");
  });
});
