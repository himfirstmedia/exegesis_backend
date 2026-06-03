import express from 'express';
import * as verseResourceController from './controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// Public endpoints
router.post('/compare-translations', verseResourceController.compareTranslations);

router.post('/get', verseResourceController.getVerseResources);
router.post('/get-multiple', verseResourceController.getMultipleVerseResources);

// Authenticated endpoints (admin/content management)
router.post('/upsert', authenticate, verseResourceController.upsertVerseResource);
router.post('/delete', authenticate, verseResourceController.deleteVerseResource);

export default router;
