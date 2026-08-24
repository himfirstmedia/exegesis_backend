import express from "express";
import { optionalAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import * as translationController from "./controller.js";
import {
  detectSchema,
  translateBatchSchema,
  translateSchema,
} from "./validation.js";

const router = express.Router();

router.post(
  "/",
  optionalAuth,
  validate(translateSchema, "body"),
  translationController.translate,
);
router.post(
  "/batch",
  optionalAuth,
  validate(translateBatchSchema, "body"),
  translationController.translateBatch,
);
router.post(
  "/detect",
  optionalAuth,
  validate(detectSchema, "body"),
  translationController.detect,
);
router.get("/languages", optionalAuth, translationController.languages);
router.get("/status", translationController.status);

export default router;
