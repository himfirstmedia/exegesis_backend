const mockVerifyIdToken = jest.fn();
const mockStripeCustomerCreate = jest.fn();

jest.mock("google-auth-library", () => ({
  OAuth2Client: jest.fn(() => ({ verifyIdToken: mockVerifyIdToken })),
}));

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
    role: { findFirst: jest.fn() },
    activity: { create: jest.fn() },
  },
}));

jest.mock("../../../services/objectStorage.js", () => ({
  uploadObject: jest.fn(),
  deleteObject: jest.fn(),
  deleteStoredMedia: jest.fn(),
  contentTypeForExtension: jest.fn(),
}));

const { prisma } = require("../../../config/db.js");
const {
  completeGoogleRegistration,
  googleLogin,
} = require("../service.js");
const {
  generateGoogleRegistrationProof,
  verifyGoogleRegistrationProof,
  verifyToken,
} = require("../../../utils/helpers.js");

describe("Google authentication", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "google-auth-test-secret";
    process.env.GOOGLE_OAUTH_CLIENT_IDS = "web-client, android-client,web-client";
    process.env.GOOGLE_CLIENT_ID = "legacy-android-client";
    process.env.GOOGLE_WEB_CLIENT_ID = "legacy-web-client";
  });

  test("verifies the ID token and returns only identity from verified claims", async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: "google-subject-123",
        email: "Verified@Example.com",
        email_verified: true,
        given_name: "Verified",
        family_name: "Person",
        picture: "https://images.example/avatar.png",
      }),
    });
    prisma.systemUser.findFirst.mockResolvedValue(null);

    const result = await googleLogin({
      idToken: "raw-google-token",
      email: "attacker@example.com",
      firstName: "Attacker",
      photoUrl: "https://evil.example/avatar.png",
    });

    expect(mockVerifyIdToken).toHaveBeenCalledWith({
      idToken: "raw-google-token",
      audience: [
        "web-client",
        "android-client",
        "legacy-android-client",
        "legacy-web-client",
      ],
    });
    expect(result.status).toBe(201);
    expect(result.data).toMatchObject({
      email: "verified@example.com",
      firstName: "Verified",
      lastName: "Person",
      photoUrl: "https://images.example/avatar.png",
    });
    expect(result.data.googleId).toBe(result.data.registrationProof);
    expect(result.data.registrationProof).not.toContain("raw-google-token");

    const identity = verifyGoogleRegistrationProof(result.data.registrationProof);
    expect(identity).toMatchObject({
      googleSubject: "google-subject-123",
      email: "verified@example.com",
      firstName: "Verified",
    });
    expect(verifyToken(result.data.registrationProof)).toBeNull();
  });

  test("rejects an ID token that Google cannot verify", async () => {
    mockVerifyIdToken.mockRejectedValue(new Error("bad signature"));

    const result = await googleLogin({ idToken: "forged" });

    expect(result).toEqual({ status: 401, message: "Invalid Google ID token" });
    expect(prisma.systemUser.findFirst).not.toHaveBeenCalled();
  });

  test("rejects a verified token without a verified email", async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({ sub: "google-subject-123" }),
    });

    const result = await googleLogin({ idToken: "token-without-email" });

    expect(result).toEqual({ status: 401, message: "Google email is not verified" });
    expect(prisma.systemUser.findFirst).not.toHaveBeenCalled();
  });

  test("registers with proof identity and ignores client-supplied identity", async () => {
    const registrationProof = generateGoogleRegistrationProof({
      googleSubject: "google-subject-123",
      email: "verified@example.com",
      firstName: "Verified",
      lastName: "Person",
      photoUrl: "https://images.example/avatar.png",
    });
    prisma.systemUser.findFirst.mockResolvedValue(null);
    prisma.systemUser.create.mockImplementation(async ({ data }) => ({
      id: "user-1",
      ...data,
      coverPhotoUrl: null,
      accessExpiresAt: null,
    }));
    prisma.systemUser.update.mockResolvedValue({});
    prisma.role.findFirst.mockResolvedValue({ roleName: "Member" });
    mockStripeCustomerCreate.mockResolvedValue({ id: "cus_1" });

    const result = await completeGoogleRegistration({
      registrationProof,
      username: "newuser",
      password: "StrongPass1!",
      email: "attacker@example.com",
      firstName: "Attacker",
      lastName: "Override",
      photoUrl: "https://evil.example/avatar.png",
    });

    expect(result.status).toBe(200);
    expect(prisma.systemUser.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: "verified@example.com",
        firstName: "Verified",
        lastName: "Person",
        profilePhotoUrl: "https://images.example/avatar.png",
      }),
    });
  });

  test("rejects a registration without a valid signed proof", async () => {
    const result = await completeGoogleRegistration({
      registrationProof: "not-a-proof",
      username: "newuser",
      password: "StrongPass1!",
    });

    expect(result.status).toBe(401);
    expect(prisma.systemUser.findFirst).not.toHaveBeenCalled();
  });

  test("accepts the proof alias used by already-released clients", async () => {
    const googleId = generateGoogleRegistrationProof({
      googleSubject: "legacy-client-subject",
      email: "legacy@example.com",
      firstName: "Legacy",
      lastName: "Client",
    });
    prisma.systemUser.findFirst.mockResolvedValue(null);
    prisma.systemUser.create.mockImplementation(async ({ data }) => ({
      id: "legacy-user",
      ...data,
      coverPhotoUrl: null,
      accessExpiresAt: null,
    }));
    prisma.systemUser.update.mockResolvedValue({});
    prisma.role.findFirst.mockResolvedValue({ roleName: "Member" });
    mockStripeCustomerCreate.mockResolvedValue({ id: "cus_legacy" });

    const result = await completeGoogleRegistration({
      googleId,
      username: "legacyclient",
      password: "StrongPass1!",
    });

    expect(result.status).toBe(200);
    expect(prisma.systemUser.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ email: "legacy@example.com" }),
    });
  });
});
