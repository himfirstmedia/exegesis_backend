// Ledger service — the archive/read model over journal_entries.
//
// Journal owns entry CRUD and entry authoring. Ledger owns the archive view:
// list, search, filters, stats, discovery and export selection. Both modules
// read the same `journal_entries` table; there is no separate ledger table.
import { prisma } from "../../config/db.js";
import * as journalService from "../journal/service.js";
import {
  LEDGER_MAX_PAGE_SIZE,
  LEDGER_PAGE_SIZE,
  LEDGER_SORT_OPTIONS,
  LEDGER_SORT_VALUES,
} from "./constants.js";

const toPositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export const normalizeFilters = (input = {}) => {
  const sort = LEDGER_SORT_VALUES.includes(input.sort)
    ? input.sort
    : LEDGER_SORT_OPTIONS.NEWEST;

  return {
    search: input.search,
    category: input.category && input.category !== "all" ? input.category : undefined,
    bookName: input.bookName,
    tag: input.tag,
    strongsId: input.strongsId,
    isPublished: input.isPublished,
    isFavorite: input.isFavorite,
    source: input.source,
    startDate: input.startDate,
    endDate: input.endDate,
    page: toPositiveInt(input.page, 1),
    pageSize: Math.min(
      toPositiveInt(input.pageSize, LEDGER_PAGE_SIZE),
      LEDGER_MAX_PAGE_SIZE,
    ),
    sort,
    lang: input.lang,
  };
};

export const listEntries = async (data, userId) => {
  return journalService.getAllJournalEntries(normalizeFilters(data), userId);
};

export const discoverEntries = async (data, userId) => {
  return journalService.getPublicEntries(normalizeFilters(data), userId);
};

export const searchByStrongs = async (data, userId) => {
  return journalService.searchEntriesByStrongs(normalizeFilters(data), userId);
};

export const getStats = async (userId, lang = "en") => {
  return journalService.getJournalStats(userId, lang);
};

export const exportAll = async (userId, format, ids, lang = "en") => {
  return journalService.exportAllEntries(userId, format, ids, lang);
};

export const exportOne = async (id, userId, format, lang = "en") => {
  return journalService.exportOneEntry(id, userId, format, lang);
};

// Tag suggestions for the ledger filter UI. Tags are stored as a comma
// separated string, so aggregate them in one bounded read instead of adding a
// join table for this iteration.
export const listTags = async (userId) => {
  const rows = await prisma.journalEntry.findMany({
    where: { userId, tags: { not: null } },
    select: { tags: true },
    orderBy: { createdOn: "desc" },
    take: 500,
  });

  const counts = new Map();
  rows.forEach(({ tags }) => {
    String(tags || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .forEach((tag) => {
        const key = tag.toLowerCase();
        const existing = counts.get(key);
        counts.set(key, {
          tag: existing?.tag || tag,
          count: (existing?.count || 0) + 1,
        });
      });
  });

  return {
    returnCode: 200,
    returnMessage: "Ledger tags fetched successfully",
    returnData: Array.from(counts.values()).sort(
      (a, b) => b.count - a.count || a.tag.localeCompare(b.tag),
    ),
  };
};

// Book suggestions mirror the existing ledger filters. Derive them from the
// user's entries so the picker never offers an empty option.
export const listBooks = async (userId) => {
  const rows = await prisma.journalEntry.findMany({
    where: { userId, bookName: { not: null } },
    select: { bookName: true },
    distinct: ["bookName"],
    orderBy: { bookName: "asc" },
    take: 200,
  });

  return {
    returnCode: 200,
    returnMessage: "Ledger books fetched successfully",
    returnData: rows.map((row) => row.bookName).filter(Boolean),
  };
};
