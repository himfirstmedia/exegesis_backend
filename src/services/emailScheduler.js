import cron from "node-cron";
import { processPendingMessages } from "../services/emailService.js";

// Run every 30 seconds instead of 20 — gives the connection pool time to recover
const CRON_INTERVAL = "*/30 * * * * *";

let isRunning = false;

export const startEmailScheduler = () => {
  console.log(`Email scheduler started - running every 30 seconds`);
  
  cron.schedule(CRON_INTERVAL, async () => {
    // Prevent overlapping runs — if the previous cycle is still processing, skip this one
    if (isRunning) {
      console.log("[EmailScheduler] Previous run still in progress, skipping...");
      return;
    }

    isRunning = true;
    try {
      await processPendingMessages();
    } catch (error) {
      console.error("[EmailScheduler] Error:", error.message);
    } finally {
      isRunning = false;
    }
  });
};

export const stopEmailScheduler = () => {
  cron.stop();
  console.log("Email scheduler stopped");
};
