import { verifiedMonthlyPrice } from './monthlyPrice.js';
const product = { id: 'prod_covenant', name: 'Covenant Sower', active: true };
const price = patch => ({ id: 'price_exact', active: true, unit_amount: 777, currency: 'usd', product: product.id, recurring: { interval: 'month', interval_count: 1 }, ...patch });

test('uses a verified exact configured price without a catalog scan', async () => {
  const stripe = { prices: { retrieve: jest.fn().mockResolvedValue(price({ product })), list: jest.fn() } };
  expect((await verifiedMonthlyPrice(stripe, 'covenant_sower', 'price_exact')).id).toBe('price_exact');
  expect(stripe.prices.list).not.toHaveBeenCalled();
});
test('recovers an archived $7.78 mapping using only the exact $7.77 price on that same product', async () => {
  const stripe = { prices: {
    retrieve: jest.fn().mockResolvedValue(price({ id: 'price_old', active: false, unit_amount: 778, product })),
    list: jest.fn().mockResolvedValue({ data: [price({ unit_amount: 778 }), price({ id: 'wrong_product', product: 'other' }), price({ id: 'price_777' })] }),
  } };
  const result = await verifiedMonthlyPrice(stripe, 'covenant_sower', 'price_old');
  expect(result.id).toBe('price_777');
  expect(result.product).toEqual(product);
  expect(stripe.prices.list).toHaveBeenCalledWith({ product: product.id, active: true, limit: 100 });
});
test('does not advertise or charge when no exact approved replacement exists', async () => {
  const stripe = { prices: { retrieve: jest.fn().mockResolvedValue(price({ unit_amount: 778, product })),
    list: jest.fn().mockResolvedValue({ data: [price({ unit_amount: 778 }), price({ recurring: { interval: 'year', interval_count: 1 } })] }) } };
  expect(await verifiedMonthlyPrice(stripe, 'covenant_sower', 'price_old')).toBeNull();
});
