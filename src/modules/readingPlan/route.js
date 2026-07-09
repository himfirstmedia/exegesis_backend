import express from "express";
import * as readingPlanController from "./controller.js";
import {
  authenticate,
  requireAdmin,
} from "../../middlewares/auth.middleware.js";
import { requireTier } from "../../middlewares/gating.middleware.js";

const router = express.Router();

const authAndTier = [authenticate, requireTier('legacy_sower')];

router.post(
  "/create",
  authenticate,
  requireAdmin,
  readingPlanController.create,
);
router.post(
  "/delete",
  authenticate,
  requireAdmin,
  readingPlanController.deletePlan,
);
router.post(
  "/add-assignment",
  authenticate,
  requireAdmin,
  readingPlanController.addDailyAssignment,
);
router.post(
  "/add-quiz-questions",
  authenticate,
  requireAdmin,
  readingPlanController.addQuizQuestions,
);
router.post("/get-all", ...authAndTier, readingPlanController.getAll);
router.post("/by-category", ...authAndTier, readingPlanController.getPlansByCategory);
router.post("/start", ...authAndTier, readingPlanController.start);
router.post("/my-progress", ...authAndTier, readingPlanController.myProgress);
router.post(
  "/get-user-plans",
  ...authAndTier,
  readingPlanController.getUserPlans,
);
router.post("/plan-progress", ...authAndTier, readingPlanController.planProgress);
router.post(
  "/daily-assignment",
  ...authAndTier,
  readingPlanController.dailyAssignment,
);
router.post(
  "/all-assignments",
  ...authAndTier,
  readingPlanController.allAssignments,
);
router.post("/complete-day", ...authAndTier, readingPlanController.completeDay);
router.post("/submit-answer", ...authAndTier, readingPlanController.submitAnswer);
router.post(
  "/quiz-questions",
  ...authAndTier,
  readingPlanController.quizQuestions,
);
router.post("/quiz-stats", ...authAndTier, readingPlanController.quizStats);
router.post(
  "/update",
  authenticate,
  requireAdmin,
  readingPlanController.update,
);
router.post(
  "/update-quiz-question",
  authenticate,
  requireAdmin,
  readingPlanController.updateQuizQuestion,
);
router.post(
  "/delete-quiz-question",
  authenticate,
  requireAdmin,
  readingPlanController.deleteQuizQuestion,
);
router.post(
  "/update-assignment",
  authenticate,
  requireAdmin,
  readingPlanController.updateAssignment,
);
router.post("/plan-detail", ...authAndTier, readingPlanController.planDetail);
router.post("/remove", ...authAndTier, readingPlanController.remove);
router.post(
  "/day-quiz-answers",
  ...authAndTier,
  readingPlanController.dayQuizAnswers,
);
router.post(
  "/admin-stats",
  authenticate,
  requireAdmin,
  readingPlanController.adminStats,
);

export default router;
