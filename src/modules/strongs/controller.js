import * as strongsService from './service.js';
import { formatApiResponse } from '../../utils/helpers.js';

export const getStrongsEntry = async (req, res) => {
  try {
    const { strongsId } = req.params;
    const result = await strongsService.getStrongsEntry(strongsId);
    res.json(formatApiResponse(result));
  } catch (error) {
    console.error('[StrongsController] getStrongsEntry error:', error);
    res.status(500).json({ returnCode: 500, returnMessage: 'Internal server error' });
  }
};

export const searchStrongs = async (req, res) => {
  try {
    const { q, limit, offset } = req.query;
    if (!q || q.trim().length < 1) {
      return res.status(400).json({ returnCode: 400, returnMessage: 'Search query is required' });
    }
    const result = await strongsService.searchStrongs(q, parseInt(limit) || 50, parseInt(offset) || 0);
    res.json(formatApiResponse(result));
  } catch (error) {
    console.error('[StrongsController] searchStrongs error:', error);
    res.status(500).json({ returnCode: 500, returnMessage: 'Internal server error' });
  }
};

export const getRelatedWords = async (req, res) => {
  try {
    const { strongsId } = req.params;
    const result = await strongsService.getRelatedWords(strongsId);
    res.json(formatApiResponse(result));
  } catch (error) {
    console.error('[StrongsController] getRelatedWords error:', error);
    res.status(500).json({ returnCode: 500, returnMessage: 'Internal server error' });
  }
};

export const getVersesByStrongs = async (req, res) => {
  try {
    const { strongsId } = req.params;
    const { translation, limit } = req.query;
    const result = await strongsService.getVersesByStrongs(strongsId, translation || 'Berean', limit ? parseInt(limit) : 50);
    res.json(formatApiResponse(result));
  } catch (error) {
    console.error('[StrongsController] getVersesByStrongs error:', error);
    res.status(500).json({ returnCode: 500, returnMessage: 'Internal server error' });
  }
};

export const getVerseWords = async (req, res) => {
  try {
    const { bookName, chapter, verseNumber, translation } = req.body;
    const result = await strongsService.getVerseWords(bookName, chapter, verseNumber, translation || 'Berean');
    res.json(formatApiResponse(result));
  } catch (error) {
    console.error('[StrongsController] getVerseWords error:', error);
    res.status(500).json({ returnCode: 500, returnMessage: 'Internal server error' });
  }
};

export const searchTopics = async (req, res) => {
  try {
    const { q, limit } = req.query;
    if (!q || q.trim().length < 1) {
      return res.status(400).json({ returnCode: 400, returnMessage: 'Search query is required' });
    }
    const result = await strongsService.searchTopics(q, parseInt(limit) || 50);
    res.json(formatApiResponse(result));
  } catch (error) {
    console.error('[StrongsController] searchTopics error:', error);
    res.status(500).json({ returnCode: 500, returnMessage: 'Internal server error' });
  }
};

export const getTopicVerses = async (req, res) => {
  try {
    const { topicName } = req.params;
    const { limit } = req.query;
    const result = await strongsService.getTopicVerses(topicName, parseInt(limit) || 50);
    res.json(formatApiResponse(result));
  } catch (error) {
    console.error('[StrongsController] getTopicVerses error:', error);
    res.status(500).json({ returnCode: 500, returnMessage: 'Internal server error' });
  }
};
