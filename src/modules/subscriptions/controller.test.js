/**
 * Regression tests for getSubscriptionStatus.
 *
 * Bug fixed: the Stripe-reconciliation Promise.race used to send its own
 * res.json ("No subscription found") from inside the race, then the outer
 * flow sent a second response — ERR_HTTP_HEADERS_SENT. The reconciliation
 * must only mutate state; the outer flow sends exactly one response.
 */
import { getSubscriptionStatus } from "./controller.js";

// Mock the Stripe client and Prisma BEFORE the controller module loads
// (jest hoists these above the static import).
jest.mock("stripe", () =>
  jest.fn().mockImplementation(() => ({
    customers: { list: jest.fn() },
    subscriptions: { list: jest.fn() },
    prices: { retrieve: jest.fn() },
  })),
);

jest.mock("../../config/db.js", () => ({
  prisma: {
    systemUser: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    subscriptionTier: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

const makeRes = () => {
  const res = {
    statusCode: 200,
    status: jest.fn().mockImplementation(function (code) {
      this.statusCode = code;
      return this;
    }),
    json: jest.fn().mockImplementation(function (body) {
      this.body = body;
      this.headersSent = true;
      return this;
    }),
    headersSent: false,
  };
  return res;
};

const getPrisma = () => {
  // The controller's prisma import is the mocked module — grab its fns.
  return require("../../config/db.js").prisma;
};

const getStripeInstance = () => {
  // The instance the controller created at module load (first constructor call).
  const StripeMock = require("stripe");
  return StripeMock.mock.results[0].value;
};

describe("getSubscriptionStatus — single-response guarantee", () => {
  test("free user with NO Stripe customers gets exactly one response (no double send)", async () => {
    const prisma = getPrisma();
    prisma.systemUser.findUnique.mockResolvedValue({
      subscriptionTier: "free",
      accessExpiresAt: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      legacySowerSlot: null,
    });
    prisma.subscriptionTier.findUnique.mockResolvedValue({ id: "free", name: "Free" });

    const stripeInstance = getStripeInstance();
    stripeInstance.customers.list.mockResolvedValue({ data: [] });

    const req = { user: { id: "u1", email: "reader@example.com" } };
    const res = makeRes();

    await expect(getSubscriptionStatus(req, res)).resolves.not.toThrow();

    // Exactly one response was sent — and it is the outer 200, not a 500.
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.body.returnCode).toBe(200);
    expect(res.body.returnData.subscriptionTier).toBe("free");
  });

  test("free user WITH an active Stripe subscription is reconciled and still gets one response", async () => {
    const prisma = getPrisma();
    prisma.systemUser.findUnique.mockResolvedValue({
      subscriptionTier: "free",
      accessExpiresAt: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      legacySowerSlot: null,
    });
    prisma.systemUser.update.mockResolvedValue({});
    prisma.subscriptionTier.findFirst.mockResolvedValue(null); // price not in DB → Stripe lookup
    prisma.subscriptionTier.findUnique.mockResolvedValue({ id: "covenant_sower", name: "Covenant Sower" });

    const stripeInstance = getStripeInstance();
    stripeInstance.customers.list.mockResolvedValue({ data: [{ id: "cus_1" }] });
    stripeInstance.subscriptions.list.mockResolvedValue({
      data: [
        {
          id: "sub_1",
          current_period_end: Math.floor(Date.now() / 1000) + 86400,
          items: { data: [{ price: { id: "price_1", recurring: { interval: "month" } } }] },
          _customerId: "cus_1",
        },
      ],
    });
    stripeInstance.prices.retrieve.mockResolvedValue({
      id: "price_1",
      product: { name: "Covenant Sower", metadata: { tierId: "covenant_sower" } },
    });

    const req = { user: { id: "u1", email: "reader@example.com" } };
    const res = makeRes();

    await expect(getSubscriptionStatus(req, res)).resolves.not.toThrow();

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.body.returnCode).toBe(200);
    expect(res.body.returnData.subscriptionTier).toBe("covenant_sower");
    // The DB was reconciled with the Stripe truth.
    expect(prisma.systemUser.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u1" },
        data: expect.objectContaining({ subscriptionTier: "covenant_sower" }),
      }),
    );
  });

  test("paid user (non-free) skips reconciliation and gets one response", async () => {
    const prisma = getPrisma();
    prisma.systemUser.findUnique.mockResolvedValue({
      subscriptionTier: "covenant_sower",
      accessExpiresAt: new Date(),
      stripeCustomerId: "cus_1",
      stripeSubscriptionId: "sub_1",
      legacySowerSlot: null,
    });
    prisma.subscriptionTier.findUnique.mockResolvedValue({ id: "covenant_sower", name: "Covenant Sower" });

    const stripeInstance = getStripeInstance();
    // Reconciliation must not run for paid users — these should never be called.
    stripeInstance.customers.list.mockClear();

    const req = { user: { id: "u1", email: "reader@example.com" } };
    const res = makeRes();

    await expect(getSubscriptionStatus(req, res)).resolves.not.toThrow();

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(stripeInstance.customers.list).not.toHaveBeenCalled();
    expect(res.body.returnCode).toBe(200);
    expect(res.body.returnData.subscriptionTier).toBe("covenant_sower");
  });
});
