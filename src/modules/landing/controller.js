import * as landingService from "./service.js";
import { formatApiResponse } from "../../utils/helpers.js";

export const getLanding = async (req, res) => {
  try {
    const result = await landingService.getLandingData({
      lang: req.body?.lang,
      limit: req.body?.limit,
    });
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error("[Landing] getLanding error:", error);
    return res.status(500).json(
      formatApiResponse({
        status: 500,
        message: "Error fetching landing data: " + error.message,
      }),
    );
  }
};

export const getDailyVerse = async (req, res) => {
  try {
    const result = await landingService.getDailyVerse({
      lang: req.body?.lang,
    });
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error("[Landing] getDailyVerse error:", error);
    return res.status(500).json(
      formatApiResponse({
        status: 500,
        message: "Error fetching daily verse: " + error.message,
      }),
    );
  }
};

export const getFeaturedReadingPlans = async (req, res) => {
  try {
    const result = await landingService.getFeaturedReadingPlans({
      lang: req.body?.lang,
      limit: req.body?.limit,
    });
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error("[Landing] getFeaturedReadingPlans error:", error);
    return res.status(500).json(
      formatApiResponse({
        status: 500,
        message: "Error fetching reading plans: " + error.message,
      }),
    );
  }
};

export const getPlanTiers = async (req, res) => {
  try {
    const result = await landingService.getPlanTiers({ lang: req.body?.lang });
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error("[Landing] getPlanTiers error:", error);
    return res.status(500).json(
      formatApiResponse({
        status: 500,
        message: "Error fetching subscription tiers: " + error.message,
      }),
    );
  }
};

export const getStats = async (req, res) => {
  try {
    const result = await landingService.getLandingStats();
    return res.status(result.status).json(formatApiResponse(result));
  } catch (error) {
    console.error("[Landing] getStats error:", error);
    return res.status(500).json(
      formatApiResponse({
        status: 500,
        message: "Error fetching landing stats: " + error.message,
      }),
    );
  }
};