import { Router } from "express";
import { explain, generatePrompt } from "./controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { explainSchema, generatePromptSchema } from "./validation.js";

const router = Router();
router.post("/explain", validate(explainSchema), explain);
router.post("/generate-prompt", validate(generatePromptSchema), generatePrompt);
export default router;
