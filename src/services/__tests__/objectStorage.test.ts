jest.mock("@aws-sdk/client-s3", () => {
  const send = jest.fn().mockResolvedValue({});
  return {
    S3Client: jest.fn(() => ({ send })),
    PutObjectCommand: jest.fn((input) => ({ input })),
    GetObjectCommand: jest.fn((input) => ({ input })),
    DeleteObjectCommand: jest.fn((input) => ({ input })),
    __send: send,
  };
});

import fs from "fs";
import path from "path";
import {
  contentTypeForExtension,
  deleteObject,
  isObjectStorageConfigured,
  isMediaObjectKey,
  resolveObjectUrl,
  storedMediaLocation,
  uploadObject,
  validateObjectStorageConfig,
} from "../objectStorage.js";

const s3 = require("@aws-sdk/client-s3");
const UPLOADS_ROOT = path.join(__dirname, "../../../uploads");
const TEST_KEY = "covers/123e4567-e89b-42d3-a456-426614174000.png";

const setR2Env = (enabled: boolean) => {
  if (enabled) {
    process.env.R2_ACCOUNT_ID = "test-account";
    process.env.R2_ACCESS_KEY_ID = "test-key";
    process.env.R2_SECRET_ACCESS_KEY = "test-secret";
    process.env.R2_BUCKET = "exegesis-test";
    process.env.R2_ENDPOINT = "https://test-account.r2.cloudflarestorage.com";
  } else {
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    delete process.env.R2_BUCKET;
    delete process.env.R2_ENDPOINT;
  }
  delete process.env.R2_PUBLIC_BASE_URL;
};

describe("object storage", () => {
  afterEach(() => {
    s3.__send.mockClear();
    setR2Env(false);
    process.env.NODE_ENV = "test";
  });

  it("maps image extensions to content types", () => {
    expect(contentTypeForExtension("png")).toBe("image/png");
    expect(contentTypeForExtension("JPG")).toBe("image/jpeg");
    expect(contentTypeForExtension("webp")).toBe("image/webp");
    expect(contentTypeForExtension("bin")).toBe("application/octet-stream");
  });

  it("reports unconfigured without R2 credentials", () => {
    setR2Env(false);
    expect(isObjectStorageConfigured()).toBe(false);
  });

  it("uploads to R2 and returns the media proxy URL by default", async () => {
    setR2Env(true);
    const buffer = Buffer.from("image-bytes");

    const result = await uploadObject({
      key: TEST_KEY,
      buffer,
      contentType: "image/png",
    });

    expect(result).toEqual({
      storage: "r2",
      key: TEST_KEY,
      url: `/media/${TEST_KEY}`,
    });
    expect(s3.__send).toHaveBeenCalledTimes(1);
  });

  it("prefers a public base URL when configured", async () => {
    setR2Env(true);
    process.env.R2_PUBLIC_BASE_URL = "https://cdn.example.com/";

    expect(resolveObjectUrl(TEST_KEY, "r2")).toBe(
      `https://cdn.example.com/${TEST_KEY}`,
    );

    const result = await uploadObject({
      key: TEST_KEY,
      buffer: Buffer.from("x"),
      contentType: "image/png",
    });
    expect(result.url).toBe(`https://cdn.example.com/${TEST_KEY}`);
  });

  it("falls back to local disk when R2 is unconfigured", async () => {
    setR2Env(false);
    const key = "profile-photos/123e4567-e89b-42d3-a456-426614174001.png";

    const result = await uploadObject({
      key,
      buffer: Buffer.from("local-bytes"),
      contentType: "image/png",
    });

    expect(result.storage).toBe("local");
    expect(result.url).toBe(`/uploads/${key}`);
    const target = path.join(UPLOADS_ROOT, key);
    expect(fs.existsSync(target)).toBe(true);
    fs.rmSync(target, { force: true });
  });

  it("does not fall back to local disk after an R2 failure", async () => {
    setR2Env(true);
    s3.__send.mockRejectedValueOnce(new Error("R2 unavailable"));

    await expect(
      uploadObject({ key: TEST_KEY, buffer: Buffer.from("x"), contentType: "image/png" }),
    ).rejects.toThrow("R2 unavailable");
    expect(fs.existsSync(path.join(UPLOADS_ROOT, TEST_KEY))).toBe(false);
  });

  it("rejects partial R2 configuration and requires R2 in production", () => {
    setR2Env(false);
    process.env.R2_BUCKET = "partial";
    expect(() => validateObjectStorageConfig()).toThrow("incomplete");

    setR2Env(false);
    process.env.NODE_ENV = "production";
    expect(() => validateObjectStorageConfig()).toThrow("required in production");
  });

  it("only accepts application-owned media keys", () => {
    expect(isMediaObjectKey(TEST_KEY)).toBe(true);
    expect(isMediaObjectKey("private/database-backup.sql")).toBe(false);
    expect(isMediaObjectKey("covers/../../secret.png")).toBe(false);
  });

  it("recognizes owned URLs and ignores external URLs", () => {
    setR2Env(true);
    process.env.R2_PUBLIC_BASE_URL = "https://cdn.example.com";
    expect(storedMediaLocation(`https://cdn.example.com/${TEST_KEY}`)).toEqual({
      key: TEST_KEY,
      storage: "r2",
    });
    expect(storedMediaLocation("https://example.org/photo.png")).toBeNull();
  });

  it("does not treat an R2 delete as a local delete when unconfigured", async () => {
    setR2Env(false);
    await expect(deleteObject(TEST_KEY, "r2")).rejects.toThrow(
      "R2 is not configured",
    );
  });
});
