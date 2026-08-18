import {
  addVerseExplanation,
  deleteVerseExplanation,
  getAllVersesExplanation,
} from '../service.js';

/**
 * Integration tests for the verse-explanation admin endpoints.
 * Follows the chapter-journal-prompts.test.ts convention: real DB, no mocks.
 * Test rows use a ref that cannot collide with real content (Genesis has 50
 * chapters) and are deleted after each test.
 */
const TEST_REF = { bookName: 'Genesis', chapter: 998, verseNumber: 998 };

const createTestRow = async (overrides: Record<string, unknown> = {}) =>
  addVerseExplanation(
    {
      ...TEST_REF,
      ...overrides,
      explanation: 'Backend unit test row',
    },
    'test-user',
  );

const deleteRow = async (id: unknown) =>
  deleteVerseExplanation({ id: Number(id) }, 'test-user');

describe('getAllVersesExplanation', () => {
  it('returns paginated results with totals', async () => {
    const result = await getAllVersesExplanation({ page: 1, pageSize: 5 });
    expect(result.status).toBe(200);
    expect(result.data.explanations.length).toBe(5);
    expect(result.data.page).toBe(1);
    expect(result.data.pageSize).toBe(5);
    expect(result.data.totalCount).toBeGreaterThanOrEqual(5);
    expect(result.data.totalPages).toBe(Math.ceil(result.data.totalCount / 5));
  });

  it('advances pages without overlapping rows', async () => {
    const [p1, p2] = await Promise.all([
      getAllVersesExplanation({ page: 1, pageSize: 4 }),
      getAllVersesExplanation({ page: 2, pageSize: 4 }),
    ]);
    const ids1 = new Set(p1.data.explanations.map((e: any) => String(e.id)));
    for (const e of p2.data.explanations) {
      expect(ids1.has(String(e.id))).toBe(false);
    }
    expect(p2.data.page).toBe(2);
  });

  it('lists in canonical Bible order (Genesis before 2 Corinthians)', async () => {
    const result = await getAllVersesExplanation({ page: 1, pageSize: 50 });
    const names = result.data.explanations.map((e: any) => e.bookName);
    const firstGenesis = names.indexOf('Genesis');
    const first2Cor = names.indexOf('2 Corinthians');
    expect(firstGenesis).toBeGreaterThanOrEqual(0);
    expect(first2Cor).toBeGreaterThanOrEqual(0);
    expect(firstGenesis).toBeLessThan(first2Cor);
  });

  it('filters by bookName', async () => {
    const result = await getAllVersesExplanation({
      page: 1,
      pageSize: 50,
      bookName: 'Genesis',
    });
    expect(result.status).toBe(200);
    expect(result.data.totalCount).toBeGreaterThan(0);
    for (const e of result.data.explanations) {
      expect(e.bookName).toBe('Genesis');
    }
  });

  it('searches across book name and explanation text', async () => {
    const byBook = await getAllVersesExplanation({
      page: 1,
      pageSize: 50,
      search: 'Corinthians',
    });
    expect(byBook.data.totalCount).toBeGreaterThan(0);

    const byText = await getAllVersesExplanation({
      page: 1,
      pageSize: 50,
      search: 'new creation',
    });
    expect(byText.data.totalCount).toBeGreaterThan(0);
    for (const e of byText.data.explanations) {
      const haystack = `${e.bookName} ${e.explanation || ''} ${e.learnMore || ''}`.toLowerCase();
      expect(haystack).toContain('new creation');
    }
  });

  it('combines bookName and search filters (AND)', async () => {
    const result = await getAllVersesExplanation({
      page: 1,
      pageSize: 50,
      bookName: '2 Corinthians',
      search: 'new',
    });
    expect(result.status).toBe(200);
    for (const e of result.data.explanations) {
      expect(e.bookName).toBe('2 Corinthians');
    }
  });

  it('ignores a whitespace-only search term', async () => {
    const [plain, spaced] = await Promise.all([
      getAllVersesExplanation({ page: 1, pageSize: 50 }),
      getAllVersesExplanation({ page: 1, pageSize: 50, search: '   ' }),
    ]);
    expect(spaced.data.totalCount).toBe(plain.data.totalCount);
  });
});

describe('addVerseExplanation', () => {
  it('creates a new explanation', async () => {
    const created = await createTestRow();
    expect(created.status).toBe(200);
    expect(created.data.id).toBeTruthy();
    expect(created.data.bookName).toBe(TEST_REF.bookName);
    expect(created.data.explanation).toBe('Backend unit test row');
    await deleteRow(created.data.id);
  });

  it('updates an existing explanation by id', async () => {
    const created = await createTestRow();
    const updated = await addVerseExplanation(
      {
        id: Number(created.data.id),
        ...TEST_REF,
        explanation: 'Updated by unit test',
        learnMore: 'New learn more',
        bibleVersion: 'KJV',
      },
      'test-user',
    );
    expect(updated.status).toBe(200);
    expect(updated.data.explanation).toBe('Updated by unit test');
    expect(updated.data.learnMore).toBe('New learn more');
    expect(updated.data.bibleVersion).toBe('KJV');
    await deleteRow(created.data.id);
  });

  it('assigns a canonical sortOrder on create', async () => {
    const created = await createTestRow({ bookName: '2 Samuel' });
    expect(created.status).toBe(200);
    // 2 Samuel is the 10th book (index 9); Genesis rows are 0.
    expect(created.data.sortOrder).toBe(9);
    await deleteRow(created.data.id);
  });

  it('returns 400 when bookName is missing', async () => {
    const result = await addVerseExplanation(
      { chapter: 1, verseNumber: 1 },
      'test-user',
    );
    expect(result.status).toBe(400);
  });

  it('returns 400 when chapter is missing', async () => {
    const result = await addVerseExplanation(
      { bookName: 'Genesis', verseNumber: 1 },
      'test-user',
    );
    expect(result.status).toBe(400);
  });

  it('returns 400 when verseNumber is missing', async () => {
    const result = await addVerseExplanation(
      { bookName: 'Genesis', chapter: 1 },
      'test-user',
    );
    expect(result.status).toBe(400);
  });
});

describe('deleteVerseExplanation', () => {
  it('deletes an existing explanation', async () => {
    const created = await createTestRow();
    const deleted = await deleteRow(created.data.id);
    expect(deleted.status).toBe(200);
  });

  it('returns 400 when id is missing', async () => {
    const result = await deleteVerseExplanation({}, 'test-user');
    expect(result.status).toBe(400);
  });
});
