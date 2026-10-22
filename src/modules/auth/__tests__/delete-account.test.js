/**
 * Self-service account deletion.
 *
 * The Play Store requires an in-app deletion path for any app with accounts.
 * It must not be possible to trigger deletion from a stolen session alone, so
 * the current password is re-checked.
 */

const mockCustomersUpdate = jest.fn();
const mockSubscriptionCancel = jest.fn();

jest.mock("stripe", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    customers: { create: jest.fn(), update: mockCustomersUpdate },
    subscriptions: { cancel: mockSubscriptionCancel },
  })),
}));

jest.mock("../../../config/db.js", () => ({
  prisma: {
    systemUser: { findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
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

jest.mock("../../../services/objectStorage.js", () => ({
  uploadObject: jest.fn(),
  deleteObject: jest.fn(),
  deleteStoredMedia: jest.fn().mockResolvedValue(undefined),
  contentTypeForExtension: jest.fn(),
}));

const bcrypt = require("bcryptjs");
const { prisma } = require("../../../config/db.js");
const { deleteAccount } = require("../service.js");
const { deleteStoredMedia } = require("../../../services/objectStorage.js");

const PASSWORD = "CorrectHorse1!";

const buildUser = async (overrides = {}) => ({
  id: "user-1",
  username: "reader",
  email: "reader@example.com",
  password: await bcrypt.hash(PASSWORD, 4),
  accountStatus: "active",
  subscriptionTier: "legacy_sower_monthly",
  stripeCustomerId: "cus_1",
  stripeSubscriptionId: "sub_1",
  profilePhotoUrl: "https://cdn.example.com/profile.jpg",
  coverPhotoUrl: null,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  prisma.subscriptionEvent.create.mockResolvedValue({});
  prisma.systemUser.update.mockResolvedValue({});
  mockCustomersUpdate.mockResolvedValue({});
  mockSubscriptionCancel.mockResolvedValue({});
});

describe("deleteAccount", () => {
  test("rejects a deletion without the current password", async () => {
    const result = await deleteAccount("user-1", { confirmation: "DELETE" });

    expect(result.status).toBe(400);
    expect(prisma.systemUser.findUnique).not.toHaveBeenCalled();
  });

  test("requires the DELETE confirmation phrase", async () => {
    const result = await deleteAccount("user-1", { password: PASSWORD });

    expect(result.status).toBe(400);
    expect(result.message).toMatch(/DELETE/);
    expect(prisma.systemUser.findUnique).not.toHaveBeenCalled();
  });

  test("rejects an incorrect password without touching the account", async () => {
    prisma.systemUser.findUnique.mockResolvedValue(await buildUser());

    const result = await deleteAccount("user-1", {
      password: "wrong-password",
      confirmation: "DELETE",
    });

    expect(result.status).toBe(422);
    expect(prisma.systemUser.update).not.toHaveBeenCalled();
    expect(mockSubscriptionCancel).not.toHaveBeenCalled();
  });

  test("soft-deletes the account and cancels billing", async () => {
    prisma.systemUser.findUnique.mockResolvedValue(await buildUser());

    const result = await deleteAccount("user-1", {
      password: PASSWORD,
      confirmation: "DELETE",
    });

    expect(result.status).toBe(200);
    expect(mockSubscriptionCancel).toHaveBeenCalledWith("sub_1");
    expect(prisma.systemUser.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: expect.objectContaining({
          accountStatus: "deleted",
          deletedEmail: "reader@example.com",
          stripeSubscriptionId: null,
          sessionId: null,
          isLoggedIn: false,
        }),
      }),
    );
    const data = prisma.systemUser.update.mock.calls[0][0].data;
    expect(data.email).not.toBe("reader@example.com");
    expect(data.username).toBe("deleted_user-1");
    expect(deleteStoredMedia).toHaveBeenCalledWith("https://cdn.example.com/profile.jpg");
    // The in-app notice promises that journals and study content are erased.
    expect(prisma.journalEntry.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
    });
    expect(prisma.journalLike.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
    });
    expect(prisma.supportTicket.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
    });
  });

  test("refuses to delete an account twice", async () => {
    prisma.systemUser.findUnique.mockResolvedValue(
      await buildUser({ accountStatus: "deleted" }),
    );

    const result = await deleteAccount("user-1", {
      password: PASSWORD,
      confirmation: "DELETE",
    });

    expect(result.status).toBe(410);
    expect(prisma.systemUser.update).not.toHaveBeenCalled();
  });
});
