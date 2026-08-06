import express from 'express';
import * as exegesisController from './controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireTier } from '../../middlewares/gating.middleware.js';

const router = express.Router();

const authAndTier = [authenticate, requireTier('legacy_sower')];

// Session management
router.post('/start', ...authAndTier, exegesisController.startSession);
router.post('/current', ...authAndTier, exegesisController.getCurrentSession);
router.post('/history', ...authAndTier, exegesisController.getSessionHistory);

// Session retrieval (resume)
router.post('/:id', ...authAndTier, exegesisController.getSession);

// Save progress without advancing stage
router.post('/:id/progress', ...authAndTier, exegesisController.saveProgress);

// Stage progress
router.post('/:id/look', ...authAndTier, exegesisController.saveLookStage);
router.post('/:id/listen', ...authAndTier, exegesisController.saveListenStage);
router.post('/:id/learn', ...authAndTier, exegesisController.saveLearnStage);
router.post('/:id/abide', ...authAndTier, exegesisController.saveAbideStage);
router.post('/:id/abandon', ...authAndTier, exegesisController.abandonSession);

// PDF export
router.post('/:id/pdf', ...authAndTier, exegesisController.exportSessionPdf);

export default router;
