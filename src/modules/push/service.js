/**
 * service.js — Push notifications (FCM)
 * ─────────────────────────────────────────────────────────────────────────────
 * Wraps firebase-admin messaging so the rest of the app never touches the SDK.
 *
 * Credential resolution (in priority order):
 *   1. FIREBASE_SERVICE_ACCOUNT_JSON — full service-account JSON as a string
 *   2. GOOGLE_APPLICATION_CREDENTIALS — path to a service-account file
 *   3. Fallback: application-default credentials (Workload Identity / `gcloud
 *      auth application-default login` on dev machines)
 *
 * If messaging cannot be initialized, the service is treated as DISABLED:
 * every send no-ops with a single warning instead of crashing requests.
 */

import { readFileSync } from "fs";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { prisma } from "../../config/db.js";
import { formatApiResponse } from "../../utils/helpers.js";

// ── Firebase Admin init (lazy, once) ─────────────────────────────────────────
let messagingEnabled = false;
let initAttempted = false;

function initFirebaseAdmin() {
  if (initAttempted) return messagingEnabled;
  initAttempted = true;

  try {
    if (getApps().length > 0) {
      messagingEnabled = true;
      return true;
    }

    const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (json) {
      initializeApp({ credential: cert(JSON.parse(json)) });
      messagingEnabled = true;
      console.log("[push] firebase-admin initialized from FIREBASE_SERVICE_ACCOUNT_JSON");
      return true;
    }

    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (credPath) {
      initializeApp({ credential: cert(readFileSync(credPath, "utf8")) });
      messagingEnabled = true;
      console.log("[push] firebase-admin initialized from GOOGLE_APPLICATION_CREDENTIALS");
      return true;
    }

    // Last resort: application-default credentials (may work on GCP infra).
    initializeApp();
    messagingEnabled = true;
    console.log("[push] firebase-admin initialized with application-default credentials");
    return true;
  } catch (error) {
    messagingEnabled = false;
    console.warn(
      "[push] firebase-admin NOT configured — push sends will be skipped.",
      error.message,
    );
    return false;
  }
}

// ── Token registry ───────────────────────────────────────────────────────────

/**
 * Register (or refresh) a device push token for a user.
 * Idempotent: re-registering the same token re-points it at the current user
 * (handles shared devices where one browser logs into different accounts).
 */
export const registerToken = async (userId, token, platform = "web") => {
  await prisma.pushToken.upsert({
    where: { token },
    create: { userId, token, platform },
    update: { userId, platform, lastSeenAt: new Date() },
  });
};

/** Remove a token (logout / permission revoked / token rotated). */
export const unregisterToken = async (token) => {
  await prisma.pushToken.deleteMany({ where: { token } });
};

// ── Per-user settings ────────────────────────────────────────────────────────

export const getSettings = async (userId) => {
  let settings = await prisma.pushSetting.findUnique({ where: { userId } });
  if (!settings) {
    settings = await prisma.pushSetting.create({
      data: { userId, timezone: "UTC" },
    });
  }
  return settings;
};

export const updateSettings = async (userId, patch) => {
  const allowed = {};
  if (typeof patch.dailyVerseReminder === "boolean") {
    allowed.dailyVerseReminder = patch.dailyVerseReminder;
  }
  if (typeof patch.reminderTime === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(patch.reminderTime)) {
    allowed.reminderTime = patch.reminderTime;
  }
  if (typeof patch.timezone === "string" && patch.timezone.length <= 64) {
    allowed.timezone = patch.timezone;
  }

  const settings = await prisma.pushSetting.upsert({
    where: { userId },
    create: { userId, ...allowed },
    update: allowed,
  });
  return settings;
};

// ── Sending ──────────────────────────────────────────────────────────────────

const MAX_TOKENS_PER_BATCH = 500;

/**
 * Send a notification to every token belonging to the given user ids.
 * Prunes tokens that FCM reports as invalid/unregistered.
 * Returns { sent, pruned } — counts only (never throws).
 */
export const sendToUsers = async (userIds, { title, body, data = {} }) => {
  if (!initFirebaseAdmin()) {
    return { sent: 0, pruned: 0, disabled: true };
  }
  if (!userIds?.length) return { sent: 0, pruned: 0 };

  const tokens = await prisma.pushToken.findMany({
    where: { userId: { in: userIds } },
    select: { token: true },
  });
  if (!tokens.length) return { sent: 0, pruned: 0 };

  const tokenList = tokens.map((t) => t.token);
  let sent = 0;
  let pruned = 0;

  for (let i = 0; i < tokenList.length; i += MAX_TOKENS_PER_BATCH) {
    const batch = tokenList.slice(i, i + MAX_TOKENS_PER_BATCH);
    try {
      const response = await getMessaging().sendEachForWebPush(
        batch.map((token) => ({
          token,
          notification: { title, body },
          webpush: {
            fcmOptions: { link: data.link || `${process.env.CLIENT_URL || "https://exegesisproject.org"}/` },
          },
          data: Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, String(v ?? "")]),
          ),
        })),
      );
      sent += response.successCount;

      // Prune dead tokens so the registry stays clean.
      const dead = [];
      response.responses.forEach((r, idx) => {
        if (!r.success) {
          const code = r.error?.code ?? "";
          if (
            code === "messaging/registration-token-not-registered" ||
            code === "messaging/invalid-registration-token" ||
            code === "messaging/invalid-argument"
          ) {
            dead.push(batch[idx]);
          }
        }
      });
      if (dead.length) {
        await prisma.pushToken.deleteMany({ where: { token: { in: dead } } });
        pruned += dead.length;
      }
    } catch (error) {
      console.error("[push] batch send failed:", error.message);
    }
  }

  return { sent, pruned };
};

/**
 * Resolve the users whose daily-verse reminder should fire for `utcNow`.
 * Matches PushSetting.reminderTime ("HH:MM") against the user's timezone.
 */
export const getUsersDueForReminder = async (utcNow = new Date()) => {
  const settings = await prisma.pushSetting.findMany({
    where: { dailyVerseReminder: true },
    select: { userId: true, reminderTime: true, timezone: true },
  });
  if (!settings.length) return [];

  const due = [];
  for (const s of settings) {
    try {
      const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: s.timezone || "UTC",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const [hour, minute] = formatter.format(utcNow).split(":");
      const local = `${hour}:${minute}`;
      if (local === s.reminderTime) due.push(s.userId);
    } catch {
      // Invalid timezone stored — skip this user rather than fail the sweep.
    }
  }
  return due;
};

/** Fetch today's daily verse (published) — mirrors getTodaysVerse's core query. */
export const getTodaysVerseForPush = async () => {
  const utcToday = new Date(new Date().toISOString().slice(0, 10));
  let dv = await prisma.dailyVerse.findFirst({
    where: { displayDate: { gte: utcToday }, isPublished: true },
    orderBy: { displayDate: "asc" },
  });
  if (!dv) {
    dv = await prisma.dailyVerse.findFirst({
      where: { isPublished: true },
      orderBy: { displayDate: "desc" },
    });
  }
  if (!dv) return null;
  const reference = `${dv.bookName} ${dv.chapter}:${dv.verseNumber}`;
  const text = (dv.explanation || "").slice(0, 140);
  return { reference, text };
};

// ── Response helpers for the controller ──────────────────────────────────────

export const ok = (res, message, data = null) =>
  res.json(formatApiResponse({ status: 200, message, data }));
