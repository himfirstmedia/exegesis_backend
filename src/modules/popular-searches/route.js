/**
 * route.js — Popular Searches
 * ─────────────────────────────────────────────────────────────────────────────
 * Routes for logging search queries and retrieving popular search suggestions.
 */

import { Router } from "express";
import { logSearch, getPopularSearches } from "./controller.js";

const router = Router();

router.post("/log", logSearch);
router.get("/", getPopularSearches);

export default router;
