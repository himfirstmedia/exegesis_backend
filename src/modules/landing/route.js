import express from "express";
import * as landingController from "./controller.js";

const router = express.Router();

// Public marketing endpoints — no authentication, no tier gating. Every route
// is served from Redis when available and falls back to Postgres otherwise.
router.post("/", landingController.getLanding);
router.post("/daily-verse", landingController.getDailyVerse);
router.post("/reading-plans", landingController.getFeaturedReadingPlans);
router.post("/tiers", landingController.getPlanTiers);
router.post("/stats", landingController.getStats);

export default router;