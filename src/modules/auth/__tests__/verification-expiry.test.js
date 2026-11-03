jest.mock("stripe", () => ({
  __esModule: true,
  default: jest.fn(() => ({ customers: { create: jest.fn() } })),
}));

jest.mock("../../../config/db.js", () => ({
  prisma: {
    systemUser: { findFirst: jest.fn(), update: jest.fn() },
    verification: { findMany: jest.fn(), create: jest.fn() },
    message: { create: jest.fn() },
    role: { findFirst: jest.fn() },
    activity: { create: jest.fn() },
  },
}));

jest.mock("../../../services/objectStorage.js", () => ({
  readUiPackObject: jest.fn().mockResolvedValue(null),
  uploadObject: jest.fn(),
  deleteObject: jest.fn(),
  deleteStoredMedia: jest.fn(),
  contentTypeForExtension: jest.fn(),
}));

const { prisma } = require("../../../config/db.js");
const { resendVerification, forgotPassword } = require("../service.js");

const user = {
  id: "user-1",
  email: "reader@example.com",
  firstName: "Read",
  emailVerified: true,
  status: true,
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env.VERIFICATION_CODE_SECRET = "verification-expiry-test-secret";
  prisma.systemUser.findFirst.mockResolvedValue(user);
  prisma.verification.findMany.mockResolvedValue([]);
  prisma.verification.create.mockResolvedValue({});
  prisma.message.create.mockResolvedValue({});
});

describe("expired verification codes do not block new emails", () => {
  test("resend-verification only counts unexpired codes", async () => {
    const result = await resendVerification({ email: user.email });
    const { where } = prisma.verification.findMany.mock.calls[0][0];
    expect(where.expiresAt).toEqual({ gt: expect.any(Date) });
    expect(result.status).toBe(200);
    expect(prisma.message.create).toHaveBeenCalledTimes(1);
  });

  test("forgot-password only counts unexpired reset codes", async () => {
    const result = await forgotPassword({ email: user.email });
    const { where } = prisma.verification.findMany.mock.calls[0][0];
    expect(where.expiresAt).toEqual({ gt: expect.any(Date) });
    expect(result.status).toBe(200);
    expect(prisma.message.create).toHaveBeenCalledTimes(1);
  });

  test("still refuses a resend while three unexpired codes exist", async () => {
    prisma.verification.findMany.mockResolvedValue([{}, {}, {}]);
    const result = await resendVerification({ email: user.email });
    expect(result.status).toBe(201);
    expect(prisma.message.create).not.toHaveBeenCalled();
  });
});