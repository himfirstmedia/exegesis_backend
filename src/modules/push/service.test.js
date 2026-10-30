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
    pushSetting: {
      upsert: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    dailyVerse: {},
  },
}));

const { prisma } = require("../../config/db.js");
const {
  sendToUsers,
  unregisterToken,
  registerToken,
  updateSettings,
  getUsersDueForReminder,
} = require("./service.js");

describe("push sending", () => {
  beforeAll(() => {
    process.env.FIREBASE_PROJECT_ID = "push-project";
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({
      project_id: "push-project",
      client_email: "firebase-admin@example.test",
      private_key: "test-key",
    });
    process.env.CLIENT_URL = "https://app.example.test";
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.pushToken.deleteMany.mockResolvedValue({ count: 1 });
  });

  test("preserves same-origin links and builds high-priority multi-platform payloads", async () => {
    prisma.pushToken.findMany.mockResolvedValue([
      { token: "good-token", userId: "user-1" },
      { token: "wrong-project-token", userId: "user-1" },
      { token: "temporary-invalid-argument", userId: "user-1" },
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
    const payload = mockSendEach.mock.calls[0][0][0];
    expect(payload.token).toBe("good-token");
    expect(payload.notification).toEqual({ title: "Daily verse", body: "Read today" });
    expect(payload.android.priority).toBe("high");
    expect(payload.android.notification.channelId).toBe("exegesis-default");
    expect(payload.apns.headers["apns-priority"]).toBe("10");
    expect(payload.webpush.headers.Urgency).toBe("high");
    expect(payload.webpush.fcmOptions.link).toBe("https://app.example.test/verse");
    expect(payload.data).toMatchObject({
      link: "https://app.example.test/verse",
      verseId: "42",
      empty: "",
    });
    expect(typeof payload.data.sentAt).toBe("string");
    expect(prisma.pushToken.deleteMany).toHaveBeenCalledWith({
      where: { token: { in: ["wrong-project-token"] } },
    });
    expect(result).toMatchObject({ sent: 1, pruned: 1, acceptedUserIds: ["user-1"] });
  });

  test("rewrites external links to the client origin instead of trusting them", async () => {
    prisma.pushToken.findMany.mockResolvedValue([{ token: "t", userId: "user-1" }]);
    mockSendEach.mockResolvedValue({ successCount: 1, responses: [{ success: true }] });

    await sendToUsers(["user-1"], {
      title: "Support",
      body: "New reply",
      data: { link: "https://evil.example/phish" },
    });

    const payload = mockSendEach.mock.calls[0][0][0];
    expect(payload.webpush.fcmOptions.link).toBe("https://app.example.test/");
    expect(payload.data.link).toBe("https://app.example.test/");
  });

  test("filters by platform when requested", async () => {
    prisma.pushToken.findMany.mockResolvedValue([{ token: "web-token", userId: "user-1" }]);
    mockSendEach.mockResolvedValue({ successCount: 1, responses: [{ success: true }] });

    await sendToUsers(["user-1"], {
      title: "Daily verse",
      body: "Read today",
      platforms: ["web"],
      data: { link: "/daily-verse" },
    });

    expect(prisma.pushToken.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: { in: ["user-1"] }, platform: { in: ["web"] } },
      }),
    );
  });

  test('includes a support image in native notification payloads', async () => {
    prisma.pushToken.findMany.mockResolvedValue([{ token: 'device', userId: 'user-1' }]);
    mockSendEach.mockResolvedValue({ successCount: 1, responses: [{ success: true }] });
    const imageUrl = 'https://api.example.test/media/support/image.jpg';
    await sendToUsers(['user-1'], { title: 'Support', body: 'Photo', imageUrl,
      data: { kind: 'support-message', ticketId: '7', imageUrl } });
    const payload = mockSendEach.mock.calls[0][0][0];
    expect(payload.notification.imageUrl).toBe(imageUrl);
    expect(payload.apns.fcmOptions.imageUrl).toBe(imageUrl);
    expect(payload.apns.payload.aps.mutableContent).toBe(true);
    expect(payload.data.ticketId).toBe('7');
  });

  test("no-ops for empty user lists without touching FCM", async () => {
    const result = await sendToUsers([], { title: "x", body: "y" });
    expect(result).toEqual({ sent: 0, pruned: 0, acceptedUserIds: [] });
    expect(mockSendEach).not.toHaveBeenCalled();
  });

  test("only unregisters a token owned by the authenticated user", async () => {
    await unregisterToken("user-1", "device-token");

    expect(prisma.pushToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1", token: "device-token" },
    });
  });
});

describe("push settings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.pushSetting.upsert.mockResolvedValue({});
  });

  test("registerToken stores the platform and seeds a valid timezone", async () => {
    await registerToken("user-1", "token-abc", "ios", "Europe/Paris");

    expect(prisma.pushToken.upsert).toHaveBeenCalledWith({
      where: { token: "token-abc" },
      create: { userId: "user-1", token: "token-abc", platform: "ios" },
      update: expect.objectContaining({ userId: "user-1", platform: "ios" }),
    });
    expect(prisma.pushSetting.upsert).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      create: { userId: "user-1", timezone: "Europe/Paris" },
      update: { userId: "user-1" },
    });
  });

  test("registerToken ignores an invalid timezone", async () => {
    await registerToken("user-1", "token-abc", "web", "Not/AZone");
    expect(prisma.pushSetting.upsert).not.toHaveBeenCalled();
  });

  test("retains the uniqueness-race retry without changing saved preferences", async () => {
    prisma.pushSetting.upsert.mockRejectedValueOnce({ code: 'P2002' });
    prisma.pushSetting.update.mockResolvedValueOnce({ userId: 'user-1', timezone: 'Africa/Nairobi' });
    await expect(registerToken('user-1', 'token-abc', 'android', 'Europe/Paris')).resolves.toBeUndefined();
    expect(prisma.pushSetting.update).toHaveBeenCalledWith({ where: { userId: 'user-1' }, data: {} });
  });

  test("does not hide other database failures", async () => {
    prisma.pushSetting.upsert.mockRejectedValueOnce({ code: 'P1001' });
    await expect(registerToken('user-1', 'token-abc', 'android', 'UTC')).rejects.toMatchObject({ code: 'P1001' });
    expect(prisma.pushSetting.update).not.toHaveBeenCalled();
  });

  test("updateSettings rejects an invalid timezone with a 400", async () => {
    await expect(updateSettings("user-1", { timezone: "Bad/Zone" })).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(prisma.pushSetting.upsert).not.toHaveBeenCalled();
  });

  test("updateSettings drops malformed reminder times but keeps valid fields", async () => {
    await updateSettings("user-1", {
      dailyVerseReminder: true,
      reminderTime: "99:99",
      timezone: "UTC",
    });

    expect(prisma.pushSetting.upsert).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      create: { userId: "user-1", dailyVerseReminder: true, timezone: "UTC" },
      update: { userId: "user-1", dailyVerseReminder: true, timezone: "UTC" },
    });
  });
});

describe("getUsersDueForReminder", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns only users whose local reminder is due", async () => {
    prisma.pushSetting.findMany.mockResolvedValue([
      { userId: "due", dailyVerseReminder: true, reminderTime: "07:00", timezone: "America/New_York", lastPushedOn: null },
      { userId: "already", dailyVerseReminder: true, reminderTime: "07:00", timezone: "America/New_York", lastPushedOn: new Date("2026-01-15T12:01:00.000Z") },
      { userId: "not-yet", dailyVerseReminder: true, reminderTime: "22:00", timezone: "America/New_York", lastPushedOn: null },
    ]);

    const due = await getUsersDueForReminder(new Date("2026-01-15T12:02:00.000Z"));
    expect(due).toEqual(["due"]);
  });

  test("queries only enabled reminders", async () => {
    prisma.pushSetting.findMany.mockResolvedValue([]);
    await getUsersDueForReminder(new Date());
    expect(prisma.pushSetting.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { dailyVerseReminder: true } }),
    );
  });
});
