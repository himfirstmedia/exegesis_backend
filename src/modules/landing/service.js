import { prisma } from "../../config/db.js";
import { serializeBigInt } from "../../utils/helpers.js";
import { cache } from "../../services/cacheService.js";
import { normalizeLanguage, translateMany } from "../../utils/translator.js";
import { utcToday } from "../../utils/dates.js";

// The landing page and the public /plans page are marketing surfaces read by
// anonymous visitors, so everything here is public + cached. TTLs are short
// enough that publishing a verse or editing a plan shows up quickly, and long
// enough to keep the page off the database on every visit.
const CACHE_NAMESPACE = "landing";
const DAILY_VERSE_TTL = 1800; // 30 minutes — a verse only changes once a day
const STATS_TTL = 900; // 15 minutes
const CONTENT_TTL = 300; // 5 minutes — plans/tiers change rarely
const DEFAULT_PLAN_LIMIT = 6;
const MAX_PLAN_LIMIT = 12;

const parseLimit = (value, fallback = DEFAULT_PLAN_LIMIT) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, MAX_PLAN_LIMIT);
};

const ymd = (date) => date.toISOString().slice(0, 10);

const normalizeFeatures = (features) => {
  if (Array.isArray(features)) {
    return features.filter((f) => typeof f === "string" && f.trim().length > 0);
  }
  if (typeof features === "string" && features.trim()) {
    try {
      const parsed = JSON.parse(features);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (f) => typeof f === "string" && f.trim().length > 0,
        );
      }
    } catch {
      return [];
    }
  }
  return [];
};

const shapeDailyVerse = (verse) => {
  if (!verse) return null;
  return {
    bookName: verse.bookName,
    chapter: Number(verse.chapter),
    verseNumber: Number(verse.verseNumber),
    reference: `${verse.bookName} ${Number(verse.chapter)}:${Number(verse.verseNumber)}`,
    bibleVersion: verse.bibleVersion,
    reflection: verse.reflection || null,
    explanation: verse.explanation || null,
    learnMore: verse.learnMore || null,
    application: verse.application || null,
    displayDate: verse.displayDate,
  };
};

const shapePlan = (plan, participantMap = new Map()) => ({
  planId: plan.planId,
  title: plan.title,
  description: plan.description || null,
  totalDays: plan.totalDays,
  category: plan.category || null,
  difficulty: plan.difficulty || null,
  questionsEnabled: Boolean(plan.questionsEnabled),
  participants: participantMap.get(plan.planId) || 0,
});

const shapeTier = (tier) => ({
  id: tier.id,
  name: tier.name,
  description: tier.description || null,
  price: Number(tier.price),
  currency: tier.currency || "usd",
  interval: tier.interval || "none",
  maxSlots: tier.maxSlots ?? null,
  features: normalizeFeatures(tier.features),
  sortOrder: tier.sortOrder ?? 0,
});

const translatePlanText = async (plans, lang) => {
  const texts = plans.flatMap((plan) => [plan.title, plan.description]);
  const translated = await translateMany(texts, lang);
  return plans.map((plan, index) => ({
    ...plan,
    title: translated[index * 2] || plan.title,
    description: translated[index * 2 + 1] || plan.description,
  }));
};

const translateTierText = async (tiers, lang) => {
  const texts = tiers.flatMap((tier) => [
    tier.name,
    tier.description,
    ...tier.features,
  ]);
  const translated = await translateMany(texts, lang);
  let cursor = 0;
  return tiers.map((tier) => {
    const name = translated[cursor++] || tier.name;
    const description = translated[cursor++] || tier.description;
    const features = tier.features.map(
      (feature) => translated[cursor++] || feature,
    );
    return { ...tier, name, description, features };
  });
};

const translateVerseText = async (verse, lang) => {
  if (!verse) return verse;
  const texts = [
    verse.reflection,
    verse.explanation,
    verse.learnMore,
    verse.application,
  ];
  const translated = await translateMany(texts, lang);
  return {
    ...verse,
    reflection: translated[0] || verse.reflection,
    explanation: translated[1] || verse.explanation,
    learnMore: translated[2] || verse.learnMore,
    application: translated[3] || verse.application,
  };
};

/**
 * Today's published verse of the day. Falls back to the most recent published
 * verse so the hero never renders empty while the next day's verse is pending
 * review.
 */
export const getDailyVerse = async ({ lang = "en" } = {}) => {
  const target = normalizeLanguage(lang);
  const today = utcToday();

  const base = await cache.getOrSet(
    CACHE_NAMESPACE,
    `daily-verse:${ymd(today)}`,
    async () => {
      const verse =
        (await prisma.dailyVerse.findFirst({
          where: { isPublished: true, displayDate: today },
          orderBy: { createdOn: "desc" },
        })) ||
        (await prisma.dailyVerse.findFirst({
          where: { isPublished: true, displayDate: { lt: today } },
          orderBy: { displayDate: "desc" },
        }));
      return serializeBigInt(shapeDailyVerse(verse));
    },
    DAILY_VERSE_TTL,
  );

  return {
    status: 200,
    message: "Daily verse retrieved",
    data: { dailyVerse: await translateVerseText(base, target) },
  };
};

/**
 * Featured reading plans for the landing grid, ordered by how many readers
 * have started them so the strongest plans surface first.
 */
export const getFeaturedReadingPlans = async ({ lang = "en", limit } = {}) => {
  const target = normalizeLanguage(lang);
  const take = parseLimit(limit);

  const base = await cache.getOrSet(
    CACHE_NAMESPACE,
    `reading-plans:${take}`,
    async () => {
      const plans = await prisma.readingPlan.findMany({
        where: { isActive: true },
        select: {
          planId: true,
          title: true,
          description: true,
          totalDays: true,
          category: true,
          difficulty: true,
          questionsEnabled: true,
        },
        take,
        orderBy: { createdOn: "desc" },
      });

      const participantMap = new Map();
      if (plans.length > 0) {
        const counts = await prisma.userPlanProgress.groupBy({
          by: ["planId"],
          where: { planId: { in: plans.map((plan) => plan.planId) } },
          _count: { _all: true },
        });
        counts.forEach((entry) => {
          participantMap.set(entry.planId, entry._count._all);
        });
      }

      return serializeBigInt(
        plans
          .map((plan) => shapePlan(plan, participantMap))
          .sort(
            (a, b) =>
              b.participants - a.participants ||
              b.totalDays - a.totalDays,
          ),
      );
    },
    CONTENT_TTL,
  );

  return {
    status: 200,
    message: "Reading plans retrieved",
    data: { plans: await translatePlanText(base, target) },
  };
};

/**
 * Active subscription tiers for the plan comparison / pricing sections.
 */
export const getPlanTiers = async ({ lang = "en" } = {}) => {
  const target = normalizeLanguage(lang);

  const base = await cache.getOrSet(
    CACHE_NAMESPACE,
    "tiers",
    async () => {
      const tiers = await prisma.subscriptionTier.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
      });
      return serializeBigInt(tiers.map(shapeTier));
    },
    CONTENT_TTL,
  );

  return {
    status: 200,
    message: "Subscription tiers retrieved",
    data: { tiers: await translateTierText(base, target) },
  };
};

/**
 * Trust signals for the landing stats strip — cheap COUNTs only.
 */
export const getLandingStats = async () => {
  const stats = await cache.getOrSet(
    CACHE_NAMESPACE,
    "stats",
    async () => {
      const [
        activeReadingPlans,
        publishedVerses,
        publishedDevotions,
        verseExplanations,
        strongsWords,
        bibleTopics,
        bookPrologues,
      ] = await Promise.all([
        prisma.readingPlan.count({ where: { isActive: true } }),
        prisma.dailyVerse.count({ where: { isPublished: true } }),
        prisma.dailyDevotion.count({ where: { isPublished: true } }),
        prisma.verseExplanation.count(),
        prisma.strongsDictionary.count(),
        prisma.bibleTopic.count(),
        prisma.bookPrologue.count(),
      ]);

      return serializeBigInt({
        activeReadingPlans,
        publishedVerses,
        publishedDevotions,
        verseExplanations,
        strongsWords,
        bibleTopics,
        bookPrologues,
      });
    },
    STATS_TTL,
  );

  return {
    status: 200,
    message: "Landing stats retrieved",
    data: { stats },
  };
};

/**
 * One round trip for the whole landing page: daily verse, featured plans,
 * subscription tiers and stats.
 */
export const getLandingData = async ({ lang = "en", limit } = {}) => {
  const target = normalizeLanguage(lang);

  const [verseResult, plansResult, tiersResult, statsResult] =
    await Promise.all([
      getDailyVerse({ lang: target }),
      getFeaturedReadingPlans({ lang: target, limit }),
      getPlanTiers({ lang: target }),
      getLandingStats(),
    ]);

  return {
    status: 200,
    message: "Landing data retrieved",
    data: {
      dailyVerse: verseResult.data.dailyVerse,
      readingPlans: plansResult.data.plans,
      tiers: tiersResult.data.tiers,
      stats: statsResult.data.stats,
    },
  };
};