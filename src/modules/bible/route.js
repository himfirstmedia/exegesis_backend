import express from "express";
import * as bibleController from "./controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { translateText } from "../../utils/translator.js";

const router = express.Router();

// Localize every Bible API message at the response boundary. Data translation
// remains field-specific in the service so references and user notes are safe.
router.use((req, res, next) => {
  const sendJson = res.json.bind(res);
  res.json = async (body) => {
    const lang = req.body?.lang || "en";
    if (
      lang.toLowerCase() !== "en" &&
      typeof body?.returnMessage === "string"
    ) {
      body = {
        ...body,
        returnMessage: await translateText(body.returnMessage, lang),
      };
    }
    return sendJson(body);
  };
  next();
});

router.post("/add-highlight", authenticate, bibleController.addHighlight);
router.post("/get-highlights", authenticate, bibleController.getHighlights);
router.post("/delete-highlight", authenticate, bibleController.deleteHighlight);
router.post("/add-read-history", authenticate, bibleController.addReadHistory);
router.post("/get-read-history", authenticate, bibleController.getReadHistory);
router.post(
  "/delete-read-history",
  authenticate,
  bibleController.deleteReadHistory,
);
router.post("/add-favorite", authenticate, bibleController.addFavorite);
router.post("/get-favorites", authenticate, bibleController.getFavorites);
router.post("/delete-favorite", authenticate, bibleController.deleteFavorite);
router.post("/get-verse-explanation", bibleController.getVerseExplanation);
router.post(
  "/add-verse-explanation",
  authenticate,
  bibleController.addVerseExplanation,
);
router.post(
  "/get-all-verses-explanation",
  bibleController.getAllVersesExplanation,
);
router.post(
  "/delete-verse-explanation",
  authenticate,
  bibleController.deleteVerseExplanation,
);
router.post("/add-verse-note", authenticate, bibleController.addVerseNote);
router.post("/get-verse-note", authenticate, bibleController.getVerseNote);
router.post(
  "/delete-verse-note",
  authenticate,
  bibleController.deleteVerseNote,
);
router.post("/get-verse-by-date", bibleController.getVerseByDate);
router.post("/get-todays-verse", bibleController.getTodaysVerse);
router.post("/get-todays-devotion", bibleController.getTodaysDevotion);
router.post("/get-todays-exegesis", bibleController.getTodaysExegesis);
router.post("/get-daily-verse-by-ref", bibleController.getDailyVerseByRef);
router.post("/get-devotion-by-date", bibleController.getDevotionByDate); // Added for fetching devotion by specific date
router.post("/get-exegesis-by-date", bibleController.getExegesisByDate);
router.post("/get-all-daily-devotions", bibleController.getAllDailyDevotions);
router.post("/get-all-daily-exegesis", bibleController.getAllDailyExegesis);
router.post("/journal-prompts", bibleController.getChapterJournalPrompts);
router.post("/get-home-stats", authenticate, bibleController.getHomeStats);
router.post(
  "/get-recent-activity",
  authenticate,
  bibleController.getRecentActivity,
);
export default router;
