export const isValidTimeZone = (timezone) => {
  if (typeof timezone !== "string" || !timezone || timezone.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone }).format();
    return true;
  } catch {
    return false;
  }
};

export const localClock = (date, timezone) => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date).map(({ type, value }) => [type, value]));
  return {
    day: `${parts.year}-${parts.month}-${parts.day}`,
    minute: (Number(parts.hour) % 24) * 60 + Number(parts.minute),
  };
};

// Recover a briefly missed cron tick, but do not send a stale reminder hours
// later. Deduplicate by the recipient's calendar day, not UTC midnight.
export const dueReminder = (setting, now, graceMinutes = 5) => {
  if (!setting.dailyVerseReminder || !isValidTimeZone(setting.timezone)) return null;
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(setting.reminderTime)) return null;
  const clock = localClock(now, setting.timezone);
  const [hour, minute] = setting.reminderTime.split(":").map(Number);
  const delayMinutes = clock.minute - (hour * 60 + minute);
  if (delayMinutes < 0 || delayMinutes > graceMinutes) return null;
  if (setting.lastPushedOn && localClock(new Date(setting.lastPushedOn), setting.timezone).day >= clock.day) return null;
  return { day: clock.day, delayMinutes };
};
