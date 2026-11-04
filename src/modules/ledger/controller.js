import * as ledgerService from "./service.js";
import { LEDGER_EXPORT_FORMATS } from "./constants.js";

const requireUser = (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ returnCode: 401, returnMessage: "Unauthorized" });
    return null;
  }
  return userId;
};

const fail = (res, error, label) => {
  console.error(`${label} error:`, error);
  return res
    .status(500)
    .json({ returnCode: 500, returnMessage: "Internal server error" });
};

export const listEntries = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const result = await ledgerService.listEntries(req.body, userId);
    return res.status(result.returnCode || 200).json(result);
  } catch (error) {
    return fail(res, error, "List ledger entries");
  }
};

export const discoverEntries = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const result = await ledgerService.discoverEntries(req.body, userId);
    return res.status(result.returnCode || 200).json(result);
  } catch (error) {
    return fail(res, error, "Discover ledger entries");
  }
};

export const searchByStrongs = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const result = await ledgerService.searchByStrongs(req.body, userId);
    return res.status(result.returnCode || 200).json(result);
  } catch (error) {
    return fail(res, error, "Search ledger by Strong's");
  }
};

export const getStats = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const result = await ledgerService.getStats(userId, req.body?.lang);
    return res.status(result.returnCode || 200).json(result);
  } catch (error) {
    return fail(res, error, "Get ledger stats");
  }
};

export const listTags = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const result = await ledgerService.listTags(userId);
    return res.status(result.returnCode || 200).json(result);
  } catch (error) {
    return fail(res, error, "List ledger tags");
  }
};

export const listBooks = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const result = await ledgerService.listBooks(userId);
    return res.status(result.returnCode || 200).json(result);
  } catch (error) {
    return fail(res, error, "List ledger books");
  }
};

export const exportAllEntries = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const format = LEDGER_EXPORT_FORMATS.includes(req.body?.format)
      ? req.body.format
      : "txt";
    const result = await ledgerService.exportAll(
      userId,
      format,
      req.body?.ids,
      req.body?.lang,
    );
    return res.status(result.returnCode || 200).json(result);
  } catch (error) {
    return fail(res, error, "Export ledger entries");
  }
};

export const exportOneEntry = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const { id, lang } = req.body;
    const format = LEDGER_EXPORT_FORMATS.includes(req.body?.format)
      ? req.body.format
      : "txt";
    const result = await ledgerService.exportOne(id, userId, format, lang);
    return res.status(result.returnCode || 200).json(result);
  } catch (error) {
    return fail(res, error, "Export ledger entry");
  }
};
