import { prisma } from "../../config/db.js";
import { cache } from "../../services/cacheService.js";
import { translateMany } from "../../utils/translator.js";
import {
  getDailyVerse,
  getFeaturedReadingPlans,
  getLandingData,
  getLandingStats,
  getPlanTiers,
} from "./service.js";

jest.mock("../../config/db.js", () => ({
  prisma: {
    dailyVerse: {
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    dailyDevotion: {
      count: jest.fn(),
    },
    readingPlan: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    subscriptionTier: {
      findMany: jest.fn(),
    },
    userPlanProgress: {
      groupBy: jest.fn(),
    },
    verseExplanation: {
      count: jest.fn(),
    },
    strongsDictionary: {
      count: jest.fn(),
    },
    bibleTopic: {
      count: jest.fn(),
    },
    bookPrologue: {
      count: jest.fn(),
    },
  },
}));

jest.mock("../../services/cacheService.js", () => {
  const store = new Map();
  return {
    cache: {
      get: jest.fn(async (namespace, key) => {
        const value = store.get(`${namespace}:${key}`);
        return value === undefined ? null : value;
      }),
      set: jest.fn(async (namespace, key, data) => {
        store.set(`${namespace}:${key}`, data);
      }),
      getOrSet: jest.fn(async (namespace, key, fetchFn) => {
        const cacheKey = `${namespace}:${key}`;
        if (store.has(cacheKey)) return store.get(cacheKey);
        const data = await fetchFn();
        store.set(cacheKey, data);
        return data;
      }),
      del: jest.fn(async (namespace, key) => {
        store.delete(`${namespace}:${key}`);
      }),
    },
  };
});

jest.mock("../../utils/translator.js", () => ({
  normalizeLanguage: jest.fn((lang, fallback = "en") =>
    typeof lang === "string" && lang.trim() ? lang.trim() : fallback,
  ),
  translateMany: jest.fn(async (texts = []) => texts),
}));

const verseRow = {
  bookName: "John",
  chapter: 3n,
  verseNumber: 16n,
  bibleVersion: "KJV",
  reflection: "God so loved the world.",
  explanation: "Salvation is offered to all.",
  learnMore: "Study John 3:16 in context.",
  application: "Share the gospel.",
  displayDate: new Date("2026-01-01T00:00:00.000Z"),
};

const planRow = (overrides = {}) => ({
  planId: "PLAN-1",
  title: "Plan of Discipleship",
  description: "A 30 day walk.",
  totalDays: 30,
  category: "Discipleship",
  difficulty: "beginner",
  questionsEnabled: true,
  ...overrides,
});

const tierRow = (overrides = {}) => ({
  id: "legacy_sower",
  name: "Legacy Sower",
  description: "Full access",
  price: 49,
  currency: "usd",
  interval: "year",
  maxSlots: null,
  features: ["Reading plans", "Exegesis"],
  sortOrder: 2,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  // Bypass Redis so every assertion exercises the Prisma queries directly.
  cache.getOrSet.mockImplementation(async (_namespace, _key, fetchFn) =>
    fetchFn(),
  );
  cache.get.mockResolvedValue(null);
  cache.set.mockResolvedValue(null);
  translateMany.mockImplementation(async (texts = []) => texts);
});

describe("landing service", () => {
  describe("getDailyVerse", () => {
    it("returns the published verse for today", async () => {
      prisma.dailyVerse.findFirst.mockResolvedValueOnce(verseRow);

      const result = await getDailyVerse({ lang: "en" });

      expect(result.status).toBe(200);
      expect(result.data.dailyVerse).toMatchObject({
        bookName: "John",
        chapter: 3,
        verseNumber: 16,
        reference: "John 3:16",
        bibleVersion: "KJV",
      });
      expect(prisma.dailyVerse.findFirst).toHaveBeenCalledTimes(1);
    });

    it("falls back to the most recent earlier published verse", async () => {
      prisma.dailyVerse.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(verseRow);

      const result = await getDailyVerse({});

      expect(result.data.dailyVerse.reference).toBe("John 3:16");
      expect(prisma.dailyVerse.findFirst).toHaveBeenCalledTimes(2);
      expect(prisma.dailyVerse.findFirst.mock.calls[1][0].where.displayDate).toEqual(
        expect.objectContaining({ lt: expect.any(Date) }),
      );
    });

    it("returns a null verse instead of failing when nothing is published", async () => {
      prisma.dailyVerse.findFirst.mockResolvedValue(null);

      const result = await getDailyVerse({});

      expect(result.status).toBe(200);
      expect(result.data.dailyVerse).toBeNull();
    });
  });

  describe("getFeaturedReadingPlans", () => {
    it("orders plans by participant count and keeps active plans only", async () => {
      prisma.readingPlan.findMany.mockResolvedValue([
        planRow({ planId: "PLAN-A", title: "A", totalDays: 10 }),
        planRow({ planId: "PLAN-B", title: "B", totalDays: 20 }),
      ]);
      prisma.userPlanProgress.groupBy.mockResolvedValue([
        { planId: "PLAN-A", _count: { _all: 3 } },
        { planId: "PLAN-B", _count: { _all: 9 } },
      ]);

      const result = await getFeaturedReadingPlans({ limit: 2 });

      expect(prisma.readingPlan.findMany.mock.calls[0][0].where).toEqual({
        isActive: true,
      });
      expect(result.data.plans.map((plan) => plan.planId)).toEqual([
        "PLAN-B",
        "PLAN-A",
      ]);
      expect(result.data.plans[0].participants).toBe(9);
    });

    it("clamps the limit to a sane maximum", async () => {
      prisma.readingPlan.findMany.mockResolvedValue([]);

      await getFeaturedReadingPlans({ limit: 500 });

      expect(prisma.readingPlan.findMany.mock.calls[0][0].take).toBe(12);
    });

    it("skips the participant query when there are no plans", async () => {
      prisma.readingPlan.findMany.mockResolvedValue([]);

      const result = await getFeaturedReadingPlans({});

      expect(prisma.userPlanProgress.groupBy).not.toHaveBeenCalled();
      expect(result.data.plans).toEqual([]);
    });
  });

  describe("getPlanTiers", () => {
    it("returns active tiers sorted by sort order with normalized features", async () => {
      prisma.subscriptionTier.findMany.mockResolvedValue([
        tierRow({ id: "free", name: "Free", sortOrder: 1, features: null }),
        tierRow(),
      ]);

      const result = await getPlanTiers({ lang: "en" });

      expect(prisma.subscriptionTier.findMany.mock.calls[0][0].where).toEqual({
        isActive: true,
      });
      expect(result.data.tiers.map((tier) => tier.id)).toEqual([
        "free",
        "legacy_sower",
      ]);
      expect(result.data.tiers[0].features).toEqual([]);
      expect(result.data.tiers[1].price).toBe(49);
    });

    it("parses features stored as a JSON string", async () => {
      prisma.subscriptionTier.findMany.mockResolvedValue([
        tierRow({ features: '["A", "B"]' }),
      ]);

      const result = await getPlanTiers({});

      expect(result.data.tiers[0].features).toEqual(["A", "B"]);
    });
  });

  describe("getLandingStats", () => {
    it("counts published content for the stats strip", async () => {
      prisma.readingPlan.count.mockResolvedValue(4);
      prisma.dailyVerse.count.mockResolvedValue(100);
      prisma.dailyDevotion.count.mockResolvedValue(60);
      prisma.verseExplanation.count.mockResolvedValue(12000);
      prisma.strongsDictionary.count.mockResolvedValue(8600);
      prisma.bibleTopic.count.mockResolvedValue(300);
      prisma.bookPrologue.count.mockResolvedValue(66);

      const result = await getLandingStats();

      expect(result.data.stats).toMatchObject({
        activeReadingPlans: 4,
        publishedVerses: 100,
        publishedDevotions: 60,
        verseExplanations: 12000,
        strongsWords: 8600,
        bibleTopics: 300,
        bookPrologues: 66,
      });
    });
  });

  describe("getLandingData", () => {
    it("bundles verse, plans, tiers and stats into one payload", async () => {
      prisma.dailyVerse.findFirst.mockResolvedValue(verseRow);
      prisma.readingPlan.findMany.mockResolvedValue([planRow()]);
      prisma.userPlanProgress.groupBy.mockResolvedValue([
        { planId: "PLAN-1", _count: { _all: 5 } },
      ]);
      prisma.subscriptionTier.findMany.mockResolvedValue([tierRow()]);
      prisma.readingPlan.count.mockResolvedValue(1);
      prisma.dailyVerse.count.mockResolvedValue(1);
      prisma.dailyDevotion.count.mockResolvedValue(1);
      prisma.verseExplanation.count.mockResolvedValue(1);
      prisma.strongsDictionary.count.mockResolvedValue(1);
      prisma.bibleTopic.count.mockResolvedValue(1);
      prisma.bookPrologue.count.mockResolvedValue(1);

      const result = await getLandingData({ lang: "en" });

      expect(result.status).toBe(200);
      expect(Object.keys(result.data).sort()).toEqual([
        "dailyVerse",
        "readingPlans",
        "stats",
        "tiers",
      ]);
      expect(result.data.dailyVerse.reference).toBe("John 3:16");
      expect(result.data.readingPlans[0].participants).toBe(5);
      expect(result.data.tiers).toHaveLength(1);
      expect(result.data.stats.activeReadingPlans).toBe(1);
    });
  });
});