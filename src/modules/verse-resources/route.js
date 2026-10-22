import express from 'express';
import * as verseResourceController from './controller.js';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware.js';
import { requireTier } from '../../middlewares/gating.middleware.js';

const router = express.Router();

const authAndTier = [authenticate, requireTier('legacy_sower')];

// Content management endpoints. These write the shared Bible commentary
// shown to every reader, so they are admin-only — a paid tier alone must not
// be enough to rewrite or delete verse resources.
const authTierAndAdmin = [...authAndTier, requireAdmin];

// Public endpoints
router.post('/compare-translations', verseResourceController.compareTranslations);

router.post('/get', verseResourceController.getVerseResources);
// Lightweight: section entry counts only, used by the reader's verse menu.
router.post('/section-counts', verseResourceController.getVerseResourceCounts);
router.post('/get-multiple', verseResourceController.getMultipleVerseResources);

// Admin-only endpoints (content management)
router.post('/upsert', ...authTierAndAdmin, verseResourceController.upsertVerseResource);
router.post('/delete', ...authTierAndAdmin, verseResourceController.deleteVerseResource);

export default router;
