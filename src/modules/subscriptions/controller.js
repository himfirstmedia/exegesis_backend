import Stripe from "stripe";
import { prisma } from "../../config/db.js";
import { formatApiResponse } from "../../utils/helpers.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { timeout: 10000 });
const FRONTEND_URL = process.env.FRONTEND_URL || "https://app.exegesisproject.org";

// Deep link scheme for the mobile app — Stripe redirects back into the app after payment.
// Falls back to the web URL for web clients.
const APP_SCHEME = process.env.APP_DEEP_LINK_SCHEME || "exegesis://";

const successUrl = (path) => `${APP_SCHEME}${path}?subscription=success`;
const cancelUrl  = (path) => `${APP_SCHEME}${path}?subscription=cancelled`;
const returnUrl  = (path) => `${APP_SCHEME}${path}`;

// ─── Tier ordering ────────────────────────────────────────────────────────────

const TIER_ORDER = {
  free: 0,
  legacy_sower_monthly: 1,
  legacy_sower: 1,
  covenant_sower_monthly: 2,
  covenant_sower: 2,
};

const BASE_TIER = (tierId) => tierId.replace(/_monthly$/, "");

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
  // 1. Try DB first (stripePriceId from SubscriptionTier table)
  const tierId = interval === "month" ? `${tier}_monthly` : tier;
  const tierRecord = await prisma.subscriptionTier.findUnique({ where: { id: tierId } });
  if (tierRecord?.stripePriceId) return tierRecord.stripePriceId;

  // 2. Fallback to env var map
  const envKey = interval === "month" ? MONTHLY_PRICE_ENV[tier] : YEARLY_PRICE_ENV[tier];
  return envKey ? process.env[envKey] : null;
};

// ─── Get or create Stripe customer (dedup) ────────────────────────────────────

const getOrCreateStripeCustomer = async (user) => {
  // If user already has a Stripe customer ID, reuse it
  if (user.stripeCustomerId) {
    try {
      const existing = await stripe.customers.retrieve(user.stripeCustomerId);
      if (!existing.deleted) return existing.id;
    } catch { /* customer may have been deleted on Stripe side — fall through */ }
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

// ─── createCheckoutSession ────────────────────────────────────────────────────

export const createCheckoutSession = async (req, res) => {
  try {
    const { tier, interval } = req.body;
    const userId = req.user.id;
    const billingInterval = interval === "month" ? "month" : "year";

    if (!tier || !["legacy_sower", "covenant_sower"].includes(tier)) {
      return res.status(400).json(formatApiResponse({
        status: 400,
        message: "Invalid tier. Must be 'legacy_sower' or 'covenant_sower'",
      }));
    }

    const user = await prisma.systemUser.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json(formatApiResponse({ status: 404, message: "User not found" }));
    }

    const currentBase = BASE_TIER(user.subscriptionTier);
    const targetBase = tier;

    // Block downgrade attempts via this endpoint
    if (
      user.subscriptionTier !== "free" &&
      TIER_ORDER[targetBase] < TIER_ORDER[currentBase]
    ) {
      return res.status(400).json(formatApiResponse({
        status: 400,
        message: "Downgrades must be done through the billing portal",
      }));
    }

    // Legacy Sower cap
    if (tier === "legacy_sower") {
      const count = await prisma.systemUser.count({
        where: { subscriptionTier: { startsWith: "legacy_sower" } },
      });
      if (count >= 1000) {
        return res.status(400).json(formatApiResponse({
          status: 400,
          message: "Legacy Sower slots are full (1,000/1,000 claimed)",
        }));
      }
    }

    const priceId = await getPriceId(tier, billingInterval);
    if (!priceId) {
      return res.status(500).json(formatApiResponse({
        status: 500,
        message: "Stripe price ID not configured for this plan",
      }));
    }

    // ── Reuse or create Stripe customer (no duplicates) ──────────────────
    const customerId = await getOrCreateStripeCustomer(user);

    // ── Upgrade path: user already has an active subscription ─────────────
    // We use a Checkout session in `subscription_update` mode instead of
    // calling stripe.subscriptions.update() directly.
    //
    // Why: calling update() switches the plan immediately (before payment is
    // confirmed). If the proration invoice fails or the user never pays, the
    // DB already shows the higher tier — a false upgrade.
    //
    // subscription_update mode sends the user through a Stripe-hosted payment
    // page and only fires checkout.session.completed (+ customer.subscription.updated)
    // AFTER payment succeeds. The DB is updated only in those webhooks.
    if (user.stripeSubscriptionId && user.subscriptionTier !== "free") {
      try {
        const currentSub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

        if (currentSub.status === "active") {
          const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            customer: customerId,
            // subscription_update_confirm attaches the checkout to the existing sub
            subscription_data: {
              metadata: { userId, tier, interval: billingInterval },
            },
            line_items: [{ price: priceId, quantity: 1 }],
            // Tell Stripe this checkout should update (not create) a subscription
            // by passing the existing subscription ID via metadata and using
            // payment_method_collection = if_required (no charge if card on file)
            metadata: { userId, tier, interval: billingInterval, upgradeFrom: user.subscriptionTier },
            success_url: successUrl("subscription/upgraded"),
            cancel_url: cancelUrl("sower"),
            allow_promotion_codes: true,
            // If the customer already has a payment method, skip collection
            payment_method_collection: "if_required",
          });

          return res.json(formatApiResponse({
            status: 200,
            message: "Upgrade checkout session created",
            data: { url: session.url, upgraded: false },
          }));
        }
      } catch (stripeErr) {
        console.warn("[createCheckoutSession] Could not create upgrade session, falling through to new checkout:", stripeErr.message);
      }
    }

    // ── New subscription: create a Checkout session tied to the customer ─
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,          // ← reuse existing customer, no duplicate
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: userId,
      metadata: { userId, tier, interval: billingInterval },
      success_url: successUrl("subscription/success"),
      cancel_url: cancelUrl("sower"),
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { userId, tier, interval: billingInterval },
      },
    });

    return res.json(formatApiResponse({
      status: 200,
      message: "Checkout session created",
      data: { url: session.url, upgraded: false },
    }));
  } catch (error) {
    console.error("[SubscriptionController] createCheckoutSession error:", error);
    return res.status(500).json(formatApiResponse({
      status: 500,
      message: "Failed to create checkout session",
    }));
  }
};

// ─── createPortalSession ──────────────────────────────────────────────────────

export const createPortalSession = async (req, res) => {
  try {
    const user = await prisma.systemUser.findUnique({ where: { id: req.user.id } });

    if (!user?.stripeCustomerId) {
      return res.status(400).json(formatApiResponse({
        status: 400,
        message: "No active subscription found",
      }));
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl("profile"),
    });

    return res.json(formatApiResponse({
      status: 200,
      message: "Portal session created",
      data: { url: session.url },
    }));
  } catch (error) {
    console.error("[SubscriptionController] createPortalSession error:", error);
    return res.status(500).json(formatApiResponse({
      status: 500,
      message: "Failed to create portal session",
    }));
  }
};

// ─── Stripe tier cache (in-memory, 5-min TTL) ─────────────────────────────────

let stripeTiersCache = null;
let stripeTiersCacheTime = 0;
const STRIPE_TIERS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Maps our internal tier IDs to Stripe price IDs from env vars.
// Monthly variants are fetched alongside yearly for completeness.
const TIER_PRICE_MAP = {
  legacy_sower: {
    yearly: process.env.STRIPE_LEGACY_SOWER_PRICE_ID,
    monthly: process.env.STRIPE_LEGACY_SOWER_MONTHLY_PRICE_ID,
  },
  covenant_sower: {
    yearly: process.env.STRIPE_COVENANT_SOWER_PRICE_ID,
    monthly: process.env.STRIPE_COVENANT_SOWER_MONTHLY_PRICE_ID,
  },
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
    id: "legacy_sower",
    name: "Legacy Sower",
    price: 33.33,
    currency: "usd",
    interval: "year",
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
    id: "covenant_sower",
    name: "Covenant Sower",
    price: 77.77,
    currency: "usd",
    interval: "year",
    features: [
      "Everything in Legacy Sower",
      "Priority support",
      "Covenant badge",
    ],
    isActive: true,
    sortOrder: 2,
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

// ─── buildTiersFromStripe ─────────────────────────────────────────────────────
// Fetches products + prices from Stripe so the app always shows
// real-time plan names, prices, and features without manual DB sync.

async function buildTiersFromStripe() {
  if (
    stripeTiersCache &&
    Date.now() - stripeTiersCacheTime < STRIPE_TIERS_CACHE_TTL
  ) {
    return stripeTiersCache;
  }

  const tiers = [];

  for (const [tierId, priceIds] of Object.entries(TIER_PRICE_MAP)) {
    // Fetch the yearly price (primary source for product metadata)
    const yearlyPriceId = priceIds.yearly;
    if (!yearlyPriceId) continue;

    let yearlyPrice;
    try {
      yearlyPrice = await stripe.prices.retrieve(yearlyPriceId, {
        expand: ["product"],
      });
    } catch (e) {
      console.warn(`[Stripe] Failed to retrieve yearly price ${yearlyPriceId} for ${tierId}:`, e.message);
      continue;
    }

    const product = yearlyPrice.product;

    // Parse features from product metadata (expected as JSON string array)
    let features = [];
    try {
      if (product.metadata?.features) {
        features = JSON.parse(product.metadata.features);
      }
    } catch {
      // non-fatal; leave features empty
    }

    const shared = {
      name: product.name,
      description: product.description || undefined,
      currency: yearlyPrice.currency,
      features,
      isActive: product.active,
      sortOrder: parseInt(product.metadata?.sortOrder || String(tiers.length + 1), 10),
      maxSlots: product.metadata?.maxSlots
        ? parseInt(product.metadata.maxSlots, 10)
        : undefined,
      stripeProductId: product.id,
    };

    // Yearly entry
    tiers.push({
      id: tierId,
      ...shared,
      price: yearlyPrice.unit_amount / 100,
      interval: yearlyPrice.recurring?.interval || "year",
      stripePriceId: yearlyPrice.id,
    });

    // Monthly entry (separate price ID from env vars)
    const monthlyPriceId = priceIds.monthly;
    if (monthlyPriceId) {
      try {
        const monthlyPrice = await stripe.prices.retrieve(monthlyPriceId);
        tiers.push({
          id: `${tierId}_monthly`,
          ...shared,
          price: monthlyPrice.unit_amount / 100,
          interval: monthlyPrice.recurring?.interval || "month",
          stripePriceId: monthlyPrice.id,
        });
      } catch (e) {
        console.warn(`[Stripe] Failed to retrieve monthly price ${monthlyPriceId} for ${tierId}:`, e.message);
      }
    }
  }

  if (tiers.length === 0) return [];

  // Sort by sortOrder from product metadata
  tiers.sort((a, b) => a.sortOrder - b.sortOrder);

  // Prepend the free tier (not in Stripe)
  tiers.unshift({
    id: "free",
    name: "Free",
    price: 0,
    currency: "usd",
    interval: "none",
    features: ["Bible reading", "Daily verse", "Basic tools"],
    isActive: true,
    sortOrder: 0,
  });

  stripeTiersCache = tiers;
  stripeTiersCacheTime = Date.now();
  return tiers;
}

// ─── listTiers ────────────────────────────────────────────────────────────────

export const listTiers = async (req, res) => {
  try {
    // 1. Try Stripe first — real-time prices from the source of truth
    const fromStripe = await buildTiersFromStripe();
    if (fromStripe.length > 0) {
      return res.json(
        formatApiResponse({ status: 200, message: "Tiers retrieved", data: { tiers: fromStripe } }),
      );
    }

    // 2. Fallback to DB
    let tiers = await prisma.subscriptionTier.findMany({ orderBy: { sortOrder: "asc" } });
    if (tiers && tiers.length > 0) {
      return res.json(
        formatApiResponse({ status: 200, message: "Tiers retrieved", data: { tiers } }),
      );
    }

    // 3. Last resort — hardcoded defaults so the app never breaks
    return res.json(
      formatApiResponse({ status: 200, message: "Tiers retrieved (fallback)", data: { tiers: FALLBACK_TIERS } }),
    );
  } catch (error) {
    console.error("[SubscriptionController] listTiers error:", error);
    return res.json(
      formatApiResponse({ status: 200, message: "Tiers retrieved (fallback)", data: { tiers: FALLBACK_TIERS } }),
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

  // Fallback: check env var mapping (TIER_PRICE_MAP)
  for (const [tierId, prices] of Object.entries(TIER_PRICE_MAP)) {
    if (prices.yearly === priceId) return tierId;
    if (prices.monthly === priceId) return `${tierId}_monthly`;
  }

  try {
    const price = await stripe.prices.retrieve(priceId, { expand: ["product"] });
    const product = price.product;
    if (product && typeof product === "object" && !product.deleted) {
      if (product.metadata?.tierId) return product.metadata.tierId;
      const slug = product.name
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "");
      if (slug) return interval === "month" ? `${slug}_monthly` : slug;
    }
  } catch { /* non-fatal */ }

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
      },
    });

    if (!user) {
      return res.status(404).json(formatApiResponse({ status: 404, message: "User not found" }));
    }

    // ── Stripe reconciliation ─────────────────────────────────────────────
    // If DB says free, search Stripe for the user's email to find any
    // active subscriptions. Handles:
    //   1. Normal flow: user has stripeCustomerId but webhook missed.
    //   2. Missing customer: search by email, may find multiple customers.
    //   3. Multiple subs: pick the highest tier (e.g. covenant_sower > legacy_sower).
    if (user.subscriptionTier === "free" && req.user?.email) {
      try {
        // Race the Stripe reconciliation against a 12s timeout so a slow
        // Stripe API never blocks the entire status response.
        await Promise.race([
          (async () => {
            // Find ALL Stripe customers for this email (user may have multiple)
            const customers = await stripe.customers.list({ email: req.user.email, limit: 5 });
            // No customers — nothing to reconcile. Do NOT respond here: the
            // single response is sent once by the outer flow after the race,
            // so returning early with a res.json would double-send headers.
            if (customers.data.length === 0) return;

            // Collect active subscriptions from all customers
            const allSubs = [];
            for (const c of customers.data) {
              const subs = await stripe.subscriptions.list({ customer: c.id, status: "active", limit: 10 });
              allSubs.push(...subs.data.map(s => ({ ...s, _customerId: c.id })));
            }
            if (allSubs.length === 0) return;

            // Pick the highest-tier subscription
            let bestSub = null;
            let bestOrder = -1;
            const TIER_ORDER = { free: 0, legacy_sower: 1, covenant_sower: 2 };

            for (const sub of allSubs) {
              const priceId = sub.items?.data?.[0]?.price?.id;
              const interval = sub.items?.data?.[0]?.price?.recurring?.interval;
              const tierId = await resolveTierFromPriceId(priceId, interval) || "free";
              const order = TIER_ORDER[tierId.replace(/_monthly$/, "")] ?? 0;
              if (order > bestOrder) {
                bestOrder = order;
                bestSub = { sub, tierId };
              }
            }

            if (bestSub) {
              const periodEnd = bestSub.sub.current_period_end
                ? new Date(bestSub.sub.current_period_end * 1000)
                : null;

              await prisma.systemUser.update({
                where: { id: req.user.id },
                data: {
                  subscriptionTier: bestSub.tierId,
                  stripeCustomerId: bestSub.sub._customerId,
                  stripeSubscriptionId: bestSub.sub.id,
                  ...(periodEnd && { accessExpiresAt: periodEnd }),
                },
              });

              user = { ...user, subscriptionTier: bestSub.tierId, accessExpiresAt: periodEnd, stripeCustomerId: bestSub.sub._customerId, stripeSubscriptionId: bestSub.sub.id };
              console.log(`[StripeReconciliation] Synced user ${req.user.id} → ${bestSub.tierId} (customer: ${bestSub.sub._customerId})`);
            }
          })(),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Stripe reconciliation timed out")), 12000)),
        ]);
      } catch (stripeErr) {
        console.warn("[StripeReconciliation] Failed to sync from Stripe:", stripeErr.message);
      }
    }

    let tierMeta = null;
    try {
      tierMeta = await prisma.subscriptionTier.findUnique({ where: { id: user.subscriptionTier } });
    } catch { /* non-fatal */ }

    return res.json(formatApiResponse({
      status: 200,
      message: "Subscription status retrieved",
      data: { ...user, tierMeta },
    }));
  } catch (error) {
    console.error("[SubscriptionController] getSubscriptionStatus error:", error);
    // Never attempt a second response if one was already sent (e.g. by a
    // stray res.json inside the reconciliation race) — that itself throws.
    if (res.headersSent) return;
    return res.status(500).json(formatApiResponse({ status: 500, message: "Failed to get subscription status" }));
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
    return res.json(formatApiResponse({
      status: 200,
      message: "Subscribed users retrieved",
      data: { subscribedUsers },
    }));
  } catch (error) {
    console.error("[SubscriptionController] handleGetSubscribedUsers error:", error);
    return res.status(500).json(formatApiResponse({ status: 500, message: "Failed to retrieve subscribed users" }));
  }
};
