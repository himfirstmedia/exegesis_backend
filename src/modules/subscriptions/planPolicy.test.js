import { isPublishedPlan, MONTHLY_PLAN_CENTS } from './planPolicy.js';
test('publishes only free and exact USD monthly offers', () => {
  expect(MONTHLY_PLAN_CENTS).toEqual({ legacy_sower: 333, covenant_sower: 777 });
  expect(isPublishedPlan({ id: 'free', price: 0 })).toBe(true);
  const tier = { id: 'covenant_sower_monthly', price: 7.77, currency: 'usd', interval: 'month' };
  expect(isPublishedPlan(tier)).toBe(true);
  expect(isPublishedPlan({ ...tier, price: 7.78 })).toBe(false);
  expect(isPublishedPlan({ ...tier, interval: 'year' })).toBe(false);
  expect(isPublishedPlan({ ...tier, isActive: false })).toBe(false);
});
