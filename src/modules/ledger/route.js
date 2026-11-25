import express from "express";
import * as ledgerController from "./controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticate);

// Archive/read model over journal_entries.
router.post("/list", ledgerController.listEntries);
router.post("/get-all", ledgerController.listEntries);
router.post("/discover", ledgerController.discoverEntries);
router.post("/get-public", ledgerController.discoverEntries);
router.post("/search-by-strongs", ledgerController.searchByStrongs);
router.post("/stats", ledgerController.getStats);
router.post("/tags", ledgerController.listTags);
router.post("/books", ledgerController.listBooks);

// Export selection: all entries or the ids chosen in the ledger.
router.post("/export-all", ledgerController.exportAllEntries);
router.post("/export-one", ledgerController.exportOneEntry);

export default router;
