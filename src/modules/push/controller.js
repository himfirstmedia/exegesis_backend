/**
 * controller.js — Push notification endpoints
 * ─────────────────────────────────────────────────────────────────────────────
 * All endpoints require authentication (JWT) except none — tokens are
 * always tied to a logged-in user.
 *
 *   POST /push/register-token     { token, platform }   — upsert FCM token
 *   POST /push/unregister-token   { token }             — remove FCM token
 *   POST /push/get-settings       {}                    — per-user push prefs
 *   POST /push/update-settings    { dailyVerseReminder, reminderTime, timezone }
 *   POST /push/test               {}                    — send a test push
 */

import {
  registerToken,
  unregisterToken,
  getSettings,
  updateSettings,
  sendToUsers,
  ok,
} from "./service.js";
import { formatApiResponse as format } from "../../utils/helpers.js";

export const registerPushToken = async (req, res) => {
  try {
    const { token, platform = "web" } = req.body || {};
    if (!token || typeof token !== "string" || token.length < 16) {
      return res.status(400).json(
        format({ status: 400, message: "A valid push token is required" }),
      );
    }
    await registerToken(req.user.id, token, platform);
    return ok(res, "Push token registered");
  } catch (error) {
    console.error("[push] register-token error:", error.message);
    return res.status(500).json(format({ status: 500, message: "Failed to register push token" }));
  }
};

export const unregisterPushToken = async (req, res) => {
  try {
    const { token } = req.body || {};
    if (!token) {
      return res.status(400).json(format({ status: 400, message: "Token is required" }));
    }
    await unregisterToken(token);
    return ok(res, "Push token removed");
  } catch (error) {
    console.error("[push] unregister-token error:", error.message);
    return res.status(500).json(format({ status: 500, message: "Failed to remove push token" }));
  }
};

export const getPushSettings = async (req, res) => {
  try {
    const settings = await getSettings(req.user.id);
    return ok(res, "Push settings fetched", settings);
  } catch (error) {
    console.error("[push] get-settings error:", error.message);
    return res.status(500).json(format({ status: 500, message: "Failed to fetch push settings" }));
  }
};

export const updatePushSettings = async (req, res) => {
  try {
    const settings = await updateSettings(req.user.id, req.body || {});
    return ok(res, "Push settings updated", settings);
  } catch (error) {
    console.error("[push] update-settings error:", error.message);
    return res.status(500).json(format({ status: 500, message: "Failed to update push settings" }));
  }
};

export const sendTestPush = async (req, res) => {
  try {
    const result = await sendToUsers([req.user.id], {
      title: "Exegesis",
      body: "Test push notification — if you can read this, web push works! 🎉",
      data: { kind: "test", link: "/" },
    });
    if (result.disabled) {
      return ok(res, "Push is not configured on the server (missing Firebase credentials)", {
        sent: 0,
        disabled: true,
      });
    }
    return ok(res, `Test push sent to ${result.sent} device(s)`, result);
  } catch (error) {
    console.error("[push] test error:", error.message);
    return res.status(500).json(format({ status: 500, message: "Failed to send test push" }));
  }
};
