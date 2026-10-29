import express from "express";
import { getUiPackManifest, downloadUiPack, getUiPackSource } from './ui-packs.js';
import { optionalAuth } from "../../middlewares/auth.middleware.js";
import {
  translationCharacterLimiter,
  translationLimiter,
} from "../../middlewares/rateLimiter.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import * as translationController from "./controller.js";
import {
  detectSchema,
  translateBatchSchema,
  translateSchema,
} from "./validation.js";

const router = express.Router();
router.get('/ui-packs/source', getUiPackSource);
router.get('/ui-packs/:language/manifest', getUiPackManifest);
router.get('/ui-packs/:language/file', downloadUiPack);

router.post(
  "/",
  optionalAuth,
  translationLimiter,
  validate(translateSchema, "body"),
  translationCharacterLimiter,
  translationController.translate,
);
router.post(
  "/batch",
  optionalAuth,
  translationLimiter,
  validate(translateBatchSchema, "body"),
  translationCharacterLimiter,
  translationController.translateBatch,
);
router.post(
  "/detect",
  optionalAuth,
  translationLimiter,
  validate(detectSchema, "body"),
  translationCharacterLimiter,
  translationController.detect,
);
router.get("/languages", optionalAuth, translationLimiter, translationController.languages);
router.get("/status", optionalAuth, translationLimiter, translationController.status);

export default router;
