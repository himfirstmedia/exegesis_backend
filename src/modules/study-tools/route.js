import express from 'express';
import * as studyToolsController from './controller.js';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware.js';

const router = express.Router();

// Public endpoint
router.post('/chapter-study-tools', studyToolsController.getChapterTools);

// Admin endpoints
router.post('/admin/chapter-study-tools/upsert', authenticate, requireAdmin, studyToolsController.upsertChapterTools);
router.post('/admin/chapter-study-tools/get-all', authenticate, requireAdmin, studyToolsController.getAllTools);
router.post('/admin/chapter-study-tools/delete', authenticate, requireAdmin, studyToolsController.deleteTool);

// Single tool CRUD
router.get('/admin/chapter-study-tools/:id', authenticate, requireAdmin, studyToolsController.getSingleTool);
router.post('/admin/chapter-study-tools/create', authenticate, requireAdmin, studyToolsController.createSingleTool);
router.post('/admin/chapter-study-tools/update', authenticate, requireAdmin, studyToolsController.updateSingleTool);

export default router;
