import express from 'express';
import * as strongsController from './controller.js';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware.js';
import { requireTier } from '../../middlewares/gating.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  searchStrongsSchema,
  getStrongsEntrySchema,
  getRelatedWordsSchema,
  getVersesByStrongsSchema,
  getBookWordsSchema,
  getVerseWordsSchema,
  getVerseUniqueWordsSchema,
  searchTopicsSchema,
  getTopicVersesSchema,
  adminUpdateEntrySchema,
  adminUpsertVerseWordStudySchema,
  adminDeleteVerseWordStudySchema,
  adminSyncVerseReferencesSchema,
} from './validation.js';

const router = express.Router();

const authAndTier = [authenticate, requireTier('legacy_sower')];

router.get('/search', ...authAndTier, validate(searchStrongsSchema, 'query'), strongsController.searchStrongs);
router.get('/search-related/:strongsId', ...authAndTier, validate(getRelatedWordsSchema, 'query'), strongsController.getRelatedWords);
router.get('/topics/search', ...authAndTier, validate(searchTopicsSchema, 'query'), strongsController.searchTopics);
router.get('/topics/:topicName/verses', ...authAndTier, validate(getTopicVersesSchema, 'query'), strongsController.getTopicVerses);
router.get('/book-words/:bookName', validate(getBookWordsSchema, 'query'), strongsController.getBookWords);
router.get('/:strongsId', validate(getStrongsEntrySchema, 'query'), strongsController.getStrongsEntry);
router.get('/:strongsId/verses', validate(getVersesByStrongsSchema, 'query'), strongsController.getVersesByStrongs);
router.post('/verse-words', validate(getVerseWordsSchema, 'body'), strongsController.getVerseWords);
router.post('/verse-unique-words', authenticate, validate(getVerseUniqueWordsSchema, 'body'), strongsController.getVerseUniqueWords);

// Admin routes
router.post('/admin/update-entry', authenticate, requireAdmin, validate(adminUpdateEntrySchema, 'body'), strongsController.adminUpdateEntry);
router.post('/admin/list-entries', authenticate, requireAdmin, strongsController.adminListEntries);
router.post('/admin/get-verse-words', authenticate, requireAdmin, strongsController.adminGetVerseWords);
router.post('/admin/get-verse-unique-words', authenticate, requireAdmin, strongsController.adminGetVerseUniqueWords);
router.post('/admin/upsert-verse-word-study', authenticate, requireAdmin, validate(adminUpsertVerseWordStudySchema, 'body'), strongsController.adminUpsertVerseWordStudy);
router.post('/admin/list-verse-word-studies', authenticate, requireAdmin, strongsController.adminListVerseWordStudies);
router.post('/admin/list-all-verse-word-studies', authenticate, requireAdmin, strongsController.adminListAllVerseWordStudies);
router.post('/admin/delete-verse-word-study', authenticate, requireAdmin, validate(adminDeleteVerseWordStudySchema, 'body'), strongsController.adminDeleteVerseWordStudy);
router.post('/admin/sync-verse-references', authenticate, requireAdmin, validate(adminSyncVerseReferencesSchema, 'body'), strongsController.adminSyncVerseReferences);
router.post('/admin/sync-all-verse-references', authenticate, requireAdmin, strongsController.adminSyncAllVerseReferences);

export default router;
