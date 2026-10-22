/**
 * The email scheduler runs inside every server process. Without a shared lock
 * a multi-instance deployment sends each queued email once per instance.
 */

const mockProcessPendingMessages = jest.fn();
const mockAcquireLock = jest.fn();

jest.mock("node-cron", () => ({ schedule: jest.fn(), stop: jest.fn() }));

jest.mock("./cacheService.js", () => ({
  cache: { acquireLock: (...args) => mockAcquireLock(...args) },
}));

jest.mock("./emailService.js", () => ({
  processPendingMessages: (...args) => mockProcessPendingMessages(...args),
}));

jest.mock("../utils/dbRetry.js", () => ({
  isTransientDbError: jest.fn(() => false),
}));

const {
  runEmailSweep,
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
});
