/**
 * pushNotificationScheduler.js — Daily-verse push sweep
 * ─────────────────────────────────────────────────────────────────────────────
 * Runs every minute. Finds users whose local time matches their saved
 * reminderTime ("HH:MM" in their timezone) and sends the daily verse.
 *
 * De-dup: PushSetting.lastPushedOn stores the UTC day of the last successful
 * send. A user is only re-sent if lastPushedOn is before today — so a user
 * is notified at most once per local reminder occurrence per day, and the
 * sweep stays idempotent across restarts/redeploys.
 */

import cron from "node-cron";
import { prisma } from "../config/db.js";
import { getUsersDueForReminder, getTodaysVerseForPush, sendToUsers } from "../modules/push/service.js";

const CRON_INTERVAL = "* * * * *"; // every minute
let isRunning = false;

/** UTC-midnight timestamp for the day containing `date`. */
const utcDayStart = (date = new Date()) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

export const startPushScheduler = () => {
  console.log("[PushScheduler] Daily-verse push sweep started (every minute)");
  cron.schedule(CRON_INTERVAL, async () => {
    if (isRunning) return;
    isRunning = true;
    try {
      const now = new Date();
      const today = utcDayStart(now);

      const settings = await prisma.pushSetting.findMany({
        where: {
          dailyVerseReminder: true,
          OR: [{ lastPushedOn: null }, { lastPushedOn: { lt: today } }],
        },
        select: { userId: true, reminderTime: true, timezone: true },
      });
      if (!settings.length) return;

      // Keep only users whose LOCAL clock currently matches their reminder time.
      const due = [];
      for (const s of settings) {
        try {
          const formatter = new Intl.DateTimeFormat("en-GB", {
            timeZone: s.timezone || "UTC",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
          const [hour, minute] = formatter.format(now).split(":");
          if (`${hour}:${minute}` === s.reminderTime) due.push(s);
        } catch {
          // Invalid timezone stored — skip rather than fail the whole sweep.
        }
      }
      if (!due.length) return;

      const verse = await getTodaysVerseForPush();
      if (!verse) return;

      const title = `Daily Verse — ${verse.reference}`;
      const body = verse.text || "Read today's daily verse.";
      const userIds = due.map((s) => s.userId);
      const result = await sendToUsers(userIds, {
        title,
        body,
        data: { kind: "daily-verse", link: "/daily-verse" },
      });

      // Mark only users with at least one delivered push as done for today.
      if (result.sent > 0) {
        await prisma.pushSetting.updateMany({
          where: { userId: { in: userIds } },
          data: { lastPushedOn: now },
        });
      }
      console.log(
        `[PushScheduler] ${result.disabled ? "Push disabled" : `Sent to ${result.sent} device(s)`}` +
          ` for ${userIds.length} due user(s)`,
      );
    } catch (error) {
      console.error("[PushScheduler] sweep error:", error.message);
    } finally {
      isRunning = false;
    }
  });
};
