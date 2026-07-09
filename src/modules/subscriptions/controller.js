import Stripe from "stripe";
import { prisma } from "../../config/db.js";
import { formatApiResponse } from "../../utils/helpers.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
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

// ─── listTiers ────────────────────────────────────────────────────────────────

export const listTiers = async (req, res) => {
  try {
    const tiers = await prisma.subscriptionTier.findMany({ orderBy: { sortOrder: "asc" } });
    return res.json(formatApiResponse({ status: 200, message: "Tiers retrieved", data: { tiers } }));
  } catch (error) {
    console.error("[SubscriptionController] listTiers error:", error);
    return res.status(500).json(formatApiResponse({ status: 500, message: "Failed to retrieve tiers" }));
  }
};

// ─── getSubscriptionStatus ────────────────────────────────────────────────────

export const getSubscriptionStatus = async (req, res) => {
  try {
    const user = await prisma.systemUser.findUnique({
      where: { id: req.user.id },
      select: {
        subscriptionTier: true,
        accessExpiresAt: true,
        stripeCustomerId: true,
        legacySowerSlot: true,
      },
    });

    if (!user) {
      return res.status(404).json(formatApiResponse({ status: 404, message: "User not found" }));
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
