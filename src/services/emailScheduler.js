import cron from "node-cron";
import { processPendingMessages } from "../services/emailService.js";
import { isTransientDbError } from "../utils/dbRetry.js";

// Run every 30 seconds under normal conditions.
const CRON_INTERVAL = "*/30 * * * * *";
// Exponential backoff when the database is unavailable: 1m → 2m → 4m → 5m cap.
// Without this the scheduler hammered a dead connection pool every 30s during
// outages, starving the API of connections (the P2024 "connection pool
// timeout" spam) and flooding the logs.
const BASE_BACKOFF_SECONDS = 60;
const MAX_BACKOFF_SECONDS = 300;

let isRunning = false;
let backoffSeconds = 0; // 0 = healthy, runs every tick
let nextAllowedRunAt = 0;

const schedule = (seconds) => {
  nextAllowedRunAt = Date.now() + seconds * 1000;
};

export const startEmailScheduler = () => {
  console.log(`Email scheduler started - running every 30 seconds`);

  cron.schedule(CRON_INTERVAL, async () => {
    // Prevent overlapping runs.
    if (isRunning) {
      console.log("[EmailScheduler] Previous run still in progress, skipping...");
      return;
    }
    // Backoff gate: skip ticks while waiting for the database to recover.
    if (Date.now() < nextAllowedRunAt) return;

    isRunning = true;
    try {
      await processPendingMessages();
      // Healthy run — clear any backoff.
      if (backoffSeconds > 0) {
        console.log("[EmailScheduler] Database recovered — resuming normal schedule");
      }
      backoffSeconds = 0;
      nextAllowedRunAt = 0;
    } catch (error) {
      if (isTransientDbError(error)) {
        backoffSeconds =
          backoffSeconds === 0
            ? BASE_BACKOFF_SECONDS
            : Math.min(backoffSeconds * 2, MAX_BACKOFF_SECONDS);
        schedule(backoffSeconds);
        console.error(
          `[EmailScheduler] Database unavailable — next attempt in ~${backoffSeconds}s`,
        );
      } else {
        console.error("[EmailScheduler] Error:", error.message);
      }
    } finally {
      isRunning = false;
    }
  });
};

export const stopEmailScheduler = () => {
  cron.stop();
  console.log("Email scheduler stopped");
};
