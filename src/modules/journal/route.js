import express from "express";
import * as journalController from "./controller.js";
import { authenticate, requireAdmin } from "../../middlewares/auth.middleware.js";
import { requireTier } from "../../middlewares/gating.middleware.js";

const router = express.Router();

const authAndTier = [authenticate, requireTier('legacy_sower')];

// The Ledger and Journal use the same entry store and ownership checks.
router.post("/create", authenticate, journalController.createJournalEntry);
router.post("/update", authenticate, journalController.updateJournalEntry);
router.post("/delete", authenticate, journalController.deleteJournalEntry);
router.post("/get", authenticate, journalController.getJournalEntry);
router.post("/get-all", ...authAndTier, journalController.getAllJournalEntries);
router.post("/get-by-verse", ...authAndTier, journalController.getJournalEntriesByVerse);
router.post("/toggle-favorite", authenticate, journalController.toggleFavorite);
router.post("/stats", ...authAndTier, journalController.getJournalStats);

router.post("/export-all", ...authAndTier, journalController.exportAllEntries);
router.post("/export-one", ...authAndTier, journalController.exportOneEntry);
router.post("/get-public", ...authAndTier, journalController.getPublicEntries);
router.post("/toggle-like", authenticate, journalController.toggleJournalLike);
router.post("/search-by-strongs", ...authAndTier, journalController.searchEntriesByStrongs);

router.post("/prompts/create", authenticate, requireAdmin, journalController.createJournalPrompt);
router.post("/prompts/update", authenticate, requireAdmin, journalController.updateJournalPrompt);
router.post("/prompts/get-all", journalController.getJournalPrompts);
router.post("/prompts/delete", authenticate, requireAdmin, journalController.deleteJournalPrompt);

router.post("/templates/create", authenticate, requireAdmin, journalController.createJournalTemplate);
router.post("/templates/get-all", journalController.getJournalTemplates);
router.post("/templates/delete", authenticate, requireAdmin, journalController.deleteJournalTemplate);

router.post("/admin/get-all", authenticate, requireAdmin, journalController.getUserJournalEntriesForAdmin);
router.post("/admin/get", authenticate, requireAdmin, journalController.getJournalEntryForAdmin);
router.post("/admin/set-publication", authenticate, requireAdmin, journalController.setJournalEntryPublicationForAdmin);
router.post("/admin/delete", authenticate, requireAdmin, journalController.deleteJournalEntryForAdmin);

export default router;
