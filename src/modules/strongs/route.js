import express from 'express';
import * as strongsController from './controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { requireTier } from '../../middlewares/gating.middleware.js';

const router = express.Router();

const authAndTier = [authenticate, requireTier('legacy_sower')];

router.get('/search', ...authAndTier, strongsController.searchStrongs);
router.get('/search-related/:strongsId', ...authAndTier, strongsController.getRelatedWords);
router.get('/topics/search', ...authAndTier, strongsController.searchTopics);
router.get('/topics/:topicName/verses', ...authAndTier, strongsController.getTopicVerses);
router.get('/:strongsId', strongsController.getStrongsEntry);
router.get('/:strongsId/verses', strongsController.getVersesByStrongs);
router.post('/verse-words', authenticate, strongsController.getVerseWords);

export default router;
