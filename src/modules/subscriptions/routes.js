import express from "express";
import * as subscriptionController from "./controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post(
  "/create-checkout-session",
  authenticate,
  subscriptionController.createCheckoutSession,
);

router.post(
  "/create-portal-session",
  authenticate,
  subscriptionController.createPortalSession,
);

router.post(
  "/status",
  authenticate,
  subscriptionController.getSubscriptionStatus,
);

router.post(
  "/tiers",
  subscriptionController.listTiers,
);

router.post(
  "/get-subscriptions-users",
  subscriptionController.handleGetSubscribedUsers,
);

export default router;
