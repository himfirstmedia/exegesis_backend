import * as exegesisService from './service.js';
import { formatApiResponse } from '../../utils/helpers.js';

export const startSession = async (req, res) => {
  try {
    const result = await exegesisService.startSession(req.user.id, req.body);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error('[ExegesisController] startSession error:', error);
    return res.status(500).json(formatApiResponse({ status: 500, message: 'Error starting exegesis session: ' + error.message }));
  }
};

export const getCurrentSession = async (req, res) => {
  try {
    const result = await exegesisService.getCurrentSession(req.user.id, req.body?.lang);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error('[ExegesisController] getCurrentSession error:', error);
    return res.status(500).json(formatApiResponse({ status: 500, message: 'Error fetching current session: ' + error.message }));
  }
};

export const getSessionHistory = async (req, res) => {
  try {
    const result = await exegesisService.getSessionHistory(req.user.id, req.body);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error('[ExegesisController] getSessionHistory error:', error);
    return res.status(500).json(formatApiResponse({ status: 500, message: 'Error fetching session history: ' + error.message }));
  }
};

export const saveLookStage = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await exegesisService.saveLookStage(id, req.user.id, req.body);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error('[ExegesisController] saveLookStage error:', error);
    return res.status(500).json(formatApiResponse({ status: 500, message: 'Error saving Look stage: ' + error.message }));
  }
};

export const saveListenStage = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await exegesisService.saveListenStage(id, req.user.id, req.body);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error('[ExegesisController] saveListenStage error:', error);
    return res.status(500).json(formatApiResponse({ status: 500, message: 'Error saving Listen stage: ' + error.message }));
  }
};

export const saveLearnStage = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await exegesisService.saveLearnStage(id, req.user.id, req.body);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error('[ExegesisController] saveLearnStage error:', error);
    return res.status(500).json(formatApiResponse({ status: 500, message: 'Error saving Learn stage: ' + error.message }));
  }
};

export const saveAbideStage = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await exegesisService.saveAbideStage(id, req.user.id, req.body);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error('[ExegesisController] saveAbideStage error:', error);
    return res.status(500).json(formatApiResponse({ status: 500, message: 'Error saving Abide stage: ' + error.message }));
  }
};

export const saveProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await exegesisService.saveProgress(id, req.user.id, req.body);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error('[ExegesisController] saveProgress error:', error);
    return res.status(500).json(formatApiResponse({ status: 500, message: 'Error saving progress: ' + error.message }));
  }
};

export const getSession = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await exegesisService.getSession(id, req.user.id, req.body?.lang);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error('[ExegesisController] getSession error:', error);
    return res.status(500).json(formatApiResponse({ status: 500, message: 'Error fetching session: ' + error.message }));
  }
};

export const abandonSession = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await exegesisService.abandonSession(id, req.user.id);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error('[ExegesisController] abandonSession error:', error);
    return res.status(500).json(formatApiResponse({ status: 500, message: 'Error abandoning session: ' + error.message }));
  }
};

export const exportSessionPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await exegesisService.exportSessionPdf(id, req.user.id);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error('[ExegesisController] exportSessionPdf error:', error);
    return res.status(500).json(formatApiResponse({ status: 500, message: 'Error generating session PDF: ' + error.message }));
  }
};
