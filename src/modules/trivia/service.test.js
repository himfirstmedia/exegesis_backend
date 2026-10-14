import { prisma } from '../../config/db.js';
import { getOfflinePack, submitAnswer } from './service.js';

jest.mock('../../config/db.js', () => ({
  prisma: {
    triviaQuestion: { findUnique: jest.fn(), findMany: jest.fn() },
    triviaAnswer: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      groupBy: jest.fn(),
    },
  },
}));

const question = {
  id: 7n,
  optionsJson: JSON.stringify(['Noah', 'Moses', 'David', 'Paul']),
  correctAnswer: 0,
  explanation: 'Noah built the ark.',
};

describe('submitAnswer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.triviaQuestion.findUnique.mockResolvedValue(question);
    prisma.triviaAnswer.groupBy.mockResolvedValue([
      { selectedAnswer: 0, _count: { _all: 8 } },
      { selectedAnswer: 1, _count: { _all: 3 } },
    ]);
  });

  test('returns zero-filled option counts after recording an answer', async () => {
    prisma.triviaAnswer.findUnique.mockResolvedValue(null);
    prisma.triviaAnswer.create.mockResolvedValue({
      selectedAnswer: 1,
      isCorrect: false,
    });

    const result = await submitAnswer('user-1', {
      questionId: 7,
      selectedAnswer: 1,
    });

    expect(result.status).toBe(200);
    expect(result.data).toMatchObject({
      selectedAnswer: 1,
      isCorrect: false,
      duplicate: false,
      optionSelectionCounts: [8, 3, 0, 0],
      totalSelections: 11,
    });
  });

  test('returns the original answer for an idempotent duplicate', async () => {
    prisma.triviaAnswer.findUnique.mockResolvedValue({
      selectedAnswer: 0,
      isCorrect: true,
    });

    const result = await submitAnswer('user-1', {
      questionId: 7,
      selectedAnswer: 2,
    });

    expect(prisma.triviaAnswer.create).not.toHaveBeenCalled();
    expect(result.status).toBe(200);
    expect(result.message).toBe('Answer already recorded');
    expect(result.data).toMatchObject({
      selectedAnswer: 0,
      isCorrect: true,
      duplicate: true,
    });
  });

  test('recovers a concurrent unique-constraint race as a duplicate', async () => {
    prisma.triviaAnswer.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ selectedAnswer: 1, isCorrect: false });
    prisma.triviaAnswer.create.mockRejectedValue({ code: 'P2002' });

    const result = await submitAnswer('user-1', {
      questionId: 7,
      selectedAnswer: 1,
    });

    expect(result.status).toBe(200);
    expect(result.data.duplicate).toBe(true);
  });

  test.each([-1, 1.5, 4, 'bad'])('rejects invalid option %p', async selectedAnswer => {
    const result = await submitAnswer('user-1', {
      questionId: 7,
      selectedAnswer,
    });

    expect(result).toEqual({ status: 400, message: 'selectedAnswer is invalid' });
    expect(prisma.triviaAnswer.create).not.toHaveBeenCalled();
  });
});

describe('getOfflinePack', () => {
  test('returns only live questions not already answered or excluded locally', async () => {
    prisma.triviaAnswer.findMany.mockResolvedValue([{ questionId: 2n }]);
    prisma.triviaQuestion.findMany.mockResolvedValue([
      { ...question, id: 7n },
    ]);

    const result = await getOfflinePack('user-1', {
      limit: 25,
      excludeIds: [3],
    });

    expect(prisma.triviaQuestion.findMany).toHaveBeenCalledWith({
      where: { isActive: true, id: { notIn: [2n, 3n] } },
      orderBy: { createdOn: 'desc' },
      take: 25,
    });
    expect(result.data).toMatchObject({ total: 1, data: [{ id: 7 }] });
  });
});
