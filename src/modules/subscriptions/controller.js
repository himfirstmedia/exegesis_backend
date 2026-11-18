import Stripe from "stripe";
import { prisma } from "../../config/db.js";
import { formatApiResponse } from "../../utils/helpers.js";
import { normalizeLanguage, translateMany } from "../../utils/translator.js";
import { MONTHLY_PLAN_CENTS, isPublishedPlan } from './planPolicy.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { timeout: 10000 });
const FRONTEND_URL =
  process.env.FRONTEND_URL || "https://app.exegesisproject.org";

// Deep link scheme for the mobile app — Stripe redirects back into the app after payment.
// Falls back to the web URL for web clients.
const APP_SCHEME = process.env.APP_DEEP_LINK_SCHEME || "exegesis://";

const isWebRequest = (req) => {
  const origin = req.headers.origin || req.headers.referer || "";
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
    } catch {
      /* customer may have been deleted on Stripe side — fall through */
    }
  }

  // Search Stripe by email to avoid duplicate customers
  const list = await stripe.customers.list({ email: user.email, limit: 1 });
  if (list.data.length > 0) {
    const customerId = list.data[0].id;
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

const getActiveStripeSubscription = async (customerId) => {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 100,
  });

  return subscriptions.data.find((subscription) =>
    ["active", "trialing", "past_due"].includes(subscription.status),
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

    const currentBase = BASE_TIER(user.subscriptionTier);
    const targetBase = tier;

    // Block downgrade attempts via this endpoint
    if (
      user.subscriptionTier !== "free" &&
      TIER_ORDER[targetBase] < TIER_ORDER[currentBase]
    ) {
      return res.status(400).json(
        formatApiResponse({
          status: 400,
          message: "Downgrades must be done through the billing portal",
        }),
      );
    }

    // Legacy Sower cap
    if (tier === "legacy_sower") {
      const count = await prisma.systemUser.count({
        where: { subscriptionTier: { startsWith: "legacy_sower" } },
      });
      if (count >= 1000) {
        return res.status(400).json(
          formatApiResponse({
            status: 400,
            message: "Legacy Sower slots are full (1,000/1,000 claimed)",
          }),
        );
      }
    }

    const priceId = await getPriceId(tier, billingInterval);
    if (!priceId) {
      return res.status(500).json(
        formatApiResponse({
          status: 500,
          message: "Stripe price ID not configured for this plan",
        }),
      );
    }

    // Never charge a rounded/different price from the advertised monthly plan.
    const checkoutPrice = await stripe.prices.retrieve(priceId);
    if (!checkoutPrice.active || checkoutPrice.currency !== 'usd' ||
        checkoutPrice.unit_amount !== MONTHLY_PLAN_CENTS[tier] ||
        checkoutPrice.recurring?.interval !== 'month' || checkoutPrice.recurring?.interval_count !== 1) {
      return res.status(409).json(formatApiResponse({ status: 409, message: 'Plan pricing is being updated. Please try again later.' }));
    }

    // ── Reuse or create Stripe customer (no duplicates) ──────────────────
    const customerId = await getOrCreateStripeCustomer(user);

    // Update the existing Stripe subscription in place. Creating another
    // Checkout subscription here would leave one user paying for two plans.
    const currentSubscription = user.stripeSubscriptionId
      ? await stripe.subscriptions.retrieve(user.stripeSubscriptionId)
      : await getActiveStripeSubscription(customerId);

    if (
      currentSubscription &&
      ["active", "trialing", "past_due"].includes(currentSubscription.status)
    ) {
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
        return res.status(409).json(
          formatApiResponse({
            status: 409,
            message: "You already have an active subscription to this plan",
          }),
        );
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
    features: ["Bible reading", "Daily verse", "Basic tools"],
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
      "Advanced word study (Strong's Concordance)",
      "In-depth verse explanations",
      "Lab (AI-assisted study)",
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
      const price = await stripe.prices.retrieve(priceId, { expand: ['product'] });
      const product = price.product;
      if (!price.active || price.unit_amount !== cents || price.currency !== 'usd' ||
          price.recurring?.interval !== 'month' || price.recurring?.interval_count !== 1 ||
          !product || typeof product === 'string' || product.deleted || !product.active) continue;
      let features = stored?.features || FALLBACK_TIERS.find(tier => tier.id === id)?.features || [];
      try { if (product.metadata?.features) features = JSON.parse(product.metadata.features); } catch { /* reviewed defaults */ }
      tiers.push({ ...stored, id, name: product.name, description: product.description || '',
        price: cents / 100, currency: 'usd', interval: 'month', isActive: true,
        features: Array.isArray(features) ? features.filter(item => typeof item === 'string') : [],
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
  if (tier) return tier.id;

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
      if (product.metadata?.tierId) return product.metadata.tierId;
      const slug = product.name
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "");
      if (slug) return interval === "month" ? `${slug}_monthly` : slug;
    }
  } catch {
    /* non-fatal */
  }

  return null;
};

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

    // ── Stripe reconciliation ─────────────────────────────────────────────
    // If DB says free, search Stripe for the user's email to find any
    // active subscriptions. Handles:
    //   1. Normal flow: user has stripeCustomerId but webhook missed.
    //   2. Missing customer: search by email, may find multiple customers.
    //   3. Multiple subs: pick the highest tier (e.g. covenant_sower > legacy_sower).
    // Deleted accounts must never be reconciled: their Stripe customer was
    // anonymized and their email tombstoned, so a fresh signup must not adopt
    // a subscription from a previous, deleted account.
    if (
      user.accountStatus !== "deleted" &&
      user.subscriptionTier === "free" &&
      req.user?.email
    ) {
      try {
        // Race the Stripe reconciliation against a 12s timeout so a slow
        // Stripe API never blocks the entire status response.
        await Promise.race([
          (async () => {
            // Find ALL Stripe customers for this email (user may have multiple)
            const customers = await stripe.customers.list({
              email: req.user.email,
              limit: 5,
            });
            // No customers — nothing to reconcile. Do NOT respond here: the
            // single response is sent once by the outer flow after the race,
            // so returning early with a res.json would double-send headers.
            if (customers.data.length === 0) return;

            // Collect active subscriptions from all customers
            const allSubs = [];
            for (const c of customers.data) {
              const subs = await stripe.subscriptions.list({
                customer: c.id,
                status: "active",
                limit: 10,
              });
              allSubs.push(
                ...subs.data.map((s) => ({ ...s, _customerId: c.id })),
              );
            }
            if (allSubs.length === 0) return;

            // Pick the highest-tier subscription
            let bestSub = null;
            let bestOrder = -1;
            const TIER_ORDER = { free: 0, legacy_sower: 1, covenant_sower: 2 };

            for (const sub of allSubs) {
              const priceId = sub.items?.data?.[0]?.price?.id;
              const interval = sub.items?.data?.[0]?.price?.recurring?.interval;
              const tierId =
                (await resolveTierFromPriceId(priceId, interval)) || "free";
              const order = TIER_ORDER[tierId.replace(/_monthly$/, "")] ?? 0;
              if (order > bestOrder) {
                bestOrder = order;
                bestSub = { sub, tierId };
              }
            }

            if (bestSub) {
              const periodEnd = getSubscriptionPeriodEnd(bestSub.sub);

              await prisma.systemUser.update({
                where: { id: req.user.id },
                data: {
                  subscriptionTier: bestSub.tierId,
                  stripeCustomerId: bestSub.sub._customerId,
                  stripeSubscriptionId: bestSub.sub.id,
                  ...(periodEnd && { accessExpiresAt: periodEnd }),
                },
              });

              user = {
                ...user,
                subscriptionTier: bestSub.tierId,
                accessExpiresAt: periodEnd,
                stripeCustomerId: bestSub.sub._customerId,
                stripeSubscriptionId: bestSub.sub.id,
              };
              console.log(
                `[StripeReconciliation] Synced user ${req.user.id} → ${bestSub.tierId} (customer: ${bestSub.sub._customerId})`,
              );
            }
          })(),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Stripe reconciliation timed out")),
              12000,
            ),
          ),
        ]);
      } catch (stripeErr) {
        console.warn(
          "[StripeReconciliation] Failed to sync from Stripe:",
          stripeErr.message,
        );
      }
    }

    // Verify known paid subscriptions too. Webhooks are the primary sync
    // mechanism, but this repairs missed deliveries when the client asks for
    // status after checkout, renewal, cancellation, or a portal change.
    if (user.stripeSubscriptionId && user.subscriptionTier !== "free") {
      try {
        const retrieveSubscription = stripe.subscriptions.retrieve;
        if (typeof retrieveSubscription !== "function") {
          // Test doubles may omit reconciliation-only Stripe methods.
        } else {
          const subscription = await retrieveSubscription.call(
            stripe.subscriptions,
            user.stripeSubscriptionId,
          );
          const activeStatuses = new Set(["active", "trialing"]);

          if (!activeStatuses.has(subscription.status)) {
            // Re-subscription guard: the user may have renewed by creating a
            // NEW subscription while the DB still points at this old/cancelled
            // one. Adopt the newer active sub instead of dropping to free.
            let adopted = false;
            try {
              const customerId = user.stripeCustomerId;
              if (customerId && typeof stripe.subscriptions.list === "function") {
                const active = await stripe.subscriptions.list({
                  customer: customerId,
                  status: "active",
                  limit: 10,
                });
                const newer = active.data
                  .filter((s) => s.id !== user.stripeSubscriptionId)
                  .sort((a, b) => b.created - a.created)[0];
                if (newer) {
                  const price = newer.items?.data?.[0]?.price;
                  const newTier = await resolveTierFromPriceId(
                    price?.id,
                    price?.recurring?.interval,
                  );
                  const periodEnd = getSubscriptionPeriodEnd(newer);
                  await prisma.systemUser.update({
                    where: { id: req.user.id },
                    data: {
                      ...(newTier && { subscriptionTier: newTier }),
                      stripeSubscriptionId: newer.id,
                      ...(periodEnd && { accessExpiresAt: periodEnd }),
                    },
                  });
                  user = {
                    ...user,
                    ...(newTier && { subscriptionTier: newTier }),
                    stripeSubscriptionId: newer.id,
                    ...(periodEnd && { accessExpiresAt: periodEnd }),
                  };
                  adopted = true;
                  console.log(
                    `[StripeReconciliation] adopted newer subscription ${newer.id} for user ${req.user.id}`,
                  );
                }
              }
            } catch (adoptErr) {
              console.warn(
                "[StripeReconciliation] re-subscription adoption failed:",
                adoptErr.message,
              );
            }

            if (!adopted) {
              await prisma.systemUser.update({
                where: { id: req.user.id },
                data: {
                  subscriptionTier: "free",
                  stripeSubscriptionId: null,
                  accessExpiresAt: null,
                },
              });
              user = {
                ...user,
                subscriptionTier: "free",
                stripeSubscriptionId: null,
                accessExpiresAt: null,
              };
            }
          } else {
            const price = subscription.items?.data?.[0]?.price;
            const interval = price?.recurring?.interval;
            const resolvedTier = await resolveTierFromPriceId(
              price?.id,
              interval,
            );
            const periodEnd = getSubscriptionPeriodEnd(subscription);

            if (resolvedTier || periodEnd) {
              await prisma.systemUser.update({
                where: { id: req.user.id },
                data: {
                  ...(resolvedTier && { subscriptionTier: resolvedTier }),
                  ...(periodEnd && { accessExpiresAt: periodEnd }),
                },
              });
              user = {
                ...user,
                ...(resolvedTier && { subscriptionTier: resolvedTier }),
                ...(periodEnd && { accessExpiresAt: periodEnd }),
              };
            }
          }
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
        data: { ...user, tierMeta },
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
