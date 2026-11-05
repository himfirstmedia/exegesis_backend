jest.mock("stripe", () => ({
  __esModule: true,
  default: jest.fn(() => ({ customers: { create: jest.fn() } })),
}));

jest.mock("../../../config/db.js", () => ({
  prisma: {
    systemUser: { findFirst: jest.fn(), update: jest.fn() },
    verification: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
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
const { resendVerification, forgotPassword, resetPassword } = require("../service.js");

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

  test("recovery gives identical public responses for known, unknown, disabled and throttled accounts", async () => {
    const known = await forgotPassword({ email: user.email });
    jest.clearAllMocks();
    prisma.systemUser.findFirst.mockResolvedValueOnce(null);
    expect(await forgotPassword({ email: 'missing@example.com' })).toEqual(known);
    expect(prisma.message.create).not.toHaveBeenCalled();
    prisma.systemUser.findFirst.mockResolvedValueOnce({ ...user, status: false });
    expect(await forgotPassword({ email: user.email })).toEqual(known);
    expect(prisma.message.create).not.toHaveBeenCalled();
    prisma.systemUser.findFirst.mockResolvedValueOnce(user);
    prisma.verification.findMany.mockResolvedValueOnce([{}, {}, {}]);
    expect(await forgotPassword({ email: user.email })).toEqual(known);
    expect(prisma.message.create).not.toHaveBeenCalled();
  });

  test("normalizes the recovery address before lookup", async () => {
    await forgotPassword({ email: ' Reader@Example.com ' });
    expect(prisma.systemUser.findFirst).toHaveBeenCalledWith({ where: { email: user.email } });
  });

  test("invalid reset codes do not reveal whether an account exists", async () => {
    prisma.systemUser.findFirst.mockResolvedValueOnce(null);
    const missing = await resetPassword({ email: 'missing@example.com', code: '000000', newPassword: 'Secure123!' });
    prisma.verification.findFirst.mockResolvedValueOnce(null);
    const known = await resetPassword({ email: user.email, code: '000000', newPassword: 'Secure123!' });
    expect(missing).toEqual(known);
    expect(missing).toEqual({ status: 400, message: 'Invalid reset code' });
  });

  test("still refuses a resend while three unexpired codes exist", async () => {
    prisma.verification.findMany.mockResolvedValue([{}, {}, {}]);
    const result = await resendVerification({ email: user.email });
    expect(result.status).toBe(201);
    expect(prisma.message.create).not.toHaveBeenCalled();
  });
});
