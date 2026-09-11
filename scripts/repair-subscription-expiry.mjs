// One-time repair: adopt the newest active Stripe subscription for a user and
// set accessExpiresAt from the subscription's real period end (item-level on
// basil API). Usage:
//   node --env-file=.env scripts/repair-subscription-expiry.mjs <email>
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const email = process.argv[2];
if (!email) {
  console.error("usage: node repair-subscription-expiry.mjs <email>");
  process.exit(2);
}

const user = await prisma.systemUser.findFirst({ where: { email } });
if (!user) {
  console.error("user not found:", email);
  process.exit(1);
}

console.log("before:", {
  tier: user.subscriptionTier,
  accessExpiresAt: user.accessExpiresAt?.toISOString() ?? null,
  subId: user.stripeSubscriptionId,
});

const customerId = user.stripeCustomerId;
if (!customerId) {
  console.error("user has no stripeCustomerId");
  process.exit(1);
}

const subs = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 10 });
if (!subs.data.length) {
  console.error("no active Stripe subscriptions for customer", customerId);
  process.exit(1);
}
subs.data.sort((a, b) => b.created - a.created);
const newest = subs.data[0];
const periodEnd =
  newest.current_period_end ?? newest.items?.data?.[0]?.current_period_end;
const newExpiry = periodEnd != null && isFinite(periodEnd) ? new Date(periodEnd * 1000) : null;
if (!newExpiry) {
  console.error("newest sub has no period end:", newest.id);
  process.exit(1);
}
if (subs.data.length > 1) {
  console.log(`⚠ ${subs.data.length} active subs on customer; adopting newest: ${newest.id}`);
  console.log("  (older ones left untouched — review/cancel in Stripe billing to avoid double charges)");
}

const previousExpiry = user.accessExpiresAt?.toISOString() ?? null;
await prisma.systemUser.update({
  where: { id: user.id },
  data: {
    stripeCustomerId: customerId,
    stripeSubscriptionId: newest.id,
    accessExpiresAt: newExpiry,
  },
});
await prisma.subscriptionEvent.create({
  data: {
    userId: user.id,
    eventType: "renewed",
    tier: user.subscriptionTier,
    stripeEventId: newest.id,
    metadata: {
      action: "expiry_repair",
      previousExpiry,
      newExpiry: newExpiry.toISOString(),
      adoptedSubscription: newest.id,
    },
  },
});

console.log("after:", {
  tier: user.subscriptionTier,
  accessExpiresAt: newExpiry.toISOString(),
  subId: newest.id,
  valid: newExpiry > new Date() ? "yes" : "NO",
});
await prisma.$disconnect();
