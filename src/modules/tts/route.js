import express from "express";
import * as ttsController from "./controller.js";
import { optionalAuth } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/speak", optionalAuth, ttsController.speak);
router.post("/speak-with-timings", optionalAuth, ttsController.speakWithTimings);
router.get("/voices", optionalAuth, ttsController.getVoices);
router.get("/status", ttsController.getStatus);

export default router;
