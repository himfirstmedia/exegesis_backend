import { addHighlight, deleteHighlight, getHighlights } from "../service.js";
import { prisma } from "../../../config/db.js";
import { randomUUID } from 'node:crypto';

jest.setTimeout(20000);

let userId: string;
const REFERENCE = {
  bookName: "Genesis",
  chapter: 997,
  verseNumber: 997,
};

describe("offline highlight deletion", () => {
  beforeAll(async () => {
    const suffix = randomUUID();
    const user = await prisma.systemUser.create({ data: {
      firstName: 'Highlight', lastName: 'Test',
      username: `test-${suffix}`, email: `test-${suffix}@example.invalid`,
      gender: 'Not Specified', phoneNumber: '', password: 'not-a-login-password',
    } });
    userId = user.id;
  });

  beforeEach(async () => {
    await deleteHighlight(REFERENCE, userId);
  });

  afterAll(async () => {
    if (userId) {
      await deleteHighlight(REFERENCE, userId);
      await prisma.systemUser.delete({ where: { id: userId } });
    }
    await prisma.$disconnect();
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
