jest.mock('../config/db.js', () => ({ prisma: { systemUser: { findUnique: jest.fn() } } }));
import { prisma } from '../config/db.js';
import { requireTier, checkTier } from './gating.middleware.js';
const response = () => { const res = { status: jest.fn(), json: jest.fn() }; res.status.mockReturnValue(res); return res; };
beforeEach(() => jest.clearAllMocks());
test.each(['unknown', '__proto__', 'toString'])('unknown tier %s fails closed', async subscriptionTier => {
  prisma.systemUser.findUnique.mockResolvedValue({ subscriptionTier, accessExpiresAt: null });
  const res = response(); const next = jest.fn();
  await requireTier('legacy_sower')({ user: { id: 'u' } }, res, next);
  expect(res.status).toHaveBeenCalledWith(403); expect(next).not.toHaveBeenCalled();
});
test('invalid expiry fails closed and checkTier agrees', async () => {
  prisma.systemUser.findUnique.mockResolvedValue({ subscriptionTier: 'legacy_sower', accessExpiresAt: 'invalid' });
  const res = response(); const next = jest.fn(); const req = { user: { id: 'u' } };
  await requireTier('legacy_sower')(req, res, next);
  expect(res.status).toHaveBeenCalledWith(403); expect(next).not.toHaveBeenCalled();
  await checkTier('legacy_sower')(req, res, next);
  expect(req.hasSubscriptionAccess).toBe(false);
});
test('missing identity never reaches the database', async () => {
  const res = response(); const next = jest.fn();
  await requireTier('legacy_sower')({}, res, next);
  expect(res.status).toHaveBeenCalledWith(401); expect(prisma.systemUser.findUnique).not.toHaveBeenCalled();
});
test('known unexpired monthly tier retains access', async () => {
  prisma.systemUser.findUnique.mockResolvedValue({ subscriptionTier: 'legacy_sower_monthly', accessExpiresAt: null });
  const next = jest.fn();
  await requireTier('legacy_sower')({ user: { id: 'u' } }, response(), next);
  expect(next).toHaveBeenCalledTimes(1);
});
