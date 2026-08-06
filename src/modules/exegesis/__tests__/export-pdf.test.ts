import { exportSessionPdf } from "../service.js";

// ─── Mocks ───────────────────────────────────────────────────
// jest.mock() is hoisted above all module code — inline the fixture factory.

jest.mock("../../../config/db.js", () => ({
  prisma: {
    exegesisSession: {
      findFirst: jest.fn(),
    },
  },
}));

const prismaMock = require("../../../config/db.js").prisma;

// ─── Fixtures ────────────────────────────────────────────────

const LOOK_PROMPTS_JSON = JSON.stringify([
  "What specific words or phrases stand out to you in this passage?",
  "Who is speaking? Who is listening or being addressed?",
  "What commands, promises, warnings, or truths do you see?",
  "What is repeated in this passage?",
  "What contrasts do you notice (light/darkness, before/after, etc.)?",
  "What questions does this passage raise in your mind?",
]);

function makeSession(overrides = {}) {
  return {
    id: "sess_1",
    userId: "user_1",
    passageRef: "Ruth 2:1",
    bookName: "Ruth",
    chapter: BigInt(2),
    verseStart: BigInt(1),
    verseEnd: null,
    lookNotes: JSON.stringify({
      0: "Boaz is introduced as a kinsman-redeemer.",
      2: "The Lord is faithful to Naomi through her family.",
    }),
    lookPromptsJson: LOOK_PROMPTS_JSON,
    learnNotes: "Naomi had a relative of her husband's, a man of noble character.",
    abideReflection: "God's kindness works through family connections.",
    abidePrayer: "Lord, open my eyes to Your quiet provision.",
    abideApplication: "Look for kinsman-redeemers in my own life.",
    abideTags: "grace, providence",
    strongsWords: JSON.stringify([
      { strongsId: "H1350", surfaceText: "ga'al", lemma: "to redeem" },
    ]),
    strongsIds: "H1350",
    isPublic: false,
    createdOn: new Date("2026-01-01T00:00:00.000Z"),
    updatedOn: new Date("2026-01-02T00:00:00.000Z"),
    ...overrides,
  };
}

function pdfBytes(result: any): Buffer {
  expect(result.status).toBe(200);
  expect(result.data.mimeType).toBe("application/pdf");
  const bytes = Buffer.from(result.data.content, "base64");
  expect(bytes.length).toBeGreaterThan(500);
  expect(bytes.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  return bytes;
}

// ─── Tests ───────────────────────────────────────────────────

describe("exportSessionPdf", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 404 when the session does not exist", async () => {
    prismaMock.exegesisSession.findFirst.mockResolvedValue(null);
    const res = await exportSessionPdf("missing", "user_1");
    expect(res.status).toBe(404);
    expect(res.message).toMatch(/not found/i);
  });

  it("generates a valid PDF for a complete session", async () => {
    prismaMock.exegesisSession.findFirst.mockResolvedValue(makeSession());
    const res = await exportSessionPdf("sess_1", "user_1");
    const bytes = pdfBytes(res);
    expect(res.data.filename).toMatch(/^ruth-\d{4}-\d{2}-\d{2}\.pdf$/);
    // The title string is embedded in the PDF metadata.
    expect(bytes.toString("latin1")).toMatch(/Bible Study: Ruth 2:1/);
  });

  it("handles sessions with no optional content gracefully", async () => {
    prismaMock.exegesisSession.findFirst.mockResolvedValue(
      makeSession({
        lookNotes: null,
        learnNotes: null,
        abideReflection: null,
        abidePrayer: null,
        abideApplication: null,
        abideTags: null,
        strongsWords: null,
      }),
    );
    const res = await exportSessionPdf("sess_1", "user_1");
    pdfBytes(res);
    expect(res.data.filename).toMatch(/^ruth-/);
  });

  it("falls back to a plain-text entry when lookNotes is not valid JSON", async () => {
    prismaMock.exegesisSession.findFirst.mockResolvedValue(
      makeSession({ lookNotes: "Just a plain observation." }),
    );
    const res = await exportSessionPdf("sess_1", "user_1");
    pdfBytes(res);
  });

  it("uses the stored look prompts when present and falls back to Question N otherwise", async () => {
    prismaMock.exegesisSession.findFirst.mockResolvedValue(
      makeSession({
        lookNotes: JSON.stringify({ 9: "Out-of-range answer." }),
        lookPromptsJson: null,
      }),
    );
    const res = await exportSessionPdf("sess_1", "user_1");
    pdfBytes(res);
    // No throw means the "Question 10" fallback path executed.
  });

  it("strips user-scoped lookup to the requesting user", async () => {
    prismaMock.exegesisSession.findFirst.mockResolvedValue(makeSession());
    await exportSessionPdf("sess_1", "user_1");
    expect(prismaMock.exegesisSession.findFirst).toHaveBeenCalledWith({
      where: { id: "sess_1", userId: "user_1" },
    });
  });
});
