import cron from "node-cron";
import { processPendingMessages } from "../services/emailService.js";
import { cache } from "../services/cacheService.js";
import { isTransientDbError } from "../utils/dbRetry.js";

// Run every 30 seconds under normal conditions.
const CRON_INTERVAL = "*/30 * * * * *";
// The distributed lock must outlive the slowest healthy run, but must also
// expire quickly enough that a crashed instance cannot block the queue for
// long. 2 minutes is comfortably above the 30s cadence.
const LOCK_TTL_SECONDS = 120;
const LOCK_NAME = "email-scheduler";
// Renew the lock while a sweep is still running so a slow batch (many
// recipients, SMTP retries) cannot outlive the TTL and let a second instance
// start sending the same rows.
const LOCK_RENEW_INTERVAL_MS = Math.floor((LOCK_TTL_SECONDS * 1000) / 3);
// Exponential backoff when the database is unavailable: 1m → 2m → 4m → 5m cap.
// Without this the scheduler hammered a dead connection pool every 30s during
// outages, starving the API of connections (the P2024 "connection pool
// timeout" spam) and flooding the logs.
const BASE_BACKOFF_SECONDS = 60;
const MAX_BACKOFF_SECONDS = 300;

let isRunning = false;
let backoffSeconds = 0; // 0 = healthy, runs every tick
let nextAllowedRunAt = 0;
// Log lock contention only when the holder changes, not on every 30s tick.
// The whole point of the lock is that only one instance works; the other
// instances should sit quietly rather than print a line every tick.
let lockHeldByOther = false;
let scheduledTask = null;

const schedule = (seconds) => {
  nextAllowedRunAt = Date.now() + seconds * 1000;
};

/**
 * Keep the distributed lock alive for the duration of a long sweep. The timer
 * is unref'd so it never keeps the process (or a test) alive on its own.
 */
const startLockRenewal = (lock) => {
  if (typeof lock.renew !== "function") return null;
  const timer = setInterval(() => {
    lock
      .renew()
      .then((renewed) => {
        if (!renewed) {
          console.warn(
            "[EmailScheduler] Lost the queue lock mid-sweep; another instance may take over.",
          );
        }
      })
      .catch(() => {
        // Redis blips are already surfaced by the cache layer.
      });
  }, LOCK_RENEW_INTERVAL_MS);
  if (typeof timer.unref === "function") timer.unref();
  return timer;
};

/**
 * One scheduler tick. Exported so tests can drive it without timers.
 */
export const runEmailSweep = async () => {
  // Prevent overlapping runs inside this process. Set the flag before the
  // lock round-trip so two ticks cannot both pass the check while awaiting.
  if (isRunning) {
    console.log("[EmailScheduler] Previous run still in progress, skipping...");
    return;
  }
  // Backoff gate: skip ticks while waiting for the database to recover.
  if (Date.now() < nextAllowedRunAt) return;

  // Prevent two instances sending the same queued email. The lock is released
  // in `finally`, so a healthy run never waits for the TTL.
  isRunning = true;
  let lock = await cache.acquireLock(LOCK_NAME, LOCK_TTL_SECONDS);
  if (!lock.acquired) {
    // A crash or an older release can leave a lock with no expiry, which would
    // starve the queue forever. Break it once and retry before standing by.
    const recovered = await cache.recoverStaleLock?.(LOCK_NAME);
    if (recovered) {
      lock = await cache.acquireLock(LOCK_NAME, LOCK_TTL_SECONDS);
    }
  }
  if (!lock.acquired) {
    isRunning = false;
    if (!lockHeldByOther) {
      lockHeldByOther = true;
      console.log(
        "[EmailScheduler] Another instance owns the queue; standing by.",
      );
    }
    return;
  }
  if (lockHeldByOther) {
    console.log("[EmailScheduler] Acquired the queue lock; resuming sweeps.");
    lockHeldByOther = false;
  }

  const renewTimer = startLockRenewal(lock);
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
    if (renewTimer) clearInterval(renewTimer);
    isRunning = false;
    await lock.release();
  }
};

export const startEmailScheduler = () => {
  if (scheduledTask) return;
  console.log(`Email scheduler started - running every 30 seconds`);

  // node-cron (v4) returns the scheduled task; there is no module-level
  // `cron.stop`, so keep the handle to be able to stop it on shutdown.
  scheduledTask = cron.schedule(CRON_INTERVAL, () => {
    runEmailSweep().catch((error) =>
      console.error("[EmailScheduler] Unhandled sweep error:", error.message),
    );
  });
};

export const stopEmailScheduler = () => {
  if (!scheduledTask) return;
  try {
    scheduledTask.stop();
  } catch (error) {
    console.error("[EmailScheduler] Failed to stop scheduler:", error.message);
  }
  scheduledTask = null;
  console.log("Email scheduler stopped");
};

/** Test-only: reset the in-process backoff state between cases. */
export const __resetEmailSchedulerState = () => {
  isRunning = false;
  backoffSeconds = 0;
  nextAllowedRunAt = 0;
  lockHeldByOther = false;
  scheduledTask = null;
};
