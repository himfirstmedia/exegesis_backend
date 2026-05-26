import cron from "node-cron";
import { processPendingMessages } from "../services/emailService.js";

const CRON_INTERVAL = "*/20 * * * * *";

export const startEmailScheduler = () => {
  console.log(`Email scheduler started - running every 20 seconds`);
  console.log("Running email scheduler...");
  cron.schedule(CRON_INTERVAL, async () => {
    
    try {
      await processPendingMessages();
    } catch (error) {
      console.error("Email scheduler error:", error.message);
    }
  });
};

export const stopEmailScheduler = () => {
  cron.stop();
  console.log("Email scheduler stopped");
};