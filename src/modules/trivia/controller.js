import * as triviaService from './service.js';
import { formatApiResponse } from '../../utils/helpers.js';

export const createQuestion = async (req, res) => {
  try {
    const result = await triviaService.createQuestion(req.user.id, req.body);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error('[TriviaController] createQuestion error:', error);
    return res.status(500).json(formatApiResponse({ status: 500, message: 'Error creating question: ' + error.message }));
  }
};

export const updateQuestion = async (req, res) => {
  try {
    const result = await triviaService.updateQuestion(req.user.id, req.body);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error('[TriviaController] updateQuestion error:', error);
    return res.status(500).json(formatApiResponse({ status: 500, message: 'Error updating question: ' + error.message }));
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    const result = await triviaService.deleteQuestion(req.body.id);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error('[TriviaController] deleteQuestion error:', error);
    return res.status(500).json(formatApiResponse({ status: 500, message: 'Error deleting question: ' + error.message }));
  }
};

export const getQuestion = async (req, res) => {
  try {
    const result = await triviaService.getQuestion(req.body.id);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error('[TriviaController] getQuestion error:', error);
    return res.status(500).json(formatApiResponse({ status: 500, message: 'Error fetching question: ' + error.message }));
  }
};

export const getAllQuestions = async (req, res) => {
  try {
    const result = await triviaService.getAllQuestions(req.body);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error('[TriviaController] getAllQuestions error:', error);
    return res.status(500).json(formatApiResponse({ status: 500, message: 'Error fetching questions: ' + error.message }));
  }
};

export const getRandomQuestion = async (req, res) => {
  try {
    const result = await triviaService.getRandomQuestion(req.user?.id, req.body);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error('[TriviaController] getRandomQuestion error:', error);
    return res.status(500).json(formatApiResponse({ status: 500, message: 'Error fetching random question: ' + error.message }));
  }
};

export const submitAnswer = async (req, res) => {
  try {
    const result = await triviaService.submitAnswer(req.user.id, req.body);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error('[TriviaController] submitAnswer error:', error);
    return res.status(500).json(formatApiResponse({ status: 500, message: 'Error submitting answer: ' + error.message }));
  }
};

export const getUserStats = async (req, res) => {
  try {
    const result = await triviaService.getUserStats(req.user.id);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error('[TriviaController] getUserStats error:', error);
    return res.status(500).json(formatApiResponse({ status: 500, message: 'Error fetching stats: ' + error.message }));
  }
};
