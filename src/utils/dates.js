/**
 * Shared date parsing utility.
 *
 * Converts a YYYY-MM-DD string (as sent by the frontend) into a Date
 * object set to **UTC midnight** of that day.  This prevents timezone
 * drift on servers that run ahead of UTC (e.g. UTC+3 EAT) where
 * `new Date("2026-08-19")` would silently become the 18th in UTC.
 *
 * For non-YYYY-MM-DD strings it falls back to `new Date(value)`.
 */
export const parseLocalDate = (value) => {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  }
  return new Date(value);
};

/**
 * Create a UTC-midnight Date for "today" (or an explicit offset from today).
 *
 * Useful for queries like `displayDate >= today()` where `today` must
 * match the same UTC-midnight convention used by `parseLocalDate`.
 *
 * @param {number} dayOffset - Days from today (0 = today, default 0)
 * @returns {Date}
 */
export const utcToday = (dayOffset = 0) => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  if (dayOffset !== 0) d.setUTCDate(d.getUTCDate() + dayOffset);
  return d;
};
