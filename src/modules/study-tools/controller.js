import * as studyToolsService from './service.js';
import { formatApiResponse } from '../../utils/helpers.js';

export const getChapterTools = async (req, res) => {
  try {
    const result = await studyToolsService.getChapterTools(req.body);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error('[StudyToolsController] getChapterTools error:', error);
    return res.status(500).json(formatApiResponse({ status: 500, message: 'Error fetching study tools: ' + error.message }));
  }
};

export const upsertChapterTools = async (req, res) => {
  try {
    const result = await studyToolsService.upsertChapterTools(req.user.id, req.body);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error('[StudyToolsController] upsertChapterTools error:', error);
    return res.status(500).json(formatApiResponse({ status: 500, message: 'Error saving study tools: ' + error.message }));
  }
};

export const getAllTools = async (req, res) => {
  try {
    const result = await studyToolsService.getAllTools(req.body);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error('[StudyToolsController] getAllTools error:', error);
    return res.status(500).json(formatApiResponse({ status: 500, message: 'Error fetching tools: ' + error.message }));
  }
};

export const deleteTool = async (req, res) => {
  try {
    const result = await studyToolsService.deleteTool(req.body.id);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error('[StudyToolsController] deleteTool error:', error);
    return res.status(500).json(formatApiResponse({ status: 500, message: 'Error deleting tool: ' + error.message }));
  }
};
