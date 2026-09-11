import Stripe from "stripe";
import { prisma } from "../../config/db.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TIER_ORDER = {
  free: 0,
  legacy_sower_monthly: 1,
  legacy_sower: 1,
  covenant_sower_monthly: 2,
  covenant_sower: 2,
};

const getSubscriptionPeriodEnd = (subscription) => {
  const periodEnd =
    subscription.current_period_end ??
    subscription.items?.data?.[0]?.current_period_end;
  return periodEnd != null && isFinite(periodEnd)
    ? new Date(periodEnd * 1000)
    : null;
};

const getNextLegacySlot = async () => {
  const last = await prisma.systemUser.findFirst({
    where: { legacySowerSlot: { not: null } },
    orderBy: { legacySowerSlot: "desc" },
    select: { legacySowerSlot: true },
  });
  return (last?.legacySowerSlot ?? 0) + 1;
};

const logEvent = async (
  userId,
  eventType,
  tier,
  stripeEventId,
  metadata = {},
) => {
  try {
    await prisma.subscriptionEvent.create({
      data: { userId, eventType, tier, stripeEventId, metadata },
    });
  } catch (e) {
    console.warn("[StripeWebhook] logEvent failed:", e.message);
  }
};

/**
 * Resolve a Stripe price ID → internal tier ID.
 * 1. Check stripePriceId in SubscriptionTier table.
 * 2. Retrieve the Price from Stripe and check product.metadata.tierId.
 * 3. Slugify product name.
 */
const resolveTierFromPriceId = async (priceId, interval) => {
  if (!priceId) return null;

  const tier = await prisma.subscriptionTier.findFirst({
    where: { stripePriceId: priceId },
  });
  if (tier) return tier.id;

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

// ─── Webhook handler ──────────────────────────────────────────────────────────

export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error(
      "[StripeWebhook] Signature verification failed:",
      err.message,
    );
    return res.status(400).json({ error: "Invalid signature" });
  }

  const data = event.data.object;

  try {
    // Stripe retries deliveries. Ignore an event that was already applied so
    // renewals, slots, and subscription history are not processed twice.
    const alreadyProcessed = await prisma.subscriptionEvent.findFirst({
      where: { stripeEventId: event.id },
      select: { id: true },
    });
    if (alreadyProcessed) return res.json({ received: true, duplicate: true });

    switch (event.type) {
      // ── New checkout / upgrade checkout completed ────────────────────────
      case "checkout.session.completed": {
        const meta = data.metadata ?? {};
        const userId = meta.userId;
        const tier = meta.tier;
        const billingInterval = meta.interval === "month" ? "month" : "year";
        const upgradeFrom = meta.upgradeFrom ?? null; // set when this was an upgrade checkout
        const customerId = data.customer;
        const newSubscriptionId = data.subscription;

        if (!userId || !tier) {
          console.warn(
            "[StripeWebhook] checkout.session.completed: missing userId or tier in metadata",
          );
          break;
        }

        const user = await prisma.systemUser.findUnique({
          where: { id: userId },
        });
        if (!user) {
          console.warn(
            `[StripeWebhook] checkout.session.completed: user not found: ${userId}`,
          );
          break;
        }

        const newTierId =
          billingInterval === "month" ? `${tier}_monthly` : tier;
        const currentOrder = TIER_ORDER[user.subscriptionTier] ?? 0;
        const newOrder = TIER_ORDER[newTierId] ?? 0;

        // Only apply if this is an upgrade or new subscription
        if (newOrder < currentOrder) {
          console.log(
            `[StripeWebhook] checkout.session.completed: ignoring downgrade for user ${userId}`,
          );
          break;
        }

        // Fetch new subscription for accurate period_end
        let periodEnd = null;
        try {
          const sub = await stripe.subscriptions.retrieve(newSubscriptionId);
          periodEnd = getSubscriptionPeriodEnd(sub);
        } catch {
          /* fall back */
        }

        if (!periodEnd) {
          periodEnd =
            billingInterval === "month"
              ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        }

        // If this was an upgrade checkout: cancel the previous subscription at period end
        // so the user isn't double-charged. Do this before updating the DB.
        const oldSubscriptionId = user.stripeSubscriptionId;
        if (
          oldSubscriptionId &&
          oldSubscriptionId !== newSubscriptionId &&
          !upgradeFrom
        ) {
          try {
            await stripe.subscriptions.cancel(newSubscriptionId, {
              prorate: false,
            });
          } catch (cancelErr) {
            console.warn(
              `[StripeWebhook] Could not cancel duplicate subscription ${newSubscriptionId}:`,
              cancelErr.message,
            );
          }

          await logEvent(userId, "cancelled", user.subscriptionTier, event.id, {
            duplicateSubscriptionId: newSubscriptionId,
            preservedSubscriptionId: oldSubscriptionId,
          });
          console.warn(
            `[StripeWebhook] Cancelled duplicate subscription ${newSubscriptionId} for user ${userId}`,
          );
          break;
        }

        if (oldSubscriptionId && oldSubscriptionId !== newSubscriptionId) {
          try {
            await stripe.subscriptions.cancel(oldSubscriptionId, {
              prorate: true, // credit unused time back
            });
            console.log(
              `[StripeWebhook] Cancelled old subscription ${oldSubscriptionId} after upgrade`,
            );
          } catch (cancelErr) {
            // Non-fatal: old sub may already be cancelled or in a terminal state
            console.warn(
              `[StripeWebhook] Could not cancel old subscription ${oldSubscriptionId}:`,
              cancelErr.message,
            );
          }
        }

        // Legacy Sower slot — assign only once
        let legacySowerSlot = user.legacySowerSlot;
        if (newTierId.startsWith("legacy_sower") && !legacySowerSlot) {
          legacySowerSlot = await getNextLegacySlot();
        }

        await prisma.systemUser.update({
          where: { id: userId },
          data: {
            subscriptionTier: newTierId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: newSubscriptionId,
            accessExpiresAt: periodEnd,
            ...(legacySowerSlot !== user.legacySowerSlot && {
              legacySowerSlot,
            }),
          },
        });

        const eventType =
          user.subscriptionTier === "free" ? "created" : "upgraded";
        await logEvent(userId, eventType, newTierId, event.id, {
          previousTier: user.subscriptionTier,
          billingInterval,
          customerId,
          upgradeFrom,
          cancelledOldSub: upgradeFrom ? oldSubscriptionId : null,
        });

        console.log(
          `[StripeWebhook] ${eventType}: user ${userId} → ${newTierId} (${billingInterval})`,
        );
        break;
      }

      // ── Subscription upgraded/switched via portal or API ─────────────────
      case "customer.subscription.updated": {
        const subId = data.id;

        // Find user by subscriptionId or customerId
        let user = await prisma.systemUser.findUnique({
          where: { stripeSubscriptionId: subId },
        });
        if (!user && data.customer) {
          user = await prisma.systemUser.findFirst({
            where: { stripeCustomerId: String(data.customer) },
          });
        }

        if (!user) {
          console.warn(
            `[StripeWebhook] customer.subscription.updated: no user found for sub ${subId}`,
          );
          break;
        }

        // Resolve tier from price ID (handles all seeded tiers)
        const priceId = data.items?.data?.[0]?.price?.id;
        const interval = data.items?.data?.[0]?.price?.recurring?.interval;
        const newTierId = await resolveTierFromPriceId(priceId, interval);

        if (!newTierId) {
          console.warn(
            `[StripeWebhook] customer.subscription.updated: could not resolve tier from priceId ${priceId}`,
          );
          break;
        }

        const periodEnd = getSubscriptionPeriodEnd(data);

        const currentOrder = TIER_ORDER[user.subscriptionTier] ?? 0;
        const newOrder = TIER_ORDER[newTierId] ?? 0;
        const eventType = newOrder >= currentOrder ? "upgraded" : "downgraded";

        // Assign legacy slot if upgrading into legacy tier and not already set
        let legacySowerSlot = user.legacySowerSlot;
        if (newTierId.startsWith("legacy_sower") && !legacySowerSlot) {
          legacySowerSlot = await getNextLegacySlot();
        }

        await prisma.systemUser.update({
          where: { id: user.id },
          data: {
            subscriptionTier: newTierId,
            stripeSubscriptionId: subId,
            ...(periodEnd && { accessExpiresAt: periodEnd }),
            ...(legacySowerSlot !== user.legacySowerSlot && {
              legacySowerSlot,
            }),
          },
        });

        await logEvent(user.id, eventType, newTierId, event.id, {
          previousTier: user.subscriptionTier,
          priceId,
          interval,
        });

        console.log(
          `[StripeWebhook] ${eventType}: user ${user.id} → ${newTierId}`,
        );
        break;
      }

      // ── Payment succeeded (renewal) ───────────────────────────────────────
      case "invoice.payment_succeeded": {
        const subscriptionId = data.subscription;
        if (!subscriptionId) break;

        let user = await prisma.systemUser.findUnique({
          where: { stripeSubscriptionId: subscriptionId },
        });

        // Re-subscription: the user renewed by creating a NEW subscription
        // while the DB still points at the old one. Fall back to the customer
        // so the renewal is recorded and the DB adopts the new sub ID.
        if (!user) {
          try {
            const sub = await stripe.subscriptions.retrieve(subscriptionId);
            const customerId =
              typeof sub.customer === "object" ? sub.customer?.id : sub.customer;
            if (customerId) {
              user = await prisma.systemUser.findFirst({
                where: { stripeCustomerId: customerId },
              });
              if (user && user.stripeSubscriptionId !== subscriptionId) {
                await prisma.systemUser.update({
                  where: { id: user.id },
                  data: {
                    stripeCustomerId: customerId,
                    stripeSubscriptionId: subscriptionId,
                  },
                });
                user = { ...user, stripeCustomerId: customerId, stripeSubscriptionId: subscriptionId };
                console.log(
                  `[StripeWebhook] adopted new subscription ${subscriptionId} for user ${user.id}`,
                );
              }
            }
          } catch (e) {
            console.warn(
              "[StripeWebhook] invoice.payment_succeeded: customer fallback failed:",
              e.message,
            );
          }
        }

        if (user) {
          // Get accurate period_end from the subscription itself
          try {
            const sub = await stripe.subscriptions.retrieve(subscriptionId);
            const periodEnd = getSubscriptionPeriodEnd(sub);
            if (!periodEnd)
              throw new Error("Stripe subscription has no period end");
            await prisma.systemUser.update({
              where: { id: user.id },
              data: { accessExpiresAt: periodEnd },
            });
            await logEvent(
              user.id,
              "renewed",
              user.subscriptionTier,
              event.id,
              {
                periodEnd: periodEnd.toISOString(),
              },
            );
            console.log(
              `[StripeWebhook] renewed: user ${user.id} until ${periodEnd.toISOString()}`,
            );
          } catch (e) {
            console.warn(
              "[StripeWebhook] invoice.payment_succeeded: could not fetch subscription:",
              e.message,
            );
          }
        }
        break;
      }

      // ── Subscription cancelled ─────────────────────────────────────────────
      case "customer.subscription.deleted": {
        const subId = data.id;
        let user = await prisma.systemUser.findUnique({
          where: { stripeSubscriptionId: subId },
        });
        if (!user && data.customer) {
          user = await prisma.systemUser.findFirst({
            where: { stripeCustomerId: String(data.customer) },
          });
        }

        if (user) {
          await prisma.systemUser.update({
            where: { id: user.id },
            data: {
              subscriptionTier: "free",
              stripeSubscriptionId: null,
              accessExpiresAt: null,
            },
          });
          await logEvent(user.id, "cancelled", "free", event.id, {
            previousTier: user.subscriptionTier,
          });
          console.log(`[StripeWebhook] cancelled: user ${user.id} → free`);
        }
        break;
      }

      default:
        // Intentionally ignore unhandled event types
        break;
    }
  } catch (error) {
    console.error("[StripeWebhook] Error processing event:", error);
    // Return a failure so Stripe retries transient database/API failures.
    // Event processing is idempotent because completed event IDs are checked
    // before the switch above.
    return res.status(500).json({ error: "Webhook processing failed" });
  }

  return res.json({ received: true });
};
