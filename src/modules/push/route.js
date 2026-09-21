/**
 * route.js — Push notifications
 * ─────────────────────────────────────────────────────────────────────────────
 * All routes authenticated: tokens are always tied to a logged-in user.
 */

import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import {
  registerPushToken,
  unregisterPushToken,
  getPushSettings,
  updatePushSettings,
  sendTestPush,
} from "./controller.js";

const router = Router();

router.post("/register-token", authenticate, registerPushToken);
router.post("/unregister-token", authenticate, unregisterPushToken);
router.post("/get-settings", authenticate, getPushSettings);
router.post("/update-settings", authenticate, updatePushSettings);
router.post("/test", authenticate, sendTestPush);

export default router;
