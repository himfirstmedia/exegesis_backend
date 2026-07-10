import express from "express";
import * as journalController from "./controller.js";
import { authenticate, requireAdmin } from "../../middlewares/auth.middleware.js";
import { requireTier } from "../../middlewares/gating.middleware.js";

const router = express.Router();

const authOnly = [authenticate];
const authAndTier = [authenticate, requireTier('legacy_sower')];

router.post("/create", ...authOnly, journalController.createJournalEntry);
router.post("/update", ...authOnly, journalController.updateJournalEntry);
router.post("/delete", ...authOnly, journalController.deleteJournalEntry);
router.post("/get", ...authOnly, journalController.getJournalEntry);
router.post("/get-all", ...authOnly, journalController.getAllJournalEntries);
router.post("/get-by-verse", ...authOnly, journalController.getJournalEntriesByVerse);
router.post("/toggle-favorite", ...authOnly, journalController.toggleFavorite);
router.post("/stats", ...authOnly, journalController.getJournalStats);

router.post("/export-all", ...authOnly, journalController.exportAllEntries);
router.post("/export-one", ...authOnly, journalController.exportOneEntry);
router.post("/get-public", ...authOnly, journalController.getPublicEntries);
router.post("/search-by-strongs", ...authOnly, journalController.searchEntriesByStrongs);

router.post("/prompts/create", authenticate, requireAdmin, journalController.createJournalPrompt);
router.post("/prompts/update", authenticate, requireAdmin, journalController.updateJournalPrompt);
router.post("/prompts/get-all", journalController.getJournalPrompts);
router.post("/prompts/delete", authenticate, requireAdmin, journalController.deleteJournalPrompt);

router.post("/templates/create", authenticate, requireAdmin, journalController.createJournalTemplate);
router.post("/templates/get-all", journalController.getJournalTemplates);
router.post("/templates/delete", authenticate, requireAdmin, journalController.deleteJournalTemplate);

router.post("/admin/get-all", authenticate, requireAdmin, journalController.getUserJournalEntriesForAdmin);
router.post("/admin/set-publication", authenticate, requireAdmin, journalController.setJournalEntryPublicationForAdmin);

export default router;
