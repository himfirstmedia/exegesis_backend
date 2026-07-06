import * as bookPrologueService from './service.js';
import { formatApiResponse } from '../../utils/helpers.js';

export const getBookPrologue = async (req, res) => {
  try {
    const result = await bookPrologueService.getBookPrologue(req.body);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error('[BookPrologues] getBookPrologue error:', error);
    return res.status(500).json(formatApiResponse({ status: 500, message: 'Error fetching book prologue: ' + error.message }));
  }
};

export const getAllBookPrologues = async (req, res) => {
  try {
    const result = await bookPrologueService.getAllBookPrologues(req.body);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error('[BookPrologues] getAllBookPrologues error:', error);
    return res.status(500).json(formatApiResponse({ status: 500, message: 'Error fetching book prologues: ' + error.message }));
  }
};

export const upsertBookPrologue = async (req, res) => {
  try {
    const result = await bookPrologueService.upsertBookPrologue(req.user.id, req.body);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error('[BookPrologues] upsertBookPrologue error:', error);
    return res.status(500).json(formatApiResponse({ status: 500, message: 'Error saving book prologue: ' + error.message }));
  }
};

export const deleteBookPrologue = async (req, res) => {
  try {
    const result = await bookPrologueService.deleteBookPrologue(req.body);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error('[BookPrologues] deleteBookPrologue error:', error);
    return res.status(500).json(formatApiResponse({ status: 500, message: 'Error deleting book prologue: ' + error.message }));
  }
};
