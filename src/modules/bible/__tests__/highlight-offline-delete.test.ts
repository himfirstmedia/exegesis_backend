import { addHighlight, deleteHighlight, getHighlights } from "../service.js";
import { prisma } from "../../../config/db.js";

jest.setTimeout(20000);

let userId: string;
const REFERENCE = {
  bookName: "Genesis",
  chapter: 997,
  verseNumber: 997,
};

describe("offline highlight deletion", () => {
  beforeAll(async () => {
    const user = await prisma.systemUser.findFirst({ select: { id: true } });
    if (!user) throw new Error("Highlight tests require a seeded user");
    userId = user.id;
  });

  beforeEach(async () => {
    await deleteHighlight(REFERENCE, userId);
  });

  afterAll(async () => {
    await deleteHighlight(REFERENCE, userId);
  });

  it("deletes by verse reference without requiring a server-generated ID", async () => {
    const added = await addHighlight(
      { ...REFERENCE, colorId: 3 },
      userId,
    );
    expect(added.status).toBe(200);
    expect(added.data).toHaveLength(1);

    const removed = await deleteHighlight(REFERENCE, userId);
    expect(removed.status).toBe(200);

    const fetched = await getHighlights(REFERENCE, userId);
    expect(fetched.status).toBe(200);
    expect(fetched.data.highlights).toEqual([]);
  });

  it("is safe to replay the same queued deletion", async () => {
    await expect(deleteHighlight(REFERENCE, userId)).resolves.toMatchObject({
      status: 200,
    });
  });
});
