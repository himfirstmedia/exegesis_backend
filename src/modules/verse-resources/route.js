import express from 'express';
import * as verseResourceController from './controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireTier } from '../../middlewares/gating.middleware.js';

const router = express.Router();

const authAndTier = [authenticate, requireTier('legacy_sower')];

// Public endpoints
router.post('/compare-translations', verseResourceController.compareTranslations);

router.post('/get', verseResourceController.getVerseResources);
// Lightweight: section entry counts only, used by the reader's verse menu.
router.post('/section-counts', verseResourceController.getVerseResourceCounts);
router.post('/get-multiple', verseResourceController.getMultipleVerseResources);

// Authenticated endpoints (content management)
router.post('/upsert', ...authAndTier, verseResourceController.upsertVerseResource);
router.post('/delete', ...authAndTier, verseResourceController.deleteVerseResource);

export default router;
