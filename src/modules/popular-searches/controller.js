/**
 * controller.js — Popular Searches
 * ─────────────────────────────────────────────────────────────────────────────
 * Logs search queries and returns aggregated popular searches.
 *
 * Endpoints:
 *   POST /popular-searches/log    — Log a search query
 *   GET  /popular-searches        — Get popular searches, optionally by scope
 */

import { prisma } from "../../config/db.js";
import { formatApiResponse } from "../../utils/helpers.js";

/**
 * Log a search query.
 * Stores minimal data: query, scope, optional userId, timestamp.
 */
export const logSearch = async (req, res) => {
  try {
    const { query, scope = "bible" } = req.body;

    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return res.status(400).json(
        formatApiResponse({
          status: 400,
          message: "Query must be at least 2 characters",
          data: null,
        }),
      );
    }

    const sanitized = query.trim().substring(0, 200);
    const userId = req.user?.id ?? null;
    const ipAddress = req.ip || req.connection?.remoteAddress || null;

    await prisma.popularSearchLog.create({
      data: {
        query: sanitized,
        scope: scope || "bible",
        userId,
        ipAddress,
      },
    });

    return res.json(
      formatApiResponse({
        status: 200,
        message: "Search logged",
        data: null,
      }),
    );
  } catch (error) {
    // Silently fail — logging should never block the user's search
    console.warn("[popular-searches] logSearch error:", error.message);
    return res.json(
      formatApiResponse({
        status: 200,
        message: "Search logged",
        data: null,
      }),
    );
  }
};

/**
 * Get popular search suggestions.
 * Returns the top-N most searched queries, optionally filtered by scope.
 * Uses a 7-day window by default.
 */
export const getPopularSearches = async (req, res) => {
  try {
    const scope = req.query.scope || null;
    const limit = Math.min(parseInt(req.query.limit) || 12, 50);
    const days = parseInt(req.query.days) || 7;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const where = {
      createdOn: { gte: cutoff },
    };
    if (scope) {
      where.scope = scope;
    }

    const rows = await prisma.popularSearchLog.groupBy({
      by: ["query", "scope"],
      where,
      _count: { query: true },
      orderBy: { _count: { query: "desc" } },
      take: limit,
    });

    const suggestions = rows.map((r) => ({
      query: r.query,
      scope: r.scope,
      count: r._count.query,
    }));

    return res.json(
      formatApiResponse({
        status: 200,
        message: "Popular searches retrieved",
        data: suggestions,
      }),
    );
  } catch (error) {
    console.error("[popular-searches] getPopularSearches error:", error);
    return res.status(500).json(
      formatApiResponse({
        status: 500,
        message: "Failed to retrieve popular searches",
        data: [],
      }),
    );
  }
};
