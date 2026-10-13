import express from "express";
import * as supportController from "./controller.js";
import {
  authenticate,
  requireAdmin,
} from "../../middlewares/auth.middleware.js";

const router = express.Router();

// ─── User conversations (any signed-in reader) ───────────────────────────────
router.post("/upload", authenticate, supportController.uploadAttachment);
router.post("/create", authenticate, supportController.createTicket);
router.post("/get-my-tickets", authenticate, supportController.getMyTickets);
router.post("/get-ticket", authenticate, supportController.getTicket);
router.post("/reply", authenticate, supportController.replyToTicket);

// ─── Admin inbox ─────────────────────────────────────────────────────────────
router.post(
  "/admin/get-tickets",
  authenticate,
  requireAdmin,
  supportController.getAdminTickets,
);
router.post(
  "/admin/get-ticket",
  authenticate,
  requireAdmin,
  supportController.getAdminTicket,
);
router.post(
  "/admin/reply",
  authenticate,
  requireAdmin,
  supportController.adminReply,
);
router.post(
  "/admin/update-status",
  authenticate,
  requireAdmin,
  supportController.updateTicketStatus,
);
router.post(
  "/admin/stats",
  authenticate,
  requireAdmin,
  supportController.getSupportStats,
);

// Unread summary (for bell)
router.post("/get-unread", authenticate, supportController.getUnreadSummary);
router.get("/get-unread", authenticate, supportController.getUnreadSummary);

export default router;
