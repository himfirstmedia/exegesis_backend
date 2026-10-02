import express from "express";
import * as landingController from "./controller.js";

const router = express.Router();

// Public marketing endpoints — no authentication, no tier gating. Every route
// is served from Redis when available and falls back to Postgres otherwise.
// Path naming follows the rest of the API (reading-plans/get-all, etc).
router.post("/get-landing", landingController.getLanding);
router.post("/get-daily-verse", landingController.getDailyVerse);
router.post("/get-reading-plans", landingController.getFeaturedReadingPlans);
router.post("/get-tiers", landingController.getPlanTiers);
router.post("/get-stats", landingController.getStats);

export default router;
