const mockSendToUsers = jest.fn();
const mockGetVerse = jest.fn();
const mockAcquireLock = jest.fn();

jest.mock("node-cron", () => ({ schedule: jest.fn() }));

jest.mock("./cacheService.js", () => ({
  cache: { acquireLock: (...args) => mockAcquireLock(...args) },
}));

jest.mock("../config/db.js", () => ({
  prisma: {
    pushSetting: { findMany: jest.fn(), updateMany: jest.fn() },
  },
}));

jest.mock("../modules/push/service.js", () => ({
  sendToUsers: (...args) => mockSendToUsers(...args),
  getTodaysVerseForPush: (...args) => mockGetVerse(...args),
}));

const { prisma } = require("../config/db.js");
const { runPushSweep } = require("./pushNotificationScheduler.js");

const now = new Date("2026-01-15T12:02:00.000Z"); // 07:02 in New York

const dueSetting = (overrides = {}) => ({
  userId: "user-1",
  dailyVerseReminder: true,
  reminderTime: "07:00",
  timezone: "America/New_York",
  lastPushedOn: null,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockAcquireLock.mockResolvedValue({
    acquired: true,
    degraded: false,
    release: jest.fn().mockResolvedValue(undefined),
  });
  prisma.pushSetting.updateMany.mockResolvedValue({ count: 1 });
  mockGetVerse.mockResolvedValue({ reference: "John 3:16", text: "For God so loved..." });
  mockSendToUsers.mockResolvedValue({ sent: 1, pruned: 0, acceptedUserIds: ["user-1"] });
});

describe("runPushSweep", () => {
  test("claims and sends a due browser reminder", async () => {
    prisma.pushSetting.findMany.mockResolvedValue([dueSetting()]);

    await runPushSweep(now);

    expect(prisma.pushSetting.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user-1", dailyVerseReminder: true }),
        data: { lastPushedOn: now },
      }),
    );
    expect(mockSendToUsers).toHaveBeenCalledWith(
      ["user-1"],
      expect.objectContaining({ platforms: ["web"], data: expect.objectContaining({ kind: "daily-verse", localDate: "2026-01-15" }) }),
    );
  });

  test("skips a user already notified on the same local day", async () => {
    prisma.pushSetting.findMany.mockResolvedValue([
      dueSetting({ lastPushedOn: new Date("2026-01-15T12:01:00.000Z") }),
    ]);

    await runPushSweep(now);

    expect(mockSendToUsers).not.toHaveBeenCalled();
  });

  test("releases the claim when no device accepted the notification", async () => {
    prisma.pushSetting.findMany.mockResolvedValue([dueSetting()]);
    mockSendToUsers.mockResolvedValue({ sent: 0, pruned: 0, acceptedUserIds: [] });

    await runPushSweep(now);

    expect(prisma.pushSetting.updateMany).toHaveBeenCalledTimes(2);
    expect(prisma.pushSetting.updateMany).toHaveBeenLastCalledWith({
      where: { userId: "user-1", lastPushedOn: now },
      data: { lastPushedOn: null },
    });
  });

  test("does not send when no verse is available", async () => {
    prisma.pushSetting.findMany.mockResolvedValue([dueSetting()]);
    mockGetVerse.mockResolvedValue(null);

    await runPushSweep(now);

    expect(mockSendToUsers).not.toHaveBeenCalled();
  });

  test("does not send when another instance already claimed the day", async () => {
    prisma.pushSetting.findMany.mockResolvedValue([dueSetting()]);
    prisma.pushSetting.updateMany.mockResolvedValue({ count: 0 });

    await runPushSweep(now);

    expect(mockSendToUsers).not.toHaveBeenCalled();
  });

  test("skips the sweep when another instance holds the distributed lock", async () => {
    mockAcquireLock.mockResolvedValue({
      acquired: false,
      degraded: false,
      release: jest.fn(),
    });

    await runPushSweep(now);

    expect(mockAcquireLock).toHaveBeenCalledWith("push-scheduler", 240);
    expect(prisma.pushSetting.findMany).not.toHaveBeenCalled();
    expect(mockSendToUsers).not.toHaveBeenCalled();
  });

  test("releases the distributed lock after a sweep", async () => {
    const release = jest.fn().mockResolvedValue(undefined);
    mockAcquireLock.mockResolvedValue({ acquired: true, degraded: false, release });
    prisma.pushSetting.findMany.mockResolvedValue([]);

    await runPushSweep(now);

    expect(release).toHaveBeenCalledTimes(1);
  });
});
