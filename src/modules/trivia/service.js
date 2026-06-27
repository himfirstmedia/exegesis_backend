import { prisma } from '../../config/db.js';
import { serializeBigInt } from '../../utils/helpers.js';

/**
 * ── Admin CRUD ──────────────────────────────────────────────────────────────
 */

export const createQuestion = async (userId, body) => {
  const { question, optionsJson, correctAnswer, explanation, bookName, chapter, verseNumber, category, difficulty } = body;

  if (!question || !optionsJson || correctAnswer === undefined || correctAnswer === null) {
    return { status: 400, message: 'question, optionsJson, and correctAnswer are required' };
  }

  const created = await prisma.triviaQuestion.create({
    data: {
      question,
      optionsJson,
      correctAnswer: Number(correctAnswer),
      explanation: explanation || null,
      bookName: bookName || null,
      chapter: chapter ? BigInt(chapter) : null,
      verseNumber: verseNumber ? BigInt(verseNumber) : null,
      category: category || 'general',
      difficulty: difficulty || 'medium',
      createdBy: userId,
    },
  });

  return { status: 200, message: 'Trivia question created', data: serializeBigInt(created) };
};

export const updateQuestion = async (userId, body) => {
  const { id, question, optionsJson, correctAnswer, explanation, bookName, chapter, verseNumber, category, difficulty, isActive } = body;

  if (!id) {
    return { status: 400, message: 'id is required' };
  }

  const existing = await prisma.triviaQuestion.findUnique({ where: { id: BigInt(id) } });
  if (!existing) {
    return { status: 404, message: 'Question not found' };
  }

  const updateData = {};
  if (question !== undefined) updateData.question = question;
  if (optionsJson !== undefined) updateData.optionsJson = optionsJson;
  if (correctAnswer !== undefined) updateData.correctAnswer = Number(correctAnswer);
  if (explanation !== undefined) updateData.explanation = explanation;
  if (bookName !== undefined) updateData.bookName = bookName;
  if (chapter !== undefined) updateData.chapter = chapter ? BigInt(chapter) : null;
  if (verseNumber !== undefined) updateData.verseNumber = verseNumber ? BigInt(verseNumber) : null;
  if (category !== undefined) updateData.category = category;
  if (difficulty !== undefined) updateData.difficulty = difficulty;
  if (isActive !== undefined) updateData.isActive = isActive;
  updateData.updatedBy = userId;

  const updated = await prisma.triviaQuestion.update({
    where: { id: BigInt(id) },
    data: updateData,
  });

  return { status: 200, message: 'Trivia question updated', data: serializeBigInt(updated) };
};

export const deleteQuestion = async (id) => {
  const existing = await prisma.triviaQuestion.findUnique({ where: { id: BigInt(id) } });
  if (!existing) {
    return { status: 404, message: 'Question not found' };
  }

  await prisma.triviaQuestion.delete({ where: { id: BigInt(id) } });
  return { status: 200, message: 'Trivia question deleted' };
};

export const getQuestion = async (id) => {
  const question = await prisma.triviaQuestion.findUnique({ where: { id: BigInt(id) } });
  if (!question) {
    return { status: 404, message: 'Question not found' };
  }
  return { status: 200, message: 'Question found', data: serializeBigInt(question) };
};

export const getAllQuestions = async (body) => {
  const page = body?.page || 0;
  const pageSize = body?.pageSize || 50;
  const { category, difficulty, isActive, search } = body || {};

  const where = {};
  if (category) where.category = category;
  if (difficulty) where.difficulty = difficulty;
  if (isActive !== undefined) where.isActive = isActive;
  if (search) {
    where.OR = [
      { question: { contains: search, mode: 'insensitive' } },
      { explanation: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.triviaQuestion.findMany({
      where,
      orderBy: { createdOn: 'desc' },
      skip: page * pageSize,
      take: pageSize,
    }),
    prisma.triviaQuestion.count({ where }),
  ]);

  return {
    status: 200,
    message: 'Questions fetched',
    data: {
      data: data.map(d => serializeBigInt(d)),
      total,
      hasNext: (page + 1) * pageSize < total,
    },
  };
};

/**
 * ── User endpoints ──────────────────────────────────────────────────────────
 */

export const getRandomQuestion = async (userId, body) => {
  const { category, difficulty, excludeIds } = body || {};

  // Build filter: only active questions, optionally exclude already-answered ones
  const where = { isActive: true };

  if (category) where.category = category;
  if (difficulty) where.difficulty = difficulty;

  // Exclude questions the user has already answered
  if (userId) {
    const answered = await prisma.triviaAnswer.findMany({
      where: { userId },
      select: { questionId: true },
    });
    const answeredIds = answered.map(a => a.questionId);

    // Also exclude any client-provided excludeIds
    const exclude = [...answeredIds];
    if (excludeIds && Array.isArray(excludeIds)) {
      exclude.push(...excludeIds.map(id => BigInt(id)));
    }

    if (exclude.length > 0) {
      where.id = { notIn: exclude };
    }
  }

  // Count total available
  const total = await prisma.triviaQuestion.count({ where });

  if (total === 0) {
    return { status: 200, message: 'No more questions available', data: null };
  }

  // Pick a random offset
  const randomOffset = Math.floor(Math.random() * total);

  const question = await prisma.triviaQuestion.findFirst({
    where,
    skip: randomOffset,
    take: 1,
  });

  if (!question) {
    return { status: 200, message: 'No more questions available', data: null };
  }

  // Strip correctAnswer from the response — don't reveal it!
  const { correctAnswer, ...safeData } = question;
  const serialized = serializeBigInt(safeData);

  return {
    status: 200,
    message: 'Random question',
    data: { ...serialized, totalRemaining: total - 1 },
  };
};

export const submitAnswer = async (userId, body) => {
  const { questionId, selectedAnswer } = body;

  if (!questionId || selectedAnswer === undefined || selectedAnswer === null) {
    return { status: 400, message: 'questionId and selectedAnswer are required' };
  }

  // Check if already answered
  const existing = await prisma.triviaAnswer.findUnique({
    where: { userId_questionId: { userId, questionId: BigInt(questionId) } },
  });

  if (existing) {
    return { status: 400, message: 'Already answered this question' };
  }

  const question = await prisma.triviaQuestion.findUnique({
    where: { id: BigInt(questionId) },
  });

  if (!question) {
    return { status: 404, message: 'Question not found' };
  }

  const isCorrect = Number(selectedAnswer) === question.correctAnswer;

  await prisma.triviaAnswer.create({
    data: {
      userId,
      questionId: BigInt(questionId),
      selectedAnswer: Number(selectedAnswer),
      isCorrect,
    },
  });

  const options = JSON.parse(question.optionsJson || '[]');

  return {
    status: 200,
    message: isCorrect ? 'Correct!' : 'Incorrect',
    data: {
      isCorrect,
      correctAnswer: question.correctAnswer,
      correctAnswerText: options[question.correctAnswer] || '',
      explanation: question.explanation,
    },
  };
};

export const getUserStats = async (userId) => {
  const [total, correct] = await Promise.all([
    prisma.triviaAnswer.count({ where: { userId } }),
    prisma.triviaAnswer.count({ where: { userId, isCorrect: true } }),
  ]);

  return {
    status: 200,
    message: 'User trivia stats',
    data: {
      totalAnswered: total,
      correct,
      incorrect: total - correct,
      percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
    },
  };
};
