import express from "express";
import * as journalController from "./controller.js";
import { authenticate, requireAdmin } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/create", authenticate, journalController.createJournalEntry);
router.post("/update", authenticate, journalController.updateJournalEntry);
router.post("/delete", authenticate, journalController.deleteJournalEntry);
router.post("/get", authenticate, journalController.getJournalEntry);
router.post("/get-all", authenticate, journalController.getAllJournalEntries);
router.post("/get-by-verse", authenticate, journalController.getJournalEntriesByVerse);
router.post("/toggle-favorite", authenticate, journalController.toggleFavorite);
router.post("/stats", authenticate, journalController.getJournalStats);

router.post("/prompts/create", authenticate, requireAdmin, journalController.createJournalPrompt);
router.post("/prompts/update", authenticate, requireAdmin, journalController.updateJournalPrompt);
router.post("/prompts/get-all", journalController.getJournalPrompts);
router.post("/prompts/delete", authenticate, requireAdmin, journalController.deleteJournalPrompt);

router.post("/templates/create", authenticate, requireAdmin, journalController.createJournalTemplate);
router.post("/templates/get-all", journalController.getJournalTemplates);
router.post("/templates/delete", authenticate, requireAdmin, journalController.deleteJournalTemplate);

router.post("/admin/get-all", authenticate, requireAdmin, journalController.getUserJournalEntriesForAdmin);

export default router;