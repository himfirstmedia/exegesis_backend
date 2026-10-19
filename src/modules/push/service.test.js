const mockSendEach = jest.fn();
const mockInitializeApp = jest.fn();
const mockCert = jest.fn((value) => value);

jest.mock("firebase-admin/app", () => ({
  initializeApp: mockInitializeApp,
  getApps: jest.fn(() => []),
  cert: mockCert,
}));

jest.mock("firebase-admin/messaging", () => ({
  getMessaging: jest.fn(() => ({ sendEach: mockSendEach })),
}));

jest.mock("../../config/db.js", () => ({
  prisma: {
    pushToken: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      upsert: jest.fn(),
    },
    pushSetting: {},
    dailyVerse: {},
  },
}));

const { prisma } = require("../../config/db.js");
const { sendToUsers, unregisterToken } = require("./service.js");

describe("push sending", () => {
  beforeAll(() => {
    process.env.FIREBASE_PROJECT_ID = "push-project";
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({
      project_id: "push-project",
      client_email: "firebase-admin@example.test",
      private_key: "test-key",
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.pushToken.deleteMany.mockResolvedValue({ count: 1 });
  });

  test("uses Firebase Admin v13 sendEach and preserves web push data and link", async () => {
    prisma.pushToken.findMany.mockResolvedValue([
      { token: "good-token" },
      { token: "wrong-project-token" },
      { token: "temporary-invalid-argument" },
    ]);
    mockSendEach.mockResolvedValue({
      successCount: 1,
      responses: [
        { success: true },
        { success: false, error: { code: "messaging/mismatched-credential" } },
        { success: false, error: { code: "messaging/invalid-argument" } },
      ],
    });

    const result = await sendToUsers(["user-1"], {
      title: "Daily verse",
      body: "Read today",
      data: { link: "https://app.example.test/verse", verseId: 42, empty: null },
    });

    expect(mockSendEach).toHaveBeenCalledTimes(1);
    expect(mockSendEach.mock.calls[0][0][0]).toEqual({
      token: "good-token",
      notification: { title: "Daily verse", body: "Read today" },
      webpush: { fcmOptions: { link: "https://app.example.test/verse" } },
      data: {
        link: "https://app.example.test/verse",
        verseId: "42",
        empty: "",
      },
    });
    expect(prisma.pushToken.deleteMany).toHaveBeenCalledWith({
      where: { token: { in: ["wrong-project-token"] } },
    });
    expect(result).toEqual({ sent: 1, pruned: 1 });
  });

  test("only unregisters a token owned by the authenticated user", async () => {
    await unregisterToken("user-1", "device-token");

    expect(prisma.pushToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1", token: "device-token" },
    });
  });
});
