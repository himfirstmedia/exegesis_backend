import express from 'express';
import * as exegesisController from './controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// Session management
router.post('/start', authenticate, exegesisController.startSession);
router.post('/current', authenticate, exegesisController.getCurrentSession);
router.post('/history', authenticate, exegesisController.getSessionHistory);

// Session retrieval (resume)
router.post('/:id', authenticate, exegesisController.getSession);

// Save progress without advancing stage
router.post('/:id/progress', authenticate, exegesisController.saveProgress);

// Stage progress
router.post('/:id/look', authenticate, exegesisController.saveLookStage);
router.post('/:id/listen', authenticate, exegesisController.saveListenStage);
router.post('/:id/learn', authenticate, exegesisController.saveLearnStage);
router.post('/:id/abide', authenticate, exegesisController.saveAbideStage);
router.post('/:id/abandon', authenticate, exegesisController.abandonSession);

export default router;
