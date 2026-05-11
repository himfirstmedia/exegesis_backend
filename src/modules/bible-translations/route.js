import express from "express";
import {
  listTranslations,
  getTranslation,
  listBooks,
  listChapters,
  listVerses,
  getVerseByRef,
  search,
  getChapterRangeVerses,
  getReading,
  getBookNames,
} from "./controller.js";

const router = express.Router();

router.get("/books/names", getBookNames);
router.post("/", listTranslations);
router.post("/:translationId", getTranslation);
router.post("/:translationId/books", listBooks);
router.post("/:translationId/chapters", listChapters);
router.post("/:translationId/verses", listVerses);
router.post("/:translationId/verse", getVerseByRef);
router.post("/:translationId/search", search);
router.post("/:translationId/chapter-range", getChapterRangeVerses);
router.post("/:translationId/reading", getReading);

export default router;