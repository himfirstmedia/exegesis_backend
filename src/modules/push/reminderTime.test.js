const { isValidTimeZone, localClock, dueReminder } = require("./reminderTime.js");

describe("isValidTimeZone", () => {
  test("accepts a real IANA zone", () => {
    expect(isValidTimeZone("America/New_York")).toBe(true);
    expect(isValidTimeZone("UTC")).toBe(true);
  });

  test("rejects junk and oversized input", () => {
    expect(isValidTimeZone("Not/AZone")).toBe(false);
    expect(isValidTimeZone("")).toBe(false);
    expect(isValidTimeZone(null)).toBe(false);
    expect(isValidTimeZone(42)).toBe(false);
    expect(isValidTimeZone("a".repeat(65))).toBe(false);
  });
});

describe("localClock", () => {
  test("reports the recipient's calendar day and minute-of-day", () => {
    // 2026-01-15T12:00:00Z is 07:00 in New York (UTC-5).
    const clock = localClock(new Date("2026-01-15T12:00:00.000Z"), "America/New_York");
    expect(clock.day).toBe("2026-01-15");
    expect(clock.minute).toBe(7 * 60);
  });

  test("attributes late-UTC instants to the correct local day", () => {
    // 03:00Z on the 16th is still 22:00 on the 15th in New York.
    const clock = localClock(new Date("2026-01-16T03:00:00.000Z"), "America/New_York");
    expect(clock.day).toBe("2026-01-15");
    expect(clock.minute).toBe(22 * 60);
  });
});

describe("dueReminder", () => {
  const base = {
    dailyVerseReminder: true,
    reminderTime: "07:00",
    timezone: "America/New_York",
    lastPushedOn: null,
  };

  test("fires inside the grace window on the matching local day", () => {
    // 07:02 in New York.
    const result = dueReminder(base, new Date("2026-01-15T12:02:00.000Z"));
    expect(result).toEqual({ day: "2026-01-15", delayMinutes: 2 });
  });

  test("does not fire before the scheduled time", () => {
    expect(dueReminder(base, new Date("2026-01-15T11:58:00.000Z"))).toBeNull();
  });

  test("does not fire hours later", () => {
    expect(dueReminder(base, new Date("2026-01-15T15:00:00.000Z"))).toBeNull();
  });

  test("respects the configurable grace window", () => {
    const now = new Date("2026-01-15T12:30:00.000Z"); // 07:30 local
    expect(dueReminder(base, now)).toBeNull();
    expect(dueReminder(base, now, 45)).toEqual({ day: "2026-01-15", delayMinutes: 30 });
  });

  test("deduplicates on the recipient's local calendar day, not UTC midnight", () => {
    const lastPushedOn = new Date("2026-01-15T12:01:00.000Z");
    expect(dueReminder({ ...base, lastPushedOn }, new Date("2026-01-15T12:03:00.000Z"))).toBeNull();
    // New local day fires again.
    expect(dueReminder({ ...base, lastPushedOn }, new Date("2026-01-16T12:01:00.000Z"))).toEqual({
      day: "2026-01-16",
      delayMinutes: 1,
    });
  });

  test("is disabled, invalid zone, or malformed time safe", () => {
    expect(dueReminder({ ...base, dailyVerseReminder: false }, new Date("2026-01-15T12:02:00.000Z"))).toBeNull();
    expect(dueReminder({ ...base, timezone: "Nowhere/Bad" }, new Date("2026-01-15T12:02:00.000Z"))).toBeNull();
    expect(dueReminder({ ...base, reminderTime: "25:99" }, new Date("2026-01-15T12:02:00.000Z"))).toBeNull();
  });
});
