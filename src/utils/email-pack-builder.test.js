jest.mock("../services/cacheService.js", () => ({ cache: { acquireLock: jest.fn() } }));
jest.mock("../services/objectStorage.js", () => ({ readUiPackObject: jest.fn(), writeUiPackObject: jest.fn() }));
jest.mock("../modules/text-to-text-translation/service.js", () => ({ translateBatch: jest.fn() }));

import { buildEmailPack } from "./email-pack-builder.js";
import {
  emailSource,
  emailPackKeys,
  emailCarryKey,
  completeEmailPack,
} from "./email-pack-data.js";
import { cache } from "../services/cacheService.js";
import { readUiPackObject, writeUiPackObject } from "../services/objectStorage.js";
import { translateBatch } from "../modules/text-to-text-translation/service.js";

const fixture = (language) => ({
  schemaVersion: 1,
  language,
  revision: emailSource.revision,
  translations: emailSource.texts.map((text) => `translated:${text}`),
});

beforeEach(() => {
  jest.clearAllMocks();
  cache.acquireLock.mockResolvedValue({ acquired: true, release: jest.fn() });
  readUiPackObject.mockResolvedValue(null);
  writeUiPackObject.mockResolvedValue(undefined);
  translateBatch.mockImplementation(async ({ q }) => ({
    translations: q.map((text) => ({ translatedText: `translated:${text}` })),
  }));
});

test("builds bounded batches, checkpoints, compresses the final object and publishes the manifest last", async () => {
  const result = await buildEmailPack("fr");
  expect(result.totalTexts).toBe(emailSource.texts.length);
  for (const [request] of translateBatch.mock.calls) {
    expect(request.q.length).toBeLessThanOrEqual(50);
    expect(request.q.reduce((n, text) => n + text.length, 0)).toBeLessThanOrEqual(10000);
    expect(request.target).toBe("fr");
  }
  const calls = writeUiPackObject.mock.calls;
  const final = calls.find(([key, , options]) => key === emailPackKeys("fr").final && options?.compress);
  expect(completeEmailPack(final[1], "fr")).toBe(true);
  expect(calls.at(-1)[0]).toBe(emailPackKeys("fr").manifest);
});

test("reuses a complete pack without invoking the provider", async () => {
  readUiPackObject.mockResolvedValue(fixture("fr"));
  expect((await buildEmailPack("fr")).reused).toBe(true);
  expect(translateBatch).not.toHaveBeenCalled();
});

test("--refresh/force re-translates a complete pack instead of reusing it", async () => {
  readUiPackObject.mockResolvedValue(fixture("fr"));
  const result = await buildEmailPack("fr", () => {}, { force: true });
  expect(result.reused).toBe(false);
  expect(translateBatch).toHaveBeenCalled();
});

test("English needs no provider and publishes no carry", async () => {
  await buildEmailPack("en");
  expect(translateBatch).not.toHaveBeenCalled();
  expect(writeUiPackObject.mock.calls.some(([key]) => key === emailCarryKey("en"))).toBe(false);
});

test("reuses carried strings from the previous revision", async () => {
  const indexes = [0, 1, 2];
  const carriedTexts = indexes.map((index) => emailSource.texts[index]);
  const carry = {
    schemaVersion: 1,
    revision: "000000000000",
    language: "fr",
    texts: carriedTexts,
    translations: indexes.map((index) => `carried:${index}`),
  };
  readUiPackObject.mockImplementation(async (key) => (key === emailCarryKey("fr") ? carry : null));
  const translate = jest.fn(async (texts) => texts.map((text) => `translated:${text}`));
  await buildEmailPack("fr", () => {}, { translate });
  const sent = translate.mock.calls.flatMap(([texts]) => texts);
  for (const text of carriedTexts) expect(sent).not.toContain(text);
  const pack = writeUiPackObject.mock.calls.find(([key]) => key === emailPackKeys("fr").final)[1];
  indexes.forEach((index) => expect(pack.translations[index]).toBe(`carried:${index}`));
  expect(completeEmailPack(pack, "fr")).toBe(true);
});

test("a provider failure never advertises a manifest and always releases the lock", async () => {
  translateBatch.mockRejectedValue(new Error("Offline"));
  await expect(buildEmailPack("fr")).rejects.toThrow("Offline");
  expect(writeUiPackObject).not.toHaveBeenCalled();
  const lock = await cache.acquireLock.mock.results[0].value;
  expect(lock.release).toHaveBeenCalledTimes(1);
});

test("unsupported languages and unowned locks fail explicitly", async () => {
  await expect(buildEmailPack("../en")).rejects.toThrow("Unsupported");
  cache.acquireLock.mockResolvedValue({ acquired: false });
  await expect(buildEmailPack("fr")).rejects.toThrow("Another");
});
