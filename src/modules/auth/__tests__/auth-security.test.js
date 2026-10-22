const mockStripeCustomerCreate = jest.fn();

jest.mock("stripe", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    customers: { create: mockStripeCustomerCreate },
  })),
}));

jest.mock("../../../config/db.js", () => ({
  prisma: {
    systemUser: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    verification: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    role: { findFirst: jest.fn() },
    activity: { create: jest.fn() },
    message: { create: jest.fn() },
  },
}));

jest.mock("../../../services/objectStorage.js", () => ({
  uploadObject: jest.fn(),
  deleteObject: jest.fn(),
  deleteStoredMedia: jest.fn(),
  contentTypeForExtension: jest.fn(),
}));

const { prisma } = require("../../../config/db.js");
const { register, setPassword, verifyCode } = require("../service.js");
const {
  generatePasswordSetProof,
  verifyPasswordSetProof,
  generateToken,
  verifyToken,
  generateSixDigitCode,
} = require("../../../utils/helpers.js");

const existingUser = {
  id: "user-1",
  username: "reader",
  email: "reader@example.com",
  firstName: "Read",
  lastName: "Er",
  password: "hashed",
  userRole: 2n,
  emailVerified: false,
  status: true,
  subscriptionTier: "free",
};

describe("registration cannot self-assign a privileged role", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "auth-security-test-secret";
    prisma.systemUser.findFirst.mockResolvedValue(null);
    prisma.systemUser.create.mockImplementation(async ({ data }) => ({
      ...data,
      id: "new-user",
    }));
    prisma.role.findFirst.mockResolvedValue({ id: 2n, roleName: "USER" });
    prisma.message.create.mockResolvedValue({});
    prisma.verification.create.mockResolvedValue({});
  });

  test("ignores a caller-supplied admin userRole", async () => {
    await register({
      username: "attacker",
      email: "attacker@example.com",
      password: "Str0ng!Passw0rd",
      firstName: "At",
      lastName: "Tacker",
      userRole: 1,
    });

    expect(prisma.systemUser.create).toHaveBeenCalled();
    const { data } = prisma.systemUser.create.mock.calls[0][0];
    expect(Number(data.userRole)).toBe(2);
  });

  test("ignores a caller-supplied admin userRole sent as a string", async () => {
    await register({
      username: "attacker2",
      email: "attacker2@example.com",
      password: "Str0ng!Passw0rd",
      firstName: "At",
      lastName: "Tacker",
      userRole: "1",
    });

    const { data } = prisma.systemUser.create.mock.calls[0][0];
    expect(Number(data.userRole)).toBe(2);
  });
});

describe("set-password requires proof of email control", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "auth-security-test-secret";
    prisma.systemUser.findFirst.mockResolvedValue(existingUser);
    prisma.systemUser.update.mockResolvedValue({});
  });

  test("refuses to set a password with only an email address", async () => {
    const result = await setPassword({
      email: "reader@example.com",
      password: "N3w!Password",
    });

    expect(result.status).toBe(400);
    expect(prisma.systemUser.update).not.toHaveBeenCalled();
  });

  test("refuses a proof issued for a different email", async () => {
    const proof = generatePasswordSetProof({
      email: "someone-else@example.com",
      userId: "user-2",
    });

    const result = await setPassword({
      email: "reader@example.com",
      password: "N3w!Password",
      passwordSetProof: proof,
    });

    expect(result.status).toBe(400);
    expect(prisma.systemUser.update).not.toHaveBeenCalled();
  });

  test("refuses a garbage proof", async () => {
    const result = await setPassword({
      email: "reader@example.com",
      password: "N3w!Password",
      passwordSetProof: "not-a-real-proof",
    });

    expect(result.status).toBe(400);
    expect(prisma.systemUser.update).not.toHaveBeenCalled();
  });

  test("sets the password when the proof matches the email", async () => {
    const proof = generatePasswordSetProof({
      email: "reader@example.com",
      userId: "user-1",
    });

    const result = await setPassword({
      email: "reader@example.com",
      password: "N3w!Password",
      passwordSetProof: proof,
    });

    expect(result.status).toBe(200);
    expect(prisma.systemUser.update).toHaveBeenCalled();
  });

  test("the proof is bound to the email and expires", () => {
    const proof = generatePasswordSetProof({
      email: "reader@example.com",
      userId: "user-1",
    });
    const decoded = verifyPasswordSetProof(proof);
    expect(decoded.email).toBe("reader@example.com");
    expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });
});

describe("verify-code issues a password-set proof", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "auth-security-test-secret";
    prisma.systemUser.findFirst.mockResolvedValue(existingUser);
    prisma.systemUser.update.mockResolvedValue({});
    prisma.verification.findFirst.mockResolvedValue({
      id: 1n,
      code: require("../../../utils/codes.js").hashCode("123456"),
      expiresAt: new Date(Date.now() + 60_000),
      status: false,
    });
    prisma.verification.findMany.mockResolvedValue([]);
    prisma.verification.updateMany.mockResolvedValue({ count: 0 });
  });

  test("returns a usable proof after a valid code", async () => {
    const result = await verifyCode({
      email: "reader@example.com",
      code: "123456",
    });

    expect(result.status).toBe(200);
    expect(result.data?.passwordSetProof).toEqual(expect.any(String));
  });
});

describe("tokens and codes are not predictable", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "auth-security-test-secret";
  });

  test("generated tokens carry an expiry", () => {
    const token = generateToken({ id: "u1", username: "u", email: "e@x.com", userRole: 2 });
    const decoded = verifyToken(token);
    expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  test("a token expires once its window has passed", () => {
    const previous = process.env.JWT_EXPIRES_IN;
    process.env.JWT_EXPIRES_IN = "1s";
    jest.resetModules();
    // helpers.js reads JWT_EXPIRES_IN at import time.
    const { generateToken: freshGenerate } = require("../../../utils/helpers.js");
    const token = freshGenerate({ id: "u1", username: "u", email: "e@x.com", userRole: 2 });
    const decoded = require("jsonwebtoken").decode(token);
    expect(decoded.exp - decoded.iat).toBe(1);
    if (previous === undefined) delete process.env.JWT_EXPIRES_IN;
    else process.env.JWT_EXPIRES_IN = previous;
  });

  test("verification codes are six digits and vary between calls", () => {
    const codes = new Set();
    for (let i = 0; i < 50; i++) {
      const code = generateSixDigitCode();
      expect(code).toMatch(/^\d{6}$/);
      codes.add(code);
    }
    // A predictable generator would collapse to a handful of values.
    expect(codes.size).toBeGreaterThan(40);
  });
});
