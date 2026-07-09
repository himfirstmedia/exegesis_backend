/**
 * popularSearchCleanup.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Scheduled job that prunes search log entries older than 30 days.
 * Runs daily at midnight.
 *
 * Registered in server.js alongside startEmailScheduler.
 */

import cron from "node-cron";
import { prisma } from "../config/db.js";

const CRON_SCHEDULE = "0 0 * * *"; // Every day at midnight
const RETENTION_DAYS = 30;

export const startPopularSearchCleanup = () => {
  console.log(
    `[popularSearchCleanup] Scheduler started — pruning logs older than ${RETENTION_DAYS} days daily at midnight`,
  );

  cron.schedule(CRON_SCHEDULE, async () => {
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

      const result = await prisma.popularSearchLog.deleteMany({
        where: {
          createdOn: { lt: cutoff },
        },
      });

      console.log(
        `[popularSearchCleanup] Deleted ${result.count} search log entries older than ${RETENTION_DAYS} days`,
      );
    } catch (error) {
      console.error("[popularSearchCleanup] Error during cleanup:", error.message);
    }
  });
};
