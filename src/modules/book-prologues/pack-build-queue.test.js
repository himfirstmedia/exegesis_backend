import { runOverviewBuildQueue } from '../../../scripts/overview-build-queue.mjs';
const paused = () => Object.assign(new Error('cooldown'), { code: 'FREE_PROVIDER_COOLDOWN', providerReason: 'HTTP_429' });

test('CLI automatically resumes a language after one shared cooldown', async () => {
  const build = jest.fn().mockRejectedValueOnce(paused()).mockResolvedValue({ bookCount: 46 });
  const waitForCooldown = jest.fn().mockResolvedValue(undefined);
  const onResult = jest.fn();
  const result = await runOverviewBuildQueue({ languages: ['fr'], concurrency: 1, build, waitForCooldown, onResult });
  expect(waitForCooldown).toHaveBeenCalledTimes(1);
  expect(build).toHaveBeenCalledTimes(2);
  expect(result.failed).toBe(0); expect(onResult).toHaveBeenCalledTimes(1);
});
test('persistent outages have a run-wide two-cooldown budget, not three retries per chunk/book/language', async () => {
  const build = jest.fn().mockRejectedValue(paused());
  const waitForCooldown = jest.fn().mockResolvedValue(undefined);
  const result = await runOverviewBuildQueue({ languages: ['fr', 'de', 'fil', 'id'], concurrency: 1, build, waitForCooldown });
  expect(waitForCooldown).toHaveBeenCalledTimes(2);
  expect(build).toHaveBeenCalledTimes(3);
  expect(result.providerStopped).toBe(true);
  expect(result.unattempted).toBe(4);
  expect(result.failed).toBeGreaterThan(0);
});
test('concurrent language workers share one cooldown wait rather than multiplying pauses', async () => {
  const seen = new Set();
  const build = jest.fn(async language => { if (!seen.has(language)) { seen.add(language); throw paused(); } return { bookCount: 46 }; });
  const waitForCooldown = jest.fn().mockResolvedValue(undefined);
  const result = await runOverviewBuildQueue({ languages: ['fr', 'de'], concurrency: 2, build, waitForCooldown });
  expect(waitForCooldown).toHaveBeenCalledTimes(1);
  expect(result.failed).toBe(0);
  expect(build).toHaveBeenCalledTimes(4);
});
test('cancellation interrupts cooldown without scheduling more provider work', async () => {
  const controller = new AbortController();
  const build = jest.fn().mockRejectedValue(paused());
  const waitForCooldown = jest.fn(async () => { controller.abort(); throw new Error('Aborted'); });
  await runOverviewBuildQueue({ languages: ['fr', 'de'], concurrency: 1, build, waitForCooldown, signal: controller.signal });
  expect(build).toHaveBeenCalledTimes(1);
});
test('a failed cooldown wait stops scheduling instead of spinning in a requeue loop', async () => {
  const build = jest.fn().mockRejectedValue(paused());
  const waitForCooldown = jest.fn().mockRejectedValue(new Error('timer failed'));
  const result = await runOverviewBuildQueue({ languages: ['fr'], concurrency: 1, build, waitForCooldown });
  expect(build).toHaveBeenCalledTimes(1); expect(result.providerStopped).toBe(true);
});
