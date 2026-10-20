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
import { dueReminder, isValidTimeZone } from "./reminderTime.js";

// ── Firebase Admin init (lazy, once) ─────────────────────────────────────────
let messagingEnabled = false;
let initAttempted = false;

function initFirebaseAdmin() {
  if (initAttempted) return messagingEnabled;
  initAttempted = true;

  try {
    if (getApps().length > 0) {
      const projectId = getApps()[0].options.projectId;
      const expectedProjectId = process.env.FIREBASE_PROJECT_ID?.trim();
      if (expectedProjectId && projectId && expectedProjectId !== projectId) {
        throw new Error(`Firebase project mismatch: expected ${expectedProjectId}, initialized app uses ${projectId}`);
      }
      messagingEnabled = true;
      console.log(`[push] firebase-admin already initialized (project: ${projectId || "auto-detected"})`);
      return true;
    }

    const expectedProjectId = process.env.FIREBASE_PROJECT_ID?.trim();
    const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (json) {
      const serviceAccount = JSON.parse(json);
      const credentialProjectId = serviceAccount.project_id || serviceAccount.projectId;
      if (expectedProjectId && credentialProjectId && expectedProjectId !== credentialProjectId) {
        throw new Error(`Firebase project mismatch: expected ${expectedProjectId}, credentials use ${credentialProjectId}`);
      }
      const projectId = expectedProjectId || credentialProjectId;
      initializeApp({ credential: cert(serviceAccount), ...(projectId && { projectId }) });
      messagingEnabled = true;
      console.log(`[push] firebase-admin initialized from FIREBASE_SERVICE_ACCOUNT_JSON (project: ${projectId || "auto-detected"})`);
      return true;
    }

    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (credPath) {
      const serviceAccount = JSON.parse(readFileSync(credPath, "utf8"));
      const credentialProjectId = serviceAccount.project_id || serviceAccount.projectId;
      if (expectedProjectId && credentialProjectId && expectedProjectId !== credentialProjectId) {
        throw new Error(`Firebase project mismatch: expected ${expectedProjectId}, credentials use ${credentialProjectId}`);
      }
      const projectId = expectedProjectId || credentialProjectId;
      initializeApp({ credential: cert(serviceAccount), ...(projectId && { projectId }) });
      messagingEnabled = true;
      console.log(`[push] firebase-admin initialized from GOOGLE_APPLICATION_CREDENTIALS (project: ${projectId || "auto-detected"})`);
      return true;
    }

    // Last resort: application-default credentials (may work on GCP infra).
    initializeApp(expectedProjectId ? { projectId: expectedProjectId } : undefined);
    messagingEnabled = true;
    console.log(`[push] firebase-admin initialized with application-default credentials (project: ${expectedProjectId || "auto-detected"})`);
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
export const registerToken = async (userId, token, platform = "web", timezone) => {
  await prisma.pushToken.upsert({
    where: { token },
    create: { userId, token, platform },
    update: { userId, platform, lastSeenAt: new Date() },
  });
  if (isValidTimeZone(timezone)) {
    await prisma.pushSetting.upsert({
      where: { userId }, create: { userId, timezone }, update: {},
    });
  }
};

/** Remove a token (logout / permission revoked / token rotated). */
export const unregisterToken = async (userId, token) => {
  await prisma.pushToken.deleteMany({ where: { userId, token } });
};

export const initializePushService = () => initFirebaseAdmin();

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
  if (patch.timezone !== undefined && !isValidTimeZone(patch.timezone)) {
    throw Object.assign(new Error("A valid IANA timezone is required"), { statusCode: 400 });
  }
  if (typeof patch.timezone === "string") {
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
export const sendToUsers = async (userIds, { title, body, imageUrl, data = {}, platforms, ttlSeconds = 86400 }) => {
  if (!initFirebaseAdmin()) {
    return { sent: 0, pruned: 0, acceptedUserIds: [], disabled: true };
  }
  if (!userIds?.length) return { sent: 0, pruned: 0, acceptedUserIds: [] };

  const tokens = await prisma.pushToken.findMany({
    where: { userId: { in: userIds }, ...(platforms && { platform: { in: platforms } }) },
    select: { token: true, userId: true },
  });
  if (!tokens.length) return { sent: 0, pruned: 0, acceptedUserIds: [] };

  const baseUrl = process.env.CLIENT_URL || "https://app.exegesisproject.org";
  const base = new URL(baseUrl);
  const target = new URL(data.link || "/", base);
  const link = target.origin === base.origin ? target.href : base.href;
  const payload = Object.fromEntries(Object.entries({ ...data, link, sentAt: new Date().toISOString() })
    .map(([k, v]) => [k, String(v ?? "")]));
  const tag = payload.notificationId || payload.kind || "exegesis-push";
  const acceptedUserIds = new Set();
  let sent = 0;
  let pruned = 0;

  for (let i = 0; i < tokens.length; i += MAX_TOKENS_PER_BATCH) {
    const batch = tokens.slice(i, i + MAX_TOKENS_PER_BATCH);
    try {
      const response = await getMessaging().sendEach(
        batch.map(({ token }) => ({
          token,
          notification: { title, body, ...(imageUrl && { imageUrl }) },
          android: {
            priority: "high", ttl: ttlSeconds * 1000,
            notification: { channelId: "exegesis-default", sound: "default", tag },
          },
          apns: {
            headers: { "apns-priority": "10", "apns-push-type": "alert", "apns-expiration": String(Math.floor(Date.now() / 1000) + ttlSeconds) },
            payload: { aps: { sound: "default", ...(imageUrl && { mutableContent: true }) } },
            ...(imageUrl && { fcmOptions: { imageUrl } }),
          },
          webpush: {
            headers: { Urgency: "high", TTL: String(ttlSeconds) },
            notification: { tag, data: payload },
            fcmOptions: { link },
          },
          data: payload,
        })),
      );
      sent += response.successCount;

      // Prune dead tokens so the registry stays clean.
      const dead = [];
      response.responses.forEach((r, idx) => {
        if (r.success && batch[idx].userId) acceptedUserIds.add(batch[idx].userId);
        if (!r.success) {
          const code = r.error?.code ?? "";
          if (
            code === "messaging/registration-token-not-registered" ||
            code === "messaging/invalid-registration-token" ||
            code === "messaging/mismatched-credential" ||
            code === "messaging/sender-id-mismatch"
          ) {
            dead.push(batch[idx].token);
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

  return { sent, pruned, acceptedUserIds: [...acceptedUserIds] };
};

/**
 * Resolve the users whose daily-verse reminder should fire for `utcNow`.
 * Matches PushSetting.reminderTime ("HH:MM") against the user's timezone.
 */
export const getUsersDueForReminder = async (utcNow = new Date()) => {
  const settings = await prisma.pushSetting.findMany({
    where: { dailyVerseReminder: true },
    select: { userId: true, dailyVerseReminder: true, reminderTime: true, timezone: true, lastPushedOn: true },
  });
  if (!settings.length) return [];

  const due = [];
  for (const s of settings) {
    if (dueReminder(s, utcNow)) due.push(s.userId);
  }
  return due;
};

/** Fetch today's daily verse (published) — mirrors getTodaysVerse's core query. */
export const getTodaysVerseForPush = async (day = new Date().toISOString().slice(0, 10)) => {
  const start = new Date(`${day}T00:00:00.000Z`);
  const end = new Date(start.getTime() + 86400000);
  let dv = await prisma.dailyVerse.findFirst({
    where: { displayDate: { gte: start, lt: end }, isPublished: true },
    orderBy: { displayDate: "asc" },
  });
  if (!dv) {
    dv = await prisma.dailyVerse.findFirst({
      where: { isPublished: true, displayDate: { lt: end } },
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
