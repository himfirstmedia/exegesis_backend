import { normalizeFilters, listTags, listBooks } from "./service.js";

jest.mock("../../config/db.js", () => ({
  prisma: {
    journalEntry: {
      findMany: jest.fn(),
    },
  },
}));

const { prisma } = require("../../config/db.js");

describe("ledger filters", () => {
  test("normalizes paging, sort and the all-category sentinel", () => {
    expect(
      normalizeFilters({
        category: "all",
        page: "2",
        pageSize: "500",
        sort: "oldest",
        tag: "Faith",
      }),
    ).toEqual(
      expect.objectContaining({
        category: undefined,
        page: 2,
        pageSize: 50,
        sort: "oldest",
        tag: "Faith",
      }),
    );
  });

  test("falls back to newest and page one for invalid values", () => {
    expect(
      normalizeFilters({ page: "-3", pageSize: "nope", sort: "invalid" }),
    ).toEqual(
      expect.objectContaining({ page: 1, pageSize: 20, sort: "newest" }),
    );
  });
});

describe("ledger suggestions", () => {
  beforeEach(() => jest.clearAllMocks());

  test("aggregates comma separated tags with counts", async () => {
    prisma.journalEntry.findMany.mockResolvedValue([
      { tags: "Faith, trust" },
      { tags: "faith,Prayer" },
      { tags: null },
    ]);

    const result = await listTags("user-1");

    expect(result.returnData).toEqual([
      { tag: "Faith", count: 2 },
      { tag: "Prayer", count: 1 },
      { tag: "trust", count: 1 },
    ]);
  });

  test("returns distinct book names", async () => {
    prisma.journalEntry.findMany.mockResolvedValue([
      { bookName: "John" },
      { bookName: "Ruth" },
    ]);

    const result = await listBooks("user-1");

    expect(result.returnData).toEqual(["John", "Ruth"]);
  });
});
