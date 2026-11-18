import { MONTHLY_PLAN_CENTS } from './planPolicy.js';

export const matchesMonthlyPrice = (price, tier) => price?.active === true && price.currency === 'usd'
  && price.unit_amount === MONTHLY_PLAN_CENTS[tier]
  && price.recurring?.interval === 'month' && price.recurring.interval_count === 1;

/** Resolve stale env/DB price IDs through the same product, never an unrelated
 * product or rounded amount. Stripe amounts are immutable; replacements have IDs. */
export async function verifiedMonthlyPrice(stripe, tier, priceId) {
  if (!priceId) return null;
  const configured = await stripe.prices.retrieve(priceId, { expand: ['product'] });
  if (matchesMonthlyPrice(configured, tier)) return configured;
  const productId = typeof configured?.product === 'string' ? configured.product : configured?.product?.id;
  if (!productId || typeof stripe.prices.list !== 'function') return null;
  const candidates = await stripe.prices.list({ product: productId, active: true, limit: 100 });
  const match = candidates.data.find(price => matchesMonthlyPrice(price, tier) &&
    (typeof price.product === 'string' ? price.product : price.product?.id) === productId);
  if (!match) return null;
  // Preserve expanded metadata from the configured product when possible.
  return { ...match, product: typeof configured.product === 'object' ? configured.product : match.product };
}
