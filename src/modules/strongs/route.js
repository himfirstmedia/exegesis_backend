import express from 'express';
import * as strongsController from './controller.js';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware.js';
import { requireTier } from '../../middlewares/gating.middleware.js';

const router = express.Router();

const authAndTier = [authenticate, requireTier('legacy_sower')];

router.get('/search', ...authAndTier, strongsController.searchStrongs);
router.get('/search-related/:strongsId', ...authAndTier, strongsController.getRelatedWords);
router.get('/topics/search', ...authAndTier, strongsController.searchTopics);
router.get('/topics/:topicName/verses', ...authAndTier, strongsController.getTopicVerses);
router.get('/book-words/:bookName', strongsController.getBookWords);
router.get('/:strongsId', strongsController.getStrongsEntry);
router.get('/:strongsId/verses', strongsController.getVersesByStrongs);
router.post('/verse-words', strongsController.getVerseWords);
router.post('/verse-unique-words', authenticate, strongsController.getVerseUniqueWords);

// ── Admin Strong's Dictionary Management ─────────────────────────────────────
router.post('/admin/update-entry', authenticate, requireAdmin, strongsController.adminUpdateEntry);
router.post('/admin/list-entries', authenticate, requireAdmin, strongsController.adminListEntries);
router.post('/admin/get-verse-words', authenticate, requireAdmin, strongsController.adminGetVerseWords);
router.post('/admin/get-verse-unique-words', authenticate, requireAdmin, strongsController.adminGetVerseUniqueWords);

// ── Admin Verse-Word Study Associations ─────────────────────────────────────
router.post('/admin/upsert-verse-word-study', authenticate, requireAdmin, strongsController.adminUpsertVerseWordStudy);
router.post('/admin/list-verse-word-studies', authenticate, requireAdmin, strongsController.adminListVerseWordStudies);
router.post('/admin/list-all-verse-word-studies', authenticate, requireAdmin, strongsController.adminListAllVerseWordStudies);
router.post('/admin/delete-verse-word-study', authenticate, requireAdmin, strongsController.adminDeleteVerseWordStudy);
router.post('/admin/sync-verse-references', authenticate, requireAdmin, strongsController.adminSyncVerseReferences);
router.post('/admin/sync-all-verse-references', authenticate, requireAdmin, strongsController.adminSyncAllVerseReferences);

export default router;
