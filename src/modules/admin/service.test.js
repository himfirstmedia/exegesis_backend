/**
 * Regression tests for deleteUser account lifecycle.
 *
 * Bug: deleting a user previously hard-deleted the row and left the Stripe
 * customer + subscription alive. A later registration with the same email was
 * then matched by email and silently inherited the deleted account's paid
 * subscription.
 *
 * Correct behaviour: cancel the subscription, anonymize (but keep) the Stripe
 * customer, and soft-delete the row so the email is freed and reconciliation
 * can never re-adopt the old subscription.
 */
jest.mock("stripe", () => {
  const Stripe = jest.fn().mockImplementation(() => ({
    subscriptions: { cancel: jest.fn() },
    customers: { update: jest.fn() },
  }));
  return { __esModule: true, default: Stripe };
});

jest.mock("../../config/db.js", () => ({
  prisma: {
    systemUser: { findFirst: jest.fn(), update: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    journalLike: { deleteMany: jest.fn() },
    exegesisSession: { deleteMany: jest.fn() },
    journalEntry: { deleteMany: jest.fn() },
    triviaAnswer: { deleteMany: jest.fn() },
    popularSearchLog: { deleteMany: jest.fn() },
    pushToken: { deleteMany: jest.fn() },
    pushSetting: { deleteMany: jest.fn() },
    supportTicket: { deleteMany: jest.fn() },
    activity: { deleteMany: jest.fn() },
    highlight: { deleteMany: jest.fn() },
    favorite: { deleteMany: jest.fn() },
    note: { deleteMany: jest.fn() },
    readHistory: { deleteMany: jest.fn() },
    userQuizAnswer: { deleteMany: jest.fn() },
    userPlanProgress: { deleteMany: jest.fn() },
    verification: { deleteMany: jest.fn() },
    message: { deleteMany: jest.fn() },
    dailyVerse: { deleteMany: jest.fn() },
    subscriptionEvent: { create: jest.fn() },
  },
}));

jest.mock("../../services/cacheService.js", () => ({ cache: {} }));
jest.mock("../../services/objectStorage.js", () => ({
  deleteStoredMedia: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../../utils/emailTemplates.js", () => ({
  __esModule: true,
  default: {},
}));

const { deleteUser, getUsersByAdmin } = require("./service.js");
// Capture the Stripe instance the service constructed at module load.
const stripeInstance = require("stripe").default.mock.results[0].value;
const { prisma: mockPrisma } = require("../../config/db.js");
const { deleteStoredMedia } = require("../../services/objectStorage.js");

const payingUser = {
  id: "u1",
  username: "reader",
  email: "reader@example.com",
  subscriptionTier: "legacy_sower_monthly",
  stripeCustomerId: "cus_1",
  stripeSubscriptionId: "sub_1",
  profilePhotoUrl: "https://cdn.example.com/profile-photo.jpg",
  coverPhotoUrl: "/media/covers/cover.jpg",
};

describe('user list account lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.systemUser.findMany.mockResolvedValue([]);
    mockPrisma.systemUser.count.mockResolvedValue(0);
  });
  test('excludes deleted/tombstoned accounts from ordinary searches and counts', async () => {
    await getUsersByAdmin({ search: 'Claire' }, 'admin');
    const where = mockPrisma.systemUser.findMany.mock.calls[0][0].where;
    expect(where.NOT.OR).toEqual(expect.arrayContaining([
      { accountStatus: 'deleted' }, { deletedAt: { not: null } },
      { email: { endsWith: '@exegesis.invalid' } },
    ]));
    expect(where.OR).toHaveLength(4);
    expect(mockPrisma.systemUser.count).toHaveBeenCalledWith({ where });
  });
  test('archive explicitly includes only deleted accounts, with the same pagination filter', async () => {
    await getUsersByAdmin({ accountView: 'deleted', page: 2 }, 'admin');
    const query = mockPrisma.systemUser.findMany.mock.calls[0][0];
    expect(query.where.NOT).toBeUndefined();
    expect(query.where.AND[0].OR).toHaveLength(3);
    expect(query.skip).toBe(10);
    expect(mockPrisma.systemUser.count).toHaveBeenCalledWith({ where: query.where });
  });
});

describe("deleteUser — billing-safe soft delete", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.systemUser.update.mockResolvedValue({});
    mockPrisma.subscriptionEvent.create.mockResolvedValue({});
    stripeInstance.subscriptions.cancel.mockResolvedValue({ id: "sub_1" });
    stripeInstance.customers.update.mockResolvedValue({ id: "cus_1" });
    mockPrisma.systemUser.findFirst.mockResolvedValue(payingUser);
  });

  test("cancels the Stripe subscription and clears it from the account", async () => {
    const result = await deleteUser({ username: "reader" }, "admin-1");

    expect(result.status).toBe(200);
    expect(stripeInstance.subscriptions.cancel).toHaveBeenCalledWith("sub_1");
    expect(mockPrisma.systemUser.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u1" },
        data: expect.objectContaining({
          accountStatus: "deleted",
          stripeSubscriptionId: null,
          subscriptionTier: "free",
          deletedEmail: "reader@example.com",
        }),
      }),
    );
    // Email is tombstoned so the same address can register a fresh account.
    const updateData = mockPrisma.systemUser.update.mock.calls[0][0].data;
    expect(updateData.email).not.toBe("reader@example.com");
    expect(updateData.email).toContain("deleted+");
  });

  test("anonymizes but keeps the Stripe customer for billing history", async () => {
    await deleteUser({ username: "reader" }, "admin-1");

    expect(stripeInstance.customers.update).toHaveBeenCalledWith(
      "cus_1",
      expect.objectContaining({
        metadata: expect.objectContaining({ deleted: "true", userId: "" }),
      }),
    );
    const args = stripeInstance.customers.update.mock.calls[0][1];
    expect(args.email).toContain("deleted+");
  });

  test("still completes deletion when Stripe cancellation fails", async () => {
    stripeInstance.subscriptions.cancel.mockRejectedValueOnce(
      new Error("No such subscription"),
    );

    const result = await deleteUser({ username: "reader" }, "admin-1");

    expect(result.status).toBe(200);
    expect(mockPrisma.systemUser.update).toHaveBeenCalled();
  });

  test("records a cancellation event for the audit trail", async () => {
    await deleteUser({ username: "reader" }, "admin-1");

    expect(mockPrisma.subscriptionEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "u1",
          eventType: "cancelled",
          metadata: expect.objectContaining({ action: "account_deleted" }),
        }),
      }),
    );
  });

  test("clears and deletes profile media", async () => {
    await deleteUser({ username: "reader" }, "admin-1");

    expect(mockPrisma.systemUser.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          profilePhotoUrl: null,
          coverPhotoUrl: null,
        }),
      }),
    );
    expect(deleteStoredMedia).toHaveBeenCalledWith(payingUser.profilePhotoUrl);
    expect(deleteStoredMedia).toHaveBeenCalledWith(payingUser.coverPhotoUrl);
  });

  test("refuses to delete the admin's own account", async () => {
    const result = await deleteUser({ username: "reader" }, "u1");
    expect(result.status).toBe(403);
    expect(mockPrisma.systemUser.update).not.toHaveBeenCalled();
  });
});
