const mockConstructEvent = jest.fn();

jest.mock("stripe", () => {
  const stripe = jest.fn(() => ({ webhooks: { constructEvent: mockConstructEvent } }));
  stripe.__esModule = true;
  stripe.default = stripe;
  return stripe;
});

const mockReceiptCreate = jest.fn();
const mockReceiptDelete = jest.fn();

jest.mock("../../config/db.js", () => ({
  prisma: {
    stripeWebhookReceipt: {
      create: mockReceiptCreate,
      delete: mockReceiptDelete,
    },
    subscriptionEvent: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    systemUser: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    subscriptionTier: { findFirst: jest.fn(), findMany: jest.fn() },
  },
}));

const { handleStripeWebhook } = require("./webhook.js");

const makeRes = () => {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(payload) {
      res.body = payload;
      return res;
    },
  };
  return res;
};

const makeEvent = (overrides = {}) => ({
  id: "evt_123",
  type: "customer.subscription.deleted",
  data: { object: { id: "sub_1", customer: "cus_1" } },
  ...overrides,
});

describe("Stripe webhook idempotency", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
    mockConstructEvent.mockReturnValue(makeEvent());
    mockReceiptCreate.mockResolvedValue({ id: "evt_123" });
    mockReceiptDelete.mockResolvedValue({ id: "evt_123" });
  });

  it("claims the event before processing it", async () => {
    const res = makeRes();
    await handleStripeWebhook(
      { headers: { "stripe-signature": "sig" }, body: "raw" },
      res,
    );

    expect(mockReceiptCreate).toHaveBeenCalledWith({
      data: { id: "evt_123", eventType: "customer.subscription.deleted" },
    });
  });

  it("skips a duplicate delivery instead of applying it twice", async () => {
    const duplicate = new Error("Unique constraint failed");
    duplicate.code = "P2002";
    mockReceiptCreate.mockRejectedValue(duplicate);

    const res = makeRes();
    await handleStripeWebhook(
      { headers: { "stripe-signature": "sig" }, body: "raw" },
      res,
    );

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ received: true, duplicate: true });
    // The event must not be processed a second time.
    expect(mockReceiptDelete).not.toHaveBeenCalled();
  });

  it("releases the claim when processing fails so Stripe can retry", async () => {
    const { prisma } = require("../../config/db.js");
    prisma.systemUser.findFirst.mockRejectedValue(new Error("database down"));

    const res = makeRes();
    await handleStripeWebhook(
      { headers: { "stripe-signature": "sig" }, body: "raw" },
      res,
    );

    expect(res.statusCode).toBe(500);
    expect(mockReceiptDelete).toHaveBeenCalledWith({
      where: { id: "evt_123" },
    });
  });

  it("does not release the claim when processing succeeds", async () => {
    const { prisma } = require("../../config/db.js");
    prisma.systemUser.findFirst.mockResolvedValue(null);

    const res = makeRes();
    await handleStripeWebhook(
      { headers: { "stripe-signature": "sig" }, body: "raw" },
      res,
    );

    expect(res.statusCode).toBe(200);
    expect(mockReceiptDelete).not.toHaveBeenCalled();
  });
});
