import express from 'express';
import * as exegesisController from './controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// Session management
router.use(authenticate);
router.post('/start', exegesisController.startSession);
router.post('/current', exegesisController.getCurrentSession);
router.post('/history', exegesisController.getSessionHistory);
router.post('/catalog', exegesisController.getCatalog);
router.post('/setup-status', exegesisController.getLabSetupStatus);

// Session retrieval (resume)
router.post('/:id', exegesisController.getSession);

// Save progress without advancing stage
router.post('/:id/progress', exegesisController.saveProgress);

// Stage progress
router.post('/:id/look', exegesisController.saveLookStage);
router.post('/:id/listen', exegesisController.saveListenStage);
router.post('/:id/learn', exegesisController.saveLearnStage);
router.post('/:id/abide', exegesisController.saveAbideStage);
router.post('/:id/apply', exegesisController.saveApplyStage);
router.post('/:id/complete', exegesisController.completeSession);
router.post('/:id/ledger', exegesisController.saveSessionLedger);
router.post('/:id/abandon', exegesisController.abandonSession);

// PDF export
router.post('/:id/pdf', exegesisController.exportSessionPdf);

export default router;
