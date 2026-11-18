/** Explicit opt-in. Stripe TEST objects + disposable local DB only; no app workers. */
import { config } from 'dotenv';
import Stripe from 'stripe';
import { randomUUID } from 'node:crypto';
config({ quiet: true });
if (!process.argv.includes('--run')) throw new Error('Pass --run to create temporary Stripe test objects.');
const database = new URL(process.env.E2E_DATABASE_URL || '');
if (!['localhost', '127.0.0.1'].includes(database.hostname) || !database.pathname.endsWith('_e2e')) {
  throw new Error('E2E_DATABASE_URL must be a disposable localhost *_e2e database.');
}
process.env.DATABASE_URL = database.toString();
process.env.NODE_ENV = 'test';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { timeout: 15000 });
const { prisma } = await import('../src/config/db.js');
const { getSubscriptionStatus } = await import('../src/modules/subscriptions/controller.js');
const userId = randomUUID();
let customer, subscription;
let failed = false;
const check = (name, pass) => { if (!pass) throw new Error(name); console.log(`PASS ${name}`); };
async function status() {
  const res = { headersSent: false, status() { return this; }, json(body) { this.body = body; this.headersSent = true; return this; } };
  await getSubscriptionStatus({ user: { id: userId } }, res);
  check('status API responds once with 200', res.body?.returnCode === 200);
  return res.body.returnData;
}
try {
  const price = await stripe.prices.retrieve(process.env.STRIPE_COVENANT_SOWER_MONTHLY_PRICE_ID);
  check('Stripe test-mode exact $7.77 monthly price', !price.livemode && price.active && price.unit_amount === 777 && price.currency === 'usd' && price.recurring?.interval === 'month');
  await prisma.subscriptionTier.upsert({ where: { id: 'covenant_sower_monthly' },
    create: { id: 'covenant_sower_monthly', name: 'Covenant Sower Monthly E2E', price: 7.77, interval: 'month', stripePriceId: price.id },
    update: { stripePriceId: price.id, price: 7.77, interval: 'month' } });
  customer = await stripe.customers.create({ name: 'Exegesis disposable billing verification', metadata: { purpose: 'exegesis-monthly-cancellation-e2e', disposableUserId: userId } });
  subscription = await stripe.subscriptions.create({ customer: customer.id, items: [{ price: price.id }], trial_period_days: 2,
    trial_settings: { end_behavior: { missing_payment_method: 'cancel' } }, metadata: { purpose: 'exegesis-monthly-cancellation-e2e' } });
  await prisma.systemUser.create({ data: { id: userId, email: `billing-e2e-${userId}@example.invalid`, username: `billing-e2e-${userId}`,
    password: 'not-a-login-hash', firstName: 'Billing test', lastName: '', phoneNumber: '', gender: 'Not specified',
    subscriptionTier: 'covenant_sower_monthly', stripeCustomerId: customer.id, stripeSubscriptionId: subscription.id } });
  let result = await status();
  check('trial subscription and database agree on paid tier', result.subscriptionTier === 'covenant_sower_monthly' && !!result.accessExpiresAt);
  await stripe.subscriptions.update(subscription.id, { cancel_at_period_end: true });
  result = await status();
  check('scheduled cancellation preserves access until period end', result.subscriptionTier === 'covenant_sower_monthly' && !!result.accessExpiresAt);
  await stripe.subscriptions.cancel(subscription.id);
  result = await status();
  check('immediate cancellation removes API access', result.subscriptionTier === 'free' && result.stripeSubscriptionId === null && result.accessExpiresAt === null);
  const saved = await prisma.systemUser.findUnique({ where: { id: userId } });
  check('database matches canceled Stripe subscription', saved.subscriptionTier === 'free' && saved.stripeSubscriptionId === null);
} catch (error) { console.error('FAIL', error.message); failed = true; }
finally {
  try {
    if (subscription) {
      const current = await stripe.subscriptions.retrieve(subscription.id);
      if (current.status !== 'canceled') await stripe.subscriptions.cancel(subscription.id);
    }
    if (customer) await stripe.customers.del(customer.id);
    await prisma.systemUser.deleteMany({ where: { id: userId } });
    console.log('Temporary Stripe customer/subscription and disposable DB user cleaned up.');
  } catch (error) { console.error('Cleanup requires review:', error.message); failed = true; }
  await prisma.$disconnect();
  process.exit(failed ? 1 : 0);
}
