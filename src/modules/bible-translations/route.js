import express from "express";
import {
  listTranslations,
  getTranslation,
  listBooks,
  listBooksWithMaxChapters,
  listChapters,
  listVerses,
  listVersesBatch,
  getVerseByRef,
  search,
  searchFTS,
  searchCross,
  getChapterRangeVerses,
  getReading,
  getBookNames,
  getTranslationText,
  getTranslationSettings
} from "./controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireTier } from "../../middlewares/gating.middleware.js";

const router = express.Router();

router.post("/translate-text", getTranslationText);
router.get("/books/names", getBookNames);
router.post("/", listTranslations);

const authAndTier = [authenticate, requireTier('legacy_sower')];

// Cross-translation search — must be BEFORE the /:translationId routes
// to avoid being captured as a translationId parameter
router.post("/search-cross", ...authAndTier, searchCross);
router.post("/:translationId", getTranslation);
router.post("/:translationId/books", listBooks);
router.post("/:translationId/books-with-max", listBooksWithMaxChapters);
router.post("/:translationId/chapters", listChapters);
router.post("/:translationId/verses", listVerses);
router.post("/:translationId/verses-batch", listVersesBatch);
router.post("/:translationId/verse", getVerseByRef);
router.post("/:translationId/search", search);
router.post("/:translationId/search-fts", ...authAndTier, searchFTS);
router.post("/:translationId/chapter-range", getChapterRangeVerses);
router.post("/:translationId/reading", getReading);
router.get("/translate-text", getTranslationText);
router.get("/settings", getTranslationSettings);

export default router;