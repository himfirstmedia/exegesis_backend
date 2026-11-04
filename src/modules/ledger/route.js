import express from "express";
import * as ledgerController from "./controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireTier } from "../../middlewares/gating.middleware.js";

const router = express.Router();

const authAndTier = [authenticate, requireTier("legacy_sower")];

// Archive/read model over journal_entries.
router.post("/list", ...authAndTier, ledgerController.listEntries);
router.post("/get-all", ...authAndTier, ledgerController.listEntries);
router.post("/discover", ...authAndTier, ledgerController.discoverEntries);
router.post("/get-public", ...authAndTier, ledgerController.discoverEntries);
router.post("/search-by-strongs", ...authAndTier, ledgerController.searchByStrongs);
router.post("/stats", ...authAndTier, ledgerController.getStats);
router.post("/tags", ...authAndTier, ledgerController.listTags);
router.post("/books", ...authAndTier, ledgerController.listBooks);

// Export selection: all entries or the ids chosen in the ledger.
router.post("/export-all", ...authAndTier, ledgerController.exportAllEntries);
router.post("/export-one", ...authAndTier, ledgerController.exportOneEntry);

export default router;
