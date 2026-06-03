import * as verseResourceService from './service.js';
import { formatApiResponse } from '../../utils/helpers.js';

export const getVerseResources = async (req, res) => {
  try {
    const result = await verseResourceService.getVerseResources(req.body);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error('getVerseResources controller error:', error);
    return res.status(500).json(formatApiResponse({ status: 500, message: 'Error: ' + error.message }));
  }
};

export const getMultipleVerseResources = async (req, res) => {
  try {
    const result = await verseResourceService.getMultipleVerseResources(req.body);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error('getMultipleVerseResources controller error:', error);
    return res.status(500).json(formatApiResponse({ status: 500, message: 'Error: ' + error.message }));
  }
};

export const upsertVerseResource = async (req, res) => {
  try {
    const result = await verseResourceService.upsertVerseResource(req.body, req.user?.id);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error('upsertVerseResource controller error:', error);
    return res.status(500).json(formatApiResponse({ status: 500, message: 'Error: ' + error.message }));
  }
};


export const compareTranslations = async (req, res) => {
  try {
    const result = await verseResourceService.compareTranslations(req.body);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error('compareTranslations controller error:', error);
    return res.status(500).json(formatApiResponse({ status: 500, message: 'Error: ' + error.message }));
  }
};

export const deleteVerseResource = async (req, res) => {
  try {
    const result = await verseResourceService.deleteVerseResource(req.body);
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error('deleteVerseResource controller error:', error);
    return res.status(500).json(formatApiResponse({ status: 500, message: 'Error: ' + error.message }));
  }
};
