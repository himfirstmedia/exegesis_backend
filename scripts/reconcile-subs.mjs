// One-off reconciliation: backfill stripeCustomerId / stripeSubscriptionId /
// accessExpiresAt for existing users from active Stripe subscriptions.
// Run: node scripts/reconcile-subs.mjs
import 'dotenv/config';
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { timeout: 20000 });

const FALLBACK_TIER_MAP = {
  STRIPE_LEGACY_SOWER_PRICE_ID: "legacy_sower",
  STRIPE_LEGACY_SOWER_MONTHLY_PRICE_ID: "legacy_sower_monthly",
  STRIPE_COVENANT_SOWER_PRICE_ID: "covenant_sower",
  STRIPE_COVENANT_SOWER_MONTHLY_PRICE_ID: "covenant_sower_monthly",
};

async function resolveTierFromPriceId(priceId, interval) {
  if (!priceId) return null;
  const envTier = FALLBACK_TIER_MAP[priceId];
  if (envTier) return envTier;
  const tier = await prisma.subscriptionTier.findFirst({ where: { stripePriceId: priceId } });
  if (tier) return tier.id;
  try {
    const price = await stripe.prices.retrieve(priceId, { expand: ["product"] });
    const product = price.product;
    if (product && typeof product === "object" && !product.deleted && product.metadata?.tierId) {
      return product.metadata.tierId;
    }
  } catch { /* ignore */ }
  return null;
}

async function resolveSubExpiry(sub) {
  if (sub.current_period_end) return new Date(sub.current_period_end * 1000);
  try {
    const invoiceId = typeof sub.latest_invoice === "object" ? sub.latest_invoice?.id : sub.latest_invoice;
    if (invoiceId) {
      const invoice = await stripe.invoices.retrieve(invoiceId);
      const ts = invoice.period_end || invoice.created;
      if (ts) return new Date(ts * 1000);
    }
  } catch { /* ignore */ }
  return null;
}

async function main() {
  // Gather all active Stripe subscriptions
  const subs = [];
  let hasMore = true;
  let startingAfter;
  while (hasMore) {
    const page = await stripe.subscriptions.list({
      status: "active",
      limit: 100,
      expand: ["data.customer", "data.items.data.price"],
      ...(startingAfter && { starting_after: startingAfter }),
    });
    subs.push(...page.data);
    hasMore = page.has_more;
    if (page.data.length) startingAfter = page.data[page.data.length - 1].id;
  }
  console.log(`Active Stripe subs: ${subs.length}\n`);

  // Also fetch all users that look relevant
  const users = await prisma.systemUser.findMany({
    where: { OR: [{ subscriptionTier: { not: "free" } }, { stripeCustomerId: { not: null } }] },
    select: { id: true, email: true, firstName: true, lastName: true, subscriptionTier: true, accessExpiresAt: true, stripeCustomerId: true, stripeSubscriptionId: true },
  });
  const byCustomer = new Map(users.filter(u => u.stripeCustomerId).map(u => [u.stripeCustomerId, u]));
  const byEmail = new Map(users.filter(u => u.email).map(u => [u.email.toLowerCase(), u]));

  const stats = { updated: 0, linked: 0, expirySet: 0, expiredFlag: 0, noMatch: [] };

  for (const sub of subs) {
    const customer = sub.customer;
    const customerId = typeof customer === "object" ? customer.id : customer;
    const email = typeof customer === "object" ? customer.email : null;
    const priceId = sub.items?.data?.[0]?.price?.id;
    const interval = sub.items?.data?.[0]?.price?.recurring?.interval;
    const tierId = await resolveTierFromPriceId(priceId, interval);
    const expiry = await resolveSubExpiry(sub);

    // Find DB user
    let user = byCustomer.get(customerId);
    if (!user && email && byEmail.has(email.toLowerCase())) user = byEmail.get(email.toLowerCase());
    if (!user) {
      stats.noMatch.push({ email, customerId, tierId });
      continue;
    }

    const changes = {};
    if (!user.stripeCustomerId || user.stripeCustomerId !== customerId) {
      changes.stripeCustomerId = customerId;
      stats.linked++;
    }
    if (!user.stripeSubscriptionId || user.stripeSubscriptionId !== sub.id) {
      changes.stripeSubscriptionId = sub.id;
    }
    if (tierId && user.subscriptionTier !== tierId) {
      changes.subscriptionTier = tierId;
      if (expiry) changes.accessExpiresAt = expiry;
      const previousTier = user.subscriptionTier;
      await prisma.subscriptionEvent.create({
        data: { userId: user.id, eventType: "upgraded", tier: tierId, stripeEventId: sub.id, metadata: { action: "one_off_reconcile", previousTier } },
      }).catch(() => {});
      console.log(`  [TIER] ${user.email}: ${user.subscriptionTier} -> ${tierId} (expires ${expiry?.toISOString() || "n/a"})`);
      stats.updated++;
    } else if (expiry && (!user.accessExpiresAt || Math.abs(user.accessExpiresAt.getTime() - expiry.getTime()) > 60000)) {
      changes.accessExpiresAt = expiry;
    }

    if (Object.keys(changes).length) {
      const res = await prisma.systemUser.update({ where: { id: user.id }, data: changes }).catch(e => ({ error: e.message }));
      if (res.error) {
        console.log(`  [ERR] ${user.email}: ${res.error}`);
      } else {
        if (changes.stripeSubscriptionId || changes.stripeCustomerId) {
          console.log(`  [LINK] ${user.email}: customer=${changes.stripeCustomerId || user.stripeCustomerId} sub=${changes.stripeSubscriptionId || user.stripeSubscriptionId}`);
        }
        if (changes.accessExpiresAt) {
          console.log(`  [EXPIRY] ${user.email}: set to ${changes.accessExpiresAt.toISOString()}`);
          stats.expirySet++;
        }
      }
    }
  }

  console.log("\n── Summary ─────────────────────────────");
  console.log(`Linked/updated customer IDs: ${stats.linked}`);
  console.log(`Tier changes: ${stats.updated}`);
  console.log(`Expiry backfilled: ${stats.expirySet}`);
  if (stats.noMatch.length) {
    console.log(`\nStripe subs with NO matching DB user (${stats.noMatch.length}):`);
    for (const n of stats.noMatch) console.log(`  - ${n.email || "(no email)"} | customer ${n.customerId} | tier ${n.tierId}`);
  }
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
