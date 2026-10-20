// Browser daily reminders. Native devices use their local alarm so FCM cannot
// duplicate an offline-capable reminder or change its requested wall-clock time.
import cron from "node-cron";
import { prisma } from "../config/db.js";
import { getTodaysVerseForPush, sendToUsers } from "../modules/push/service.js";
import { dueReminder } from "../modules/push/reminderTime.js";

let isRunning = false;

export const runPushSweep = async (now = new Date()) => {
  if (isRunning) return;
  isRunning = true;
  try {
    const settings = await prisma.pushSetting.findMany({ where: { dailyVerseReminder: true } });
    const due = settings.map(setting => ({ setting, occurrence: dueReminder(setting, now) }))
      .filter(item => item.occurrence);
    const verses = new Map();
    let next = 0;
    const worker = async () => {
      while (next < due.length) {
        const { setting, occurrence } = due[next++];
        let claimed = false;
        let accepted = false;
        try {
          if (!verses.has(occurrence.day)) verses.set(occurrence.day, getTodaysVerseForPush(occurrence.day));
          const verse = await verses.get(occurrence.day);
          if (!verse) continue;
          // Do not re-evaluate against wall-clock drift: `set` was already
          // derived from the sweep time and the compare-and-set below is the
          // authority for exactly-one-send across instances.
          // Compare-and-set also prevents two backend instances sending the
          // same user/day simultaneously. Failed sends release this claim.
          const claim = await prisma.pushSetting.updateMany({
            where: { userId: setting.userId, lastPushedOn: setting.lastPushedOn,
              reminderTime: setting.reminderTime, timezone: setting.timezone, dailyVerseReminder: true },
            data: { lastPushedOn: now },
          });
          if (!claim.count) continue;
          claimed = true;
          const result = await sendToUsers([setting.userId], {
            title: `Daily Verse — ${verse.reference}`,
            body: verse.text || "Read today's daily verse.",
            platforms: ["web"], ttlSeconds: 300,
            data: { kind: "daily-verse", link: "/daily-verse", localDate: occurrence.day,
              scheduledTime: setting.reminderTime, timezone: setting.timezone,
              notificationId: `daily-verse-${occurrence.day}` },
          });
          accepted = result.acceptedUserIds?.includes(setting.userId) === true;
          console.log("[PushScheduler]", JSON.stringify({ userId: setting.userId,
            localDate: occurrence.day, timezone: setting.timezone, scheduledTime: setting.reminderTime,
            delayMinutes: occurrence.delayMinutes, sentAt: now.toISOString(), accepted, sent: result.sent }));
        } catch (error) {
          console.error("[PushScheduler] reminder failed:", error.message);
        } finally {
          if (claimed && !accepted) {
            await prisma.pushSetting.updateMany({
              where: { userId: setting.userId, lastPushedOn: now },
              data: { lastPushedOn: setting.lastPushedOn },
            }).catch(error => console.error("[PushScheduler] claim release failed:", error.message));
          }
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(4, due.length) }, worker));
  } finally {
    isRunning = false;
  }
};

export const startPushScheduler = () => {
  const run = () => runPushSweep().catch(error => console.error("[PushScheduler] sweep error:", error.message));
  const task = cron.schedule("* * * * *", run);
  void run();
  console.log("[PushScheduler] Browser daily-verse sweep started (local calendar day, 5-minute catch-up)");
  return task;
};
