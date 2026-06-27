import express from 'express';
import * as triviaController from './controller.js';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// User endpoints (authenticated)
router.post('/random', authenticate, triviaController.getRandomQuestion);
router.post('/submit', authenticate, triviaController.submitAnswer);
router.post('/stats', authenticate, triviaController.getUserStats);

// Admin CRUD (authenticated + admin)
router.post('/create', authenticate, requireAdmin, triviaController.createQuestion);
router.post('/update', authenticate, requireAdmin, triviaController.updateQuestion);
router.post('/delete', authenticate, requireAdmin, triviaController.deleteQuestion);
router.post('/get', authenticate, triviaController.getQuestion);
router.post('/get-all', authenticate, requireAdmin, triviaController.getAllQuestions);

export default router;
