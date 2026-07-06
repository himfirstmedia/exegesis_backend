import express from 'express';
import * as bookPrologueController from './controller.js';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/get', bookPrologueController.getBookPrologue);
router.post('/admin/get-all', authenticate, requireAdmin, bookPrologueController.getAllBookPrologues);
router.post('/admin/upsert', authenticate, requireAdmin, bookPrologueController.upsertBookPrologue);
router.post('/admin/delete', authenticate, requireAdmin, bookPrologueController.deleteBookPrologue);

export default router;
