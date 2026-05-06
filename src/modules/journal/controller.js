import * as journalService from "./service.js";

export const createJournalEntry = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ returnCode: 401, returnMessage: "Unauthorized" });
    }
    const result = await journalService.createJournalEntry(req.body, userId);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Create journal entry error:", error);
    return res.status(500).json({ returnCode: 500, returnMessage: "Internal server error" });
  }
};

export const updateJournalEntry = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ returnCode: 401, returnMessage: "Unauthorized" });
    }
    const result = await journalService.updateJournalEntry(req.body, userId);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Update journal entry error:", error);
    return res.status(500).json({ returnCode: 500, returnMessage: "Internal server error" });
  }
};

export const deleteJournalEntry = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ returnCode: 401, returnMessage: "Unauthorized" });
    }
    const result = await journalService.deleteJournalEntry(req.body, userId);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Delete journal entry error:", error);
    return res.status(500).json({ returnCode: 500, returnMessage: "Internal server error" });
  }
};

export const getJournalEntry = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ returnCode: 401, returnMessage: "Unauthorized" });
    }
    const result = await journalService.getJournalEntry(req.body, userId);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Get journal entry error:", error);
    return res.status(500).json({ returnCode: 500, returnMessage: "Internal server error" });
  }
};

export const getAllJournalEntries = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ returnCode: 401, returnMessage: "Unauthorized" });
    }
    const result = await journalService.getAllJournalEntries(req.body, userId);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Get all journal entries error:", error);
    return res.status(500).json({ returnCode: 500, returnMessage: "Internal server error" });
  }
};

export const getJournalEntriesByVerse = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ returnCode: 401, returnMessage: "Unauthorized" });
    }
    const result = await journalService.getJournalEntriesByVerse(req.body, userId);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Get journal entries by verse error:", error);
    return res.status(500).json({ returnCode: 500, returnMessage: "Internal server error" });
  }
};

export const toggleFavorite = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ returnCode: 401, returnMessage: "Unauthorized" });
    }
    const result = await journalService.toggleFavorite(req.body, userId);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Toggle favorite error:", error);
    return res.status(500).json({ returnCode: 500, returnMessage: "Internal server error" });
  }
};

export const getJournalStats = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ returnCode: 401, returnMessage: "Unauthorized" });
    }
    const result = await journalService.getJournalStats(userId);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Get journal stats error:", error);
    return res.status(500).json({ returnCode: 500, returnMessage: "Internal server error" });
  }
};

export const createJournalPrompt = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ returnCode: 401, returnMessage: "Unauthorized" });
    }
    const result = await journalService.createJournalPrompt(req.body, userId);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Create journal prompt error:", error);
    return res.status(500).json({ returnCode: 500, returnMessage: "Internal server error" });
  }
};

export const getJournalPrompts = async (req, res) => {
  try {
    const result = await journalService.getJournalPrompts(req.body);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Get journal prompts error:", error);
    return res.status(500).json({ returnCode: 500, returnMessage: "Internal server error" });
  }
};

export const updateJournalPrompt = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ returnCode: 401, returnMessage: "Unauthorized" });
    }
    const result = await journalService.updateJournalPrompt(req.body, userId);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Update journal prompt error:", error);
    return res.status(500).json({ returnCode: 500, returnMessage: "Internal server error" });
  }
};

export const deleteJournalPrompt = async (req, res) => {
  try {
    const result = await journalService.deleteJournalPrompt(req.body);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Delete journal prompt error:", error);
    return res.status(500).json({ returnCode: 500, returnMessage: "Internal server error" });
  }
};

export const createJournalTemplate = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ returnCode: 401, returnMessage: "Unauthorized" });
    }
    const result = await journalService.createJournalTemplate(req.body, userId);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Create journal template error:", error);
    return res.status(500).json({ returnCode: 500, returnMessage: "Internal server error" });
  }
};

export const getJournalTemplates = async (req, res) => {
  try {
    const result = await journalService.getJournalTemplates(req.body);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Get journal templates error:", error);
    return res.status(500).json({ returnCode: 500, returnMessage: "Internal server error" });
  }
};

export const deleteJournalTemplate = async (req, res) => {
  try {
    const result = await journalService.deleteJournalTemplate(req.body);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Delete journal template error:", error);
    return res.status(500).json({ returnCode: 500, returnMessage: "Internal server error" });
  }
};

export const getUserJournalEntriesForAdmin = async (req, res) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({ returnCode: 401, returnMessage: "Unauthorized" });
    }
    const result = await journalService.getUserJournalEntriesForAdmin(req.body, adminId);
    return res.status(result.status).json(result);
  } catch (error) {
    console.error("Get user journal entries for admin error:", error);
    return res.status(500).json({ returnCode: 500, returnMessage: "Internal server error" });
  }
};