import { Router } from "express";
import { explain } from "./controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { explainSchema } from "./validation.js";

const router = Router();
router.post("/explain", validate(explainSchema), explain);
export default router;
