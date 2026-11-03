/**
 * The email scheduler runs inside every server process. Without a shared lock
 * a multi-instance deployment sends each queued email once per instance.
 */

const mockProcessPendingMessages = jest.fn();
const mockAcquireLock = jest.fn();
const mockRecoverStaleLock = jest.fn();

jest.mock("node-cron", () => ({ schedule: jest.fn(), stop: jest.fn() }));

jest.mock("./cacheService.js", () => ({
  cache: {
    acquireLock: (...args) => mockAcquireLock(...args),
    recoverStaleLock: (...args) => mockRecoverStaleLock(...args),
  },
}));

jest.mock("./emailService.js", () => ({
  processPendingMessages: (...args) => mockProcessPendingMessages(...args),
}));

jest.mock("../utils/dbRetry.js", () => ({
  isTransientDbError: jest.fn(() => false),
}));

const cron = require("node-cron");

const {
  runEmailSweep,
  startEmailScheduler,
  stopEmailScheduler,
  __resetEmailSchedulerState,
} = require("./emailScheduler.js");

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

beforeEach(() => {
  jest.clearAllMocks();
  __resetEmailSchedulerState();
  mockRecoverStaleLock.mockResolvedValue(false);
  mockAcquireLock.mockResolvedValue({
    acquired: true,
    degraded: false,
    release: jest.fn().mockResolvedValue(undefined),
  });
  mockProcessPendingMessages.mockResolvedValue(undefined);
});

describe("runEmailSweep", () => {
  test("processes the queue and releases the lock", async () => {
    const release = jest.fn().mockResolvedValue(undefined);
    mockAcquireLock.mockResolvedValue({ acquired: true, degraded: false, release });

    await runEmailSweep();

    expect(mockAcquireLock).toHaveBeenCalledWith("email-scheduler", 120);
    expect(mockProcessPendingMessages).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledTimes(1);
  });

  test("skips the tick when another instance holds the lock", async () => {
    mockAcquireLock.mockResolvedValue({
      acquired: false,
      degraded: false,
      release: jest.fn(),
    });

    await runEmailSweep();

    expect(mockProcessPendingMessages).not.toHaveBeenCalled();
  });

  test("releases the lock even when processing throws", async () => {
    const release = jest.fn().mockResolvedValue(undefined);
    mockAcquireLock.mockResolvedValue({ acquired: true, degraded: false, release });
    mockProcessPendingMessages.mockRejectedValue(new Error("smtp down"));

    await runEmailSweep();

    expect(release).toHaveBeenCalledTimes(1);
  });

  test("does not start a second run while one is still in progress", async () => {
    const gate = deferred();
    mockProcessPendingMessages.mockReturnValueOnce(gate.promise);

    const first = runEmailSweep();
    await runEmailSweep(); // should short-circuit on the local guard

    expect(mockAcquireLock).toHaveBeenCalledTimes(1);
    gate.resolve();
    await first;
    expect(mockProcessPendingMessages).toHaveBeenCalledTimes(1);
  });

  test("still runs when Redis is unavailable (single-instance fallback)", async () => {
    mockAcquireLock.mockResolvedValue({
      acquired: true,
      degraded: true,
      release: jest.fn().mockResolvedValue(undefined),
    });

    await runEmailSweep();

    expect(mockProcessPendingMessages).toHaveBeenCalledTimes(1);
  });

  test("breaks a TTL-less stale lock and takes over the sweep", async () => {
    mockAcquireLock
      .mockResolvedValueOnce({
        acquired: false,
        degraded: false,
        release: jest.fn(),
      })
      .mockResolvedValueOnce({
        acquired: true,
        degraded: false,
        release: jest.fn().mockResolvedValue(undefined),
      });
    mockRecoverStaleLock.mockResolvedValue(true);

    await runEmailSweep();

    expect(mockRecoverStaleLock).toHaveBeenCalledWith("email-scheduler");
    expect(mockAcquireLock).toHaveBeenCalledTimes(2);
    expect(mockProcessPendingMessages).toHaveBeenCalledTimes(1);
  });

  test("logs lock contention once, not on every tick", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    mockAcquireLock.mockResolvedValue({
      acquired: false,
      degraded: false,
      release: jest.fn(),
    });
    mockRecoverStaleLock.mockResolvedValue(false);

    try {
      await runEmailSweep();
      await runEmailSweep();
      await runEmailSweep();

      const standBy = logSpy.mock.calls.filter((args) =>
        String(args[0]).includes("standing by"),
      );
      expect(standBy).toHaveLength(1);
      expect(mockProcessPendingMessages).not.toHaveBeenCalled();
    } finally {
      logSpy.mockRestore();
    }
  });

  test("renews the distributed lock during a long sweep", async () => {
    jest.useFakeTimers();
    try {
      const renew = jest.fn().mockResolvedValue(true);
      mockAcquireLock.mockResolvedValue({
        acquired: true,
        degraded: false,
        renew,
        release: jest.fn().mockResolvedValue(undefined),
      });
      const gate = deferred();
      mockProcessPendingMessages.mockReturnValueOnce(gate.promise);

      const sweep = runEmailSweep();
      await jest.advanceTimersByTimeAsync(40_000);
      expect(renew).toHaveBeenCalled();

      gate.resolve({ processed: 0, sent: 0, failed: 0 });
      await sweep;
    } finally {
      jest.useRealTimers();
    }
  });
});

describe("startEmailScheduler / stopEmailScheduler", () => {
  test("keeps the cron task handle and stops it on shutdown", () => {
    const stop = jest.fn();
    cron.schedule.mockReturnValue({ stop });

    startEmailScheduler();
    startEmailScheduler(); // idempotent — never schedules twice

    expect(cron.schedule).toHaveBeenCalledTimes(1);
    expect(stop).not.toHaveBeenCalled();

    stopEmailScheduler();
    expect(stop).toHaveBeenCalledTimes(1);

    stopEmailScheduler(); // already stopped — no-op
    expect(stop).toHaveBeenCalledTimes(1);
  });
});
