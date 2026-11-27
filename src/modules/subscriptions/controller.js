import Stripe from "stripe";
import { prisma } from "../../config/db.js";
import { formatApiResponse } from "../../utils/helpers.js";
import { normalizeLanguage, translateMany } from "../../utils/translator.js";
import { MONTHLY_PLAN_CENTS, isPublishedPlan } from './planPolicy.js';
import { verifiedMonthlyPrice } from './monthlyPrice.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { timeout: 10000 });
const FRONTEND_URL =
  process.env.FRONTEND_URL || "https://app.exegesisproject.org";

// Deep link scheme for the mobile app — Stripe redirects back into the app after payment.
// Falls back to the web URL for web clients.
const APP_SCHEME = process.env.APP_DEEP_LINK_SCHEME || "exegesis://";

const isWebRequest = (req) => {
  const origin = req.headers?.origin || req.headers?.referer || "";
  return origin.startsWith("http://") || origin.startsWith("https://");
};

// Join a base with a path without duplicating slashes. Stripe rejects URLs
// such as "exegesis:///sower" (triple slash) with a url_invalid error, so the
// path's leading slashes must be stripped before appending to the base. A base
// that already ends in "/" (e.g. the "exegesis://" scheme) must not get an
// extra slash, otherwise the deep link becomes invalid.
const joinUrl = (base, path) => {
  const cleanPath = String(path || "").replace(/^\/+/, "");
  return base.endsWith("/") ? `${base}${cleanPath}` : `${base}/${cleanPath}`;
};

const redirectUrl = (req, path, status) => {
  const separator = path.includes("?") ? "&" : "?";
  const base = isWebRequest(req) ? joinUrl(FRONTEND_URL, path) : joinUrl(APP_SCHEME, path);
  return `${base}${separator}subscription=${status}`;
};

const returnUrl = (req, path) =>
  isWebRequest(req) ? joinUrl(FRONTEND_URL, path) : joinUrl(APP_SCHEME, path);

// ─── Tier ordering ────────────────────────────────────────────────────────────

const TIER_ORDER = {
  free: 0,
  legacy_sower_monthly: 1,
  legacy_sower: 1,
  covenant_sower_monthly: 2,
  covenant_sower: 2,
};

const BASE_TIER = (tierId) => tierId.replace(/_monthly$/, "");

const getSubscriptionPeriodEnd = (subscription) => {
  const periodEnd =
    subscription.current_period_end ??
    subscription.items?.data?.[0]?.current_period_end;
  return periodEnd != null && isFinite(periodEnd)
    ? new Date(periodEnd * 1000)
    : null;
};

const ACCESS_STATUSES = new Set(["active", "trialing"]);
const BILLING_STATUSES = new Set([...ACCESS_STATUSES, "past_due", "unpaid", "paused"]);
const belongsToUser = (subscription, userId) =>
  !subscription.metadata?.userId || subscription.metadata.userId === userId;
const subscriptionCustomerId = subscription =>
  typeof subscription.customer === "object" ? subscription.customer?.id : subscription.customer;

const MONTHLY_PRICE_ENV = {
  legacy_sower: "STRIPE_LEGACY_SOWER_MONTHLY_PRICE_ID",
  covenant_sower: "STRIPE_COVENANT_SOWER_MONTHLY_PRICE_ID",
};

const YEARLY_PRICE_ENV = {
  legacy_sower: "STRIPE_LEGACY_SOWER_PRICE_ID",
  covenant_sower: "STRIPE_COVENANT_SOWER_PRICE_ID",
};

// ─── Resolve price ID ─────────────────────────────────────────────────────────

const getPriceId = async (tier, interval) => {
  if (interval !== 'month') return null;
  // 1. Try DB first (stripePriceId from SubscriptionTier table)
  const tierId = interval === "month" ? `${tier}_monthly` : tier;
  const tierRecord = await prisma.subscriptionTier.findUnique({
    where: { id: tierId },
  });
  if (tierRecord?.isActive === false) return null;
  if (tierRecord?.stripePriceId) return tierRecord.stripePriceId;

  // 2. Fallback to env var map
  const envKey =
    interval === "month" ? MONTHLY_PRICE_ENV[tier] : YEARLY_PRICE_ENV[tier];
  return envKey ? process.env[envKey] : null;
};

// ─── Get or create Stripe customer (dedup) ────────────────────────────────────

const getOrCreateStripeCustomer = async (user) => {
  // If user already has a Stripe customer ID, reuse it
  if (user.stripeCustomerId) {
    try {
      const existing = await stripe.customers.retrieve(user.stripeCustomerId);
      if (!existing.deleted) return existing.id;
    } catch (error) {
      if (error.code !== "resource_missing") throw error;
    }
  }

  // Search Stripe by email to avoid duplicate customers
  const list = await stripe.customers.list({ email: user.email, limit: 5 });
  for (const candidate of list.data) {
    if (candidate.metadata?.userId && candidate.metadata.userId !== user.id) continue;
    const linkedUser = await prisma.systemUser.findUnique({
      where: { stripeCustomerId: candidate.id }, select: { id: true },
    });
    if (linkedUser && linkedUser.id !== user.id) continue;
    const customerId = candidate.id;
    // Store it so we never look this up again
    await prisma.systemUser.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
    return customerId;
  }

  // Create fresh customer
  const customer = await stripe.customers.create({
    email: user.email,
    name: `${user.firstName} ${user.lastName}`.trim(),
    metadata: { userId: user.id },
  });
  await prisma.systemUser.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id },
  });
  return customer.id;
};

const getActiveStripeSubscription = async (customerId, userId) => {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 100,
  });

  return subscriptions.data.find((subscription) =>
    BILLING_STATUSES.has(subscription.status) && belongsToUser(subscription, userId),
  );
};

// ─── createCheckoutSession ────────────────────────────────────────────────────

export const createCheckoutSession = async (req, res) => {
  try {
    const { tier, interval } = req.body;
    const userId = req.user.id;
    if (interval !== undefined && interval !== 'month') {
      return res.status(400).json(formatApiResponse({ status: 400, message: 'Invalid billing interval' }));
    }
    const billingInterval = 'month';

    if (!tier || !["legacy_sower", "covenant_sower"].includes(tier)) {
      return res.status(400).json(
        formatApiResponse({
          status: 400,
          message: "Invalid tier. Must be 'legacy_sower' or 'covenant_sower'",
        }),
      );
    }

    const user = await prisma.systemUser.findUnique({ where: { id: userId } });
    if (!user) {
      return res
        .status(404)
        .json(formatApiResponse({ status: 404, message: "User not found" }));
    }

    let priceId = await getPriceId(tier, billingInterval);
    if (!priceId) {
      return res.status(500).json(
        formatApiResponse({
          status: 500,
          message: "Stripe price ID not configured for this plan",
        }),
      );
    }

    // Never charge a rounded/different price from the advertised monthly plan.
    const checkoutPrice = await verifiedMonthlyPrice(stripe, tier, priceId);
    if (!checkoutPrice) {
      return res.status(409).json(formatApiResponse({ status: 409, message: 'Plan pricing is being updated. Please try again later.' }));
    }
    priceId = checkoutPrice.id;

    // ── Reuse or create Stripe customer (no duplicates) ──────────────────
    const customerId = await getOrCreateStripeCustomer(user);

    // Update the existing Stripe subscription in place. Creating another
    // Checkout subscription here would leave one user paying for two plans.
    let currentSubscription;
    if (user.stripeSubscriptionId) {
      try {
        currentSubscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      } catch (error) {
        if (error.code !== "resource_missing") throw error;
      }
    }
    if (!currentSubscription || !BILLING_STATUSES.has(currentSubscription.status) ||
        !belongsToUser(currentSubscription, userId) ||
        (subscriptionCustomerId(currentSubscription) && subscriptionCustomerId(currentSubscription) !== customerId)) {
      currentSubscription = await getActiveStripeSubscription(customerId, userId);
    }

    if (
      currentSubscription &&
      BILLING_STATUSES.has(currentSubscription.status)
    ) {
      if (!ACCESS_STATUSES.has(currentSubscription.status)) {
        return res.status(409).json(formatApiResponse({
          status: 409,
          message: "There is an existing subscription that needs attention in the billing portal.",
          data: { reason: "billing_action_required" },
        }));
      }
      const currentItem = currentSubscription.items?.data?.[0];
      if (!currentItem?.id) {
        return res.status(409).json(
          formatApiResponse({
            status: 409,
            message: "Active subscription has no billable plan item",
          }),
        );
      }

      if (currentItem.price?.id === priceId) {
        const periodEnd = getSubscriptionPeriodEnd(currentSubscription);
        if (periodEnd && periodEnd > new Date()) {
          await prisma.systemUser.update({
            where: { id: userId },
            data: {
              subscriptionTier: `${tier}_monthly`,
              stripeCustomerId: customerId,
              stripeSubscriptionId: currentSubscription.id,
              accessExpiresAt: periodEnd,
            },
          });
        }
        return res.status(409).json(
          formatApiResponse({
            status: 409,
            message: "You already have an active subscription to this plan",
            data: { reason: "already_subscribed" },
          }),
        );
      }

      const currentTier = await resolveTierFromPriceId(currentItem.price?.id, currentItem.price?.recurring?.interval);
      if (!currentTier || TIER_ORDER[tier] < TIER_ORDER[currentTier]) {
        return res.status(409).json(formatApiResponse({
          status: 409,
          message: "Please change your current subscription through the billing portal.",
          data: { reason: "billing_action_required" },
        }));
      }

      await stripe.subscriptions.update(currentSubscription.id, {
        items: [{ id: currentItem.id, price: priceId }],
        proration_behavior: "create_prorations",
        metadata: { userId, tier, interval: billingInterval },
      });

      return res.json(
        formatApiResponse({
          status: 200,
          message: "Subscription updated",
          data: {
            url: redirectUrl(req, "/sower", "upgraded"),
            upgraded: true,
          },
        }),
      );
    }

    if (tier === "legacy_sower") {
      const count = await prisma.systemUser.count({
        where: { subscriptionTier: { startsWith: "legacy_sower" } },
      });
      if (count >= 1000) {
        return res.status(400).json(formatApiResponse({
          status: 400, message: "Legacy Sower slots are full (1,000/1,000 claimed)",
        }));
      }
    }

    // ── New subscription: create a Checkout session tied to the customer ─
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId, // ← reuse existing customer, no duplicate
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: userId,
      metadata: { userId, tier, interval: billingInterval },
      success_url: redirectUrl(req, "/sower", "success"),
      cancel_url: redirectUrl(req, "/sower", "cancelled"),
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { userId, tier, interval: billingInterval },
      },
    });

    return res.json(
      formatApiResponse({
        status: 200,
        message: "Checkout session created",
        data: { url: session.url, upgraded: false },
      }),
    );
  } catch (error) {
    console.error(
      "[SubscriptionController] createCheckoutSession error:",
      error,
    );
    return res.status(500).json(
      formatApiResponse({
        status: 500,
        message: "Failed to create checkout session",
      }),
    );
  }
};

// ─── createPortalSession ──────────────────────────────────────────────────────

export const createPortalSession = async (req, res) => {
  try {
    const user = await prisma.systemUser.findUnique({
      where: { id: req.user.id },
    });

    if (!user?.stripeCustomerId) {
      return res.status(400).json(
        formatApiResponse({
          status: 400,
          message: "No active subscription found",
        }),
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl(req, "/sower"),
    });

    return res.json(
      formatApiResponse({
        status: 200,
        message: "Portal session created",
        data: { url: session.url },
      }),
    );
  } catch (error) {
    console.error("[SubscriptionController] createPortalSession error:", error);
    return res.status(500).json(
      formatApiResponse({
        status: 500,
        message: "Failed to create portal session",
      }),
    );
  }
};

// ─── Hardcoded fallback (used when both Stripe and DB are unreachable) ────

const FALLBACK_TIERS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    currency: "usd",
    interval: "none",
    features: ["Bible reading", "Daily verse", "Basic tools", "Exegesis Lab and Legacy Ledger"],
    isActive: true,
    sortOrder: 0,
  },
  {
    id: "legacy_sower_monthly",
    name: "Legacy Sower",
    price: 3.33,
    currency: "usd",
    interval: "month",
    features: [
      "In-depth verse explanations",
      "Higher-rate API access",
      "Legacy badge",
    ],
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "covenant_sower_monthly",
    name: "Covenant Sower",
    price: 7.77,
    currency: "usd",
    interval: "month",
    features: [
      "Everything in Legacy Sower",
      "Priority support",
      "Covenant badge",
    ],
    isActive: true,
    sortOrder: 2,
  },
];

/** Monthly catalogue independent of historical yearly products/prices. */
async function buildMonthlyTiers() {
  const tiers = [FALLBACK_TIERS[0]];
  for (const [baseId, cents] of Object.entries(MONTHLY_PLAN_CENTS)) {
    const id = `${baseId}_monthly`;
    const stored = await prisma.subscriptionTier.findUnique({ where: { id } });
    if (stored?.isActive === false) continue;
    const priceId = stored?.stripePriceId || process.env[MONTHLY_PRICE_ENV[baseId]];
    if (!priceId) continue;
    try {
      const price = await verifiedMonthlyPrice(stripe, baseId, priceId);
      if (!price) continue;
      const product = price.product;
      if (!price.active || price.unit_amount !== cents || price.currency !== 'usd' ||
          price.recurring?.interval !== 'month' || price.recurring?.interval_count !== 1 ||
          !product || typeof product === 'string' || product.deleted || !product.active) continue;
      let features = stored?.features || FALLBACK_TIERS.find(tier => tier.id === id)?.features || [];
      try { if (product.metadata?.features) features = JSON.parse(product.metadata.features); } catch { /* reviewed defaults */ }
      tiers.push({ ...stored, id, name: product.name, description: product.description || '',
        price: cents / 100, currency: 'usd', interval: 'month', isActive: true,
        features: Array.isArray(features) ? features.filter(item => typeof item === 'string' && !/\b(?:lab|strong.s|ledger)\b/i.test(item)) : [],
        stripePriceId: price.id, stripeProductId: product.id,
        sortOrder: baseId === 'legacy_sower' ? 1 : 2 });
    } catch (error) { console.warn('[Subscription] Monthly price unavailable:', id, error.type || error.message); }
  }
  return tiers.length > 1 ? tiers : [];
}

// ─── listTiers ────────────────────────────────────────────────────────────────

const translateTierFields = async (tiers, lang) => {
  if (lang.toLowerCase() === "en") return tiers;

  const translatedTiers = tiers.map((tier) => ({
    ...tier,
    ...(Array.isArray(tier.features) && { features: [...tier.features] }),
  }));
  const entries = [];

  translatedTiers.forEach((tier) => {
    if (typeof tier.name === "string") {
      entries.push({
        value: tier.name,
        set: (value) => {
          tier.name = value;
        },
      });
    }
    if (typeof tier.description === "string") {
      entries.push({
        value: tier.description,
        set: (value) => {
          tier.description = value;
        },
      });
    }
    if (Array.isArray(tier.features)) {
      tier.features.forEach((feature, index) => {
        if (typeof feature === "string") {
          entries.push({
            value: feature,
            set: (value) => {
              tier.features[index] = value;
            },
          });
        }
      });
    }
  });

  if (entries.length === 0) return translatedTiers;

  try {
    const translations = await translateMany(
      entries.map(({ value }) => value),
      lang,
    );
    entries.forEach((entry, index) => {
      if (typeof translations[index] === "string")
        entry.set(translations[index]);
    });
    return translatedTiers;
  } catch (error) {
    console.warn(
      `[SubscriptionController] Tier translation to ${lang} failed:`,
      error.message,
    );
    return tiers;
  }
};

export const listTiers = async (req, res) => {
  const lang = normalizeLanguage(req.body?.lang ?? "en");

  try {
    // 1. Try Stripe first — real-time prices from the source of truth
    const fromStripe = await buildMonthlyTiers();
    if (fromStripe.length > 0) {
      const tiers = await translateTierFields(fromStripe, lang);
      return res.json(
        formatApiResponse({
          status: 200,
          message: "Tiers retrieved",
           data: { tiers: tiers.map(tier => ({ ...tier, checkoutAvailable: tier.id !== 'free', source: 'stripe' })) },
        }),
      );
    }

    // 2. Fallback to DB
    let tiers = await prisma.subscriptionTier.findMany({
      orderBy: { sortOrder: "asc" },
    });
    tiers = (tiers || []).filter(isPublishedPlan);
    if (tiers && tiers.length > 0) {
      tiers = await translateTierFields(tiers, lang);
      return res.json(
        formatApiResponse({
          status: 200,
          message: "Tiers retrieved",
           data: { tiers: tiers.map(tier => ({ ...tier, checkoutAvailable: tier.isActive !== false && Boolean(tier.stripePriceId || process.env[(tier.interval === 'month' ? MONTHLY_PRICE_ENV : YEARLY_PRICE_ENV)[BASE_TIER(tier.id)]]), source: 'database' })) },
        }),
      );
    }

    // 3. Last resort — hardcoded defaults so the app never breaks
    tiers = await translateTierFields(FALLBACK_TIERS.filter(isPublishedPlan), lang);
    return res.json(
      formatApiResponse({
        status: 200,
        message: "Tiers retrieved (fallback)",
         data: { tiers: tiers.map(tier => ({ ...tier, checkoutAvailable: false, source: 'fallback' })) },
      }),
    );
  } catch (error) {
    console.error("[SubscriptionController] listTiers error:", error);
    const tiers = await translateTierFields(FALLBACK_TIERS, lang);
    return res.json(
      formatApiResponse({
        status: 200,
        message: "Tiers retrieved (fallback)",
         data: { tiers: tiers.map(tier => ({ ...tier, checkoutAvailable: false, source: 'fallback' })) },
      }),
    );
  }
};

// ─── Resolve a Stripe price ID to an internal tier ID ─────────────────────────

const resolveTierFromPriceId = async (priceId, interval) => {
  if (!priceId) return null;

  const tier = await prisma.subscriptionTier.findFirst({
    where: { stripePriceId: priceId },
  });
  if (tier && (TIER_ORDER[tier.id] ?? 0) > 0) return tier.id;

  // Historical yearly subscriptions still need status reconciliation even
  // though those prices are no longer available for new purchases.
  for (const tierId of Object.keys(MONTHLY_PLAN_CENTS)) {
    if (process.env[YEARLY_PRICE_ENV[tierId]] === priceId) return tierId;
    if (process.env[MONTHLY_PRICE_ENV[tierId]] === priceId) return `${tierId}_monthly`;
  }

  try {
    const price = await stripe.prices.retrieve(priceId, {
      expand: ["product"],
    });
    const product = price.product;
    if (product && typeof product === "object" && !product.deleted) {
      if (product.metadata?.tierId) {
        const base = product.metadata.tierId.replace(/_monthly$/, '');
        if (Object.hasOwn(MONTHLY_PLAN_CENTS, base)) return interval === 'month' ? `${base}_monthly` : base;
      }
      const slug = product.name
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "");
      if (slug && Object.hasOwn(MONTHLY_PLAN_CENTS, slug)) return interval === "month" ? `${slug}_monthly` : slug;
    }
  } catch {
    /* non-fatal */
  }

  return null;
};

async function findCustomerEntitlement(customerId, userId, excludedSubscriptionId) {
  const lists = await Promise.all(["active", "trialing"].map(status =>
    stripe.subscriptions.list({ customer: customerId, status, limit: 10 }),
  ));
  let best = null;
  for (const subscription of lists.flatMap(list => list.data)) {
    if (subscription.id === excludedSubscriptionId || !belongsToUser(subscription, userId)) continue;
    const periodEnd = getSubscriptionPeriodEnd(subscription);
    if (!periodEnd || periodEnd <= new Date()) continue;
    const price = subscription.items?.data?.[0]?.price;
    const tier = await resolveTierFromPriceId(price?.id, price?.recurring?.interval);
    if (tier && (!best || TIER_ORDER[tier] > TIER_ORDER[best.subscriptionTier])) {
      best = {
        subscriptionTier: tier,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        accessExpiresAt: periodEnd,
      };
    }
  }
  return best;
}

async function recoverEntitlement(user, account) {
  if (user.stripeCustomerId) {
    try {
      const linked = await findCustomerEntitlement(user.stripeCustomerId, account.id);
      if (linked) return linked;
    } catch (error) {
      if (error.code !== "resource_missing") throw error;
    }
  }
  if (!account.email) return null;
  const customers = await stripe.customers.list({ email: account.email, limit: 5 });
  const matches = await Promise.all(customers.data
    .filter(customer => customer.id !== user.stripeCustomerId &&
      (!customer.metadata?.userId || customer.metadata.userId === account.id))
    .map(async customer => {
      const linkedUser = await prisma.systemUser.findUnique({
        where: { stripeCustomerId: customer.id }, select: { id: true },
      });
      return linkedUser && linkedUser.id !== account.id ? null : findCustomerEntitlement(customer.id, account.id);
    }));
  return matches.filter(Boolean).sort((a, b) => TIER_ORDER[b.subscriptionTier] - TIER_ORDER[a.subscriptionTier])[0] ?? null;
}

// ─── getSubscriptionStatus ────────────────────────────────────────────────────

export const getSubscriptionStatus = async (req, res) => {
  try {
    let user = await prisma.systemUser.findUnique({
      where: { id: req.user.id },
      select: {
        subscriptionTier: true,
        accessExpiresAt: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        legacySowerSlot: true,
        accountStatus: true,
      },
    });

    if (!user) {
      return res
        .status(404)
        .json(formatApiResponse({ status: 404, message: "User not found" }));
    }

    // Recover missed webhooks using the linked customer first. Billing email
    // can differ from the reader's sign-in email.
    let recovered = false;
    if (
      user.accountStatus !== "deleted" &&
      (user.subscriptionTier === "free" || (user.stripeCustomerId && !user.stripeSubscriptionId))
    ) {
      let timeout;
      try {
        const entitlement = await Promise.race([
          recoverEntitlement(user, req.user),
          new Promise((_, reject) => {
            timeout = setTimeout(() => reject(new Error("Stripe reconciliation timed out")), 12000);
          }),
        ]);
        if (entitlement) {
          await prisma.systemUser.update({ where: { id: req.user.id }, data: entitlement });
          user = { ...user, ...entitlement };
          recovered = true;
        }
      } catch (stripeErr) {
        console.warn(
          "[StripeReconciliation] Failed to sync from Stripe:",
          stripeErr.message,
        );
      } finally {
        clearTimeout(timeout);
      }
    }

    // Verify known paid subscriptions too. Webhooks are the primary sync
    // mechanism, but this repairs missed deliveries when the client asks for
    // status after checkout, renewal, cancellation, or a portal change.
    if (!recovered && user.accountStatus !== "deleted" && user.stripeSubscriptionId && user.subscriptionTier !== "free") {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId).catch(error => {
          if (error.code !== "resource_missing") throw error;
          return null;
        });
        let changes;
        const customer = subscription && subscriptionCustomerId(subscription);
        if (subscription && ACCESS_STATUSES.has(subscription.status) && belongsToUser(subscription, req.user.id) &&
            (!customer || !user.stripeCustomerId || customer === user.stripeCustomerId)) {
          const price = subscription.items?.data?.[0]?.price;
          const tier = await resolveTierFromPriceId(price?.id, price?.recurring?.interval);
          const periodEnd = getSubscriptionPeriodEnd(subscription);
          if (tier && periodEnd && (tier !== user.subscriptionTier || periodEnd.getTime() !== Number(user.accessExpiresAt))) {
            changes = { subscriptionTier: tier, accessExpiresAt: periodEnd };
          }
        } else {
          // A renewal can have a new subscription ID even when its webhook was missed.
          const replacement = user.stripeCustomerId
            ? await findCustomerEntitlement(user.stripeCustomerId, req.user.id, user.stripeSubscriptionId)
            : null;
          changes = replacement ?? { subscriptionTier: "free", stripeSubscriptionId: null, accessExpiresAt: null };
        }
        if (changes) {
          await prisma.systemUser.update({ where: { id: req.user.id }, data: changes });
          user = { ...user, ...changes };
        }
      } catch (stripeErr) {
        console.warn(
          "[StripeReconciliation] Known subscription sync failed:",
          stripeErr.message,
        );
      }
    }

    let tierMeta = null;
    try {
      tierMeta = await prisma.subscriptionTier.findUnique({
        where: { id: user.subscriptionTier },
      });
    } catch {
      /* non-fatal */
    }

    return res.json(
      formatApiResponse({
        status: 200,
        message: "Subscription status retrieved",
        data: { ...user, userId: req.user.id, tierMeta },
      }),
    );
  } catch (error) {
    console.error(
      "[SubscriptionController] getSubscriptionStatus error:",
      error,
    );
    // Never attempt a second response if one was already sent (e.g. by a
    // stray res.json inside the reconciliation race) — that itself throws.
    if (res.headersSent) return;
    return res.status(500).json(
      formatApiResponse({
        status: 500,
        message: "Failed to get subscription status",
      }),
    );
  }
};

// ─── handleGetSubscribedUsers (legacy — admin now has its own endpoint) ────────

export const handleGetSubscribedUsers = async (req, res) => {
  try {
    const subscribedUsers = await prisma.systemUser.findMany({
      where: { subscriptionTier: { not: "free" } },
      select: {
        id: true,
        email: true,
        subscriptionTier: true,
        accessExpiresAt: true,
        stripeCustomerId: true,
        legacySowerSlot: true,
      },
    });
    return res.json(
      formatApiResponse({
        status: 200,
        message: "Subscribed users retrieved",
        data: { subscribedUsers },
      }),
    );
  } catch (error) {
    console.error(
      "[SubscriptionController] handleGetSubscribedUsers error:",
      error,
    );
    return res.status(500).json(
      formatApiResponse({
        status: 500,
        message: "Failed to retrieve subscribed users",
      }),
    );
  }
};
