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

export const getBookWords = async (req, res) => {
  try {
    const { bookName } = req.params;
    const { limit, offset } = req.query;
    if (!bookName) {
      return res.status(400).json({ returnCode: 400, returnMessage: 'bookName is required' });
    }
    const result = await strongsService.getBookWords(bookName, parseInt(limit) || 200, parseInt(offset) || 0);
    res.json(formatApiResponse(result));
  } catch (error) {
    console.error('[StrongsController] getBookWords error:', error);
    res.status(500).json({ returnCode: 500, returnMessage: 'Internal server error' });
  }
};

export const getVerseUniqueWords = async (req, res) => {
  try {
    const { bookName, chapter, verse, translation, page, pageSize } = req.body;
    if (!bookName) {
      return res.status(400).json({ returnCode: 400, returnMessage: 'bookName is required' });
    }
    const result = await strongsService.getVerseUniqueWords(bookName, chapter || null, verse || null, translation || 'BSB', page || 0, pageSize || 50);
    res.json(formatApiResponse(result));
  } catch (error) {
    console.error('[StrongsController] getVerseUniqueWords error:', error);
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

export const adminUpdateEntry = async (req, res) => {
  try {
    const { strongsId, adminExplanation, originalWord, transliteration, shortDefinition, fullDefinition, partOfSpeech, language } = req.body;
    if (!strongsId) {
      return res.status(400).json({ returnCode: 400, returnMessage: 'strongsId is required' });
    }
    const result = await strongsService.adminUpdateEntry(strongsId, {
      adminExplanation,
      originalWord,
      transliteration,
      shortDefinition,
      fullDefinition,
      partOfSpeech,
      language,
    });
    res.json(formatApiResponse(result));
  } catch (error) {
    console.error('[StrongsController] adminUpdateEntry error:', error);
    res.status(500).json({ returnCode: 500, returnMessage: 'Internal server error' });
  }
};

export const adminGetVerseUniqueWords = async (req, res) => {
  try {
    const { bookName, chapter, verse, translation, page, pageSize } = req.body;
    if (!bookName) {
      return res.status(400).json({ returnCode: 400, returnMessage: 'bookName is required' });
    }
    const result = await strongsService.getVerseUniqueWords(bookName, chapter || null, verse || null, translation || 'BSB', page || 0, pageSize || 50);
    res.json(formatApiResponse(result));
  } catch (error) {
    console.error('[StrongsController] adminGetVerseUniqueWords error:', error);
    res.status(500).json({ returnCode: 500, returnMessage: 'Internal server error' });
  }
};

export const adminUpsertVerseWordStudy = async (req, res) => {
  try {
    const { strongsId, bookName, chapter, verse, translation, surfaceText, adminExplanation } = req.body;
    if (!strongsId || !bookName || !chapter || !verse) {
      return res.status(400).json({ returnCode: 400, returnMessage: 'strongsId, bookName, chapter, and verse are required' });
    }
    const result = await strongsService.upsertVerseWordStudy({
      strongsId,
      bookName,
      chapter,
      verse,
      translation,
      surfaceText,
      adminExplanation,
      createdBy: req.user?.id || req.user?.userId,
    });
    res.json(formatApiResponse(result));
  } catch (error) {
    console.error('[StrongsController] adminUpsertVerseWordStudy error:', error);
    res.status(500).json({ returnCode: 500, returnMessage: 'Internal server error' });
  }
};

export const adminListVerseWordStudies = async (req, res) => {
  try {
    const { bookName, chapter, verse, translation, page, pageSize } = req.body;
    if (!bookName) {
      return res.status(400).json({ returnCode: 400, returnMessage: 'bookName is required' });
    }
    const result = await strongsService.listVerseWordStudies({
      bookName,
      chapter: chapter || 0,
      verse: verse || 0,
      translation,
      page: page || 0,
      pageSize: pageSize || 50,
    });
    res.json(formatApiResponse(result));
  } catch (error) {
    console.error('[StrongsController] adminListVerseWordStudies error:', error);
    res.status(500).json({ returnCode: 500, returnMessage: 'Internal server error' });
  }
};

export const adminListAllVerseWordStudies = async (req, res) => {
  try {
    const { page, pageSize, search, bookName } = req.body;
    const result = await strongsService.adminListAllVerseWordStudies({
      page: page || 0,
      pageSize: pageSize || 50,
      search,
      bookName,
    });
    res.json(formatApiResponse(result));
  } catch (error) {
    console.error('[StrongsController] adminListAllVerseWordStudies error:', error);
    res.status(500).json({ returnCode: 500, returnMessage: 'Internal server error' });
  }
};

export const adminDeleteVerseWordStudy = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ returnCode: 400, returnMessage: 'id is required' });
    }
    const result = await strongsService.deleteVerseWordStudy(Number(id));
    res.json(formatApiResponse(result));
  } catch (error) {
    console.error('[StrongsController] adminDeleteVerseWordStudy error:', error);
    res.status(500).json({ returnCode: 500, returnMessage: 'Internal server error' });
  }
};

export const adminSyncVerseReferences = async (req, res) => {
  try {
    const { strongsId } = req.body;
    if (!strongsId) {
      return res.status(400).json({ returnCode: 400, returnMessage: 'strongsId is required' });
    }
    const result = await strongsService.syncVerseReferences(strongsId);
    res.json(formatApiResponse({
      status: 200,
      message: `Synced ${result.count} verse references for ${strongsId}`,
      data: result,
    }));
  } catch (error) {
    console.error('[StrongsController] adminSyncVerseReferences error:', error);
    res.status(500).json({ returnCode: 500, returnMessage: 'Internal server error' });
  }
};

export const adminSyncAllVerseReferences = async (req, res) => {
  try {
    const result = await strongsService.syncAllVerseReferences();
    res.json(formatApiResponse({
      status: 200,
      message: `Synced ${result.syncedCount} entries with ${result.totalReferences} total verse references`,
      data: result,
    }));
  } catch (error) {
    console.error('[StrongsController] adminSyncAllVerseReferences error:', error);
    res.status(500).json({ returnCode: 500, returnMessage: 'Internal server error' });
  }
};

export const adminListEntries = async (req, res) => {
  try {
    const { page, pageSize, search, language, hasAdminExplanation } = req.body;
    const result = await strongsService.adminListEntries({
      page: page || 0,
      pageSize: pageSize || 50,
      search,
      language,
      hasAdminExplanation,
    });
    res.json(formatApiResponse(result));
  } catch (error) {
    console.error('[StrongsController] adminListEntries error:', error);
    res.status(500).json({ returnCode: 500, returnMessage: 'Internal server error' });
  }
};

export const adminGetVerseWords = async (req, res) => {
  try {
    const { bookName, chapter, verse, translation } = req.body;
    if (!bookName || !chapter) {
      return res.status(400).json({ returnCode: 400, returnMessage: 'bookName and chapter are required' });
    }
    const result = await strongsService.getVerseWords(bookName, chapter, verse || null, translation || 'Berean');
    res.json(formatApiResponse(result));
  } catch (error) {
    console.error('[StrongsController] adminGetVerseWords error:', error);
    res.status(500).json({ returnCode: 500, returnMessage: 'Internal server error' });
  }
};
