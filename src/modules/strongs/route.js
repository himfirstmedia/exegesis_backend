import express from 'express';
import * as strongsController from './controller.js';

const router = express.Router();

router.get('/search', strongsController.searchStrongs);
router.get('/search-related/:strongsId', strongsController.getRelatedWords);
router.get('/topics/search', strongsController.searchTopics);
router.get('/topics/:topicName/verses', strongsController.getTopicVerses);
router.get('/:strongsId', strongsController.getStrongsEntry);
router.get('/:strongsId/verses', strongsController.getVersesByStrongs);
router.post('/verse-words', strongsController.getVerseWords);

export default router;
