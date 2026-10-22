import {
  ALLOWED_ORIGINS,
  corsOriginDelegate,
  isOriginAllowed,
} from "./corsOrigins.js";

describe("CORS origin allow-list", () => {
  it("allows the production web and app origins", () => {
    expect(isOriginAllowed("https://app.exegesisproject.org")).toBe(true);
    expect(isOriginAllowed("https://exegesisproject.org")).toBe(true);
  });

  it("allows local development origins", () => {
    expect(isOriginAllowed("http://localhost:5173")).toBe(true);
    expect(isOriginAllowed("http://localhost:5001")).toBe(true);
  });

  it("allows requests without an Origin header (native mobile clients)", () => {
    expect(isOriginAllowed(undefined)).toBe(true);
    expect(isOriginAllowed(null)).toBe(true);
    expect(isOriginAllowed("")).toBe(true);
  });

  it("rejects a foreign origin", () => {
    expect(isOriginAllowed("https://evil.example.com")).toBe(false);
    expect(isOriginAllowed("http://localhost:9999")).toBe(false);
  });

  it("rejects an origin that merely looks like an allowed one", () => {
    expect(isOriginAllowed("https://app.exegesisproject.org.evil.com")).toBe(false);
    expect(isOriginAllowed("https://evil.com/#https://app.exegesisproject.org")).toBe(
      false,
    );
  });

  it("ignores a trailing slash when matching", () => {
    expect(isOriginAllowed("https://app.exegesisproject.org/")).toBe(true);
  });

  it("tells the cors package to allow an allowed origin", () => {
    const callback = jest.fn();
    corsOriginDelegate("https://app.exegesisproject.org", callback);
    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it("tells the cors package to refuse a foreign origin", () => {
    const callback = jest.fn();
    corsOriginDelegate("https://evil.example.com", callback);
    expect(callback).toHaveBeenCalledWith(null, false);
  });

  it("never contains a wildcard", () => {
    expect(ALLOWED_ORIGINS).not.toContain("*");
  });
});
