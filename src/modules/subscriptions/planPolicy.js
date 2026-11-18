/** New purchases are monthly only. Historical yearly billing remains readable. */
export const MONTHLY_PLAN_CENTS = { legacy_sower: 333, covenant_sower: 777 };
export const isPublishedPlan = tier => tier.id === 'free' || (
  tier.isActive !== false && tier.interval === 'month' && tier.currency?.toLowerCase() === 'usd'
  && Math.round(Number(tier.price) * 100) === MONTHLY_PLAN_CENTS[tier.id.replace(/_monthly$/, '')]
);
