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

/**
 * ── Admin Analytics ───────────────────────────────────────────────────────────
 */

export const getAdminOverviewStats = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalParticipantsResult, totalAnswers, todayAnswers, allAnswers] = await Promise.all([
    prisma.triviaAnswer.findMany({
      distinct: ['userId'],
      select: { userId: true },
    }),
    prisma.triviaAnswer.count(),
    prisma.triviaAnswer.count({ where: { answeredOn: { gte: today } } }),
    prisma.triviaAnswer.findMany({
      select: { isCorrect: true, userId: true },
    }),
  ]);

  const totalParticipants = totalParticipantsResult.length;

  // Per-user percentages
  const userMap = {};
  for (const a of allAnswers) {
    if (!userMap[a.userId]) userMap[a.userId] = { total: 0, correct: 0 };
    userMap[a.userId].total++;
    if (a.isCorrect) userMap[a.userId].correct++;
  }

  const userPercentages = Object.values(userMap).map(
    u => (u.total > 0 ? u.correct / u.total : 0),
  );
  const averageScore =
    userPercentages.length > 0
      ? Math.round(
          (userPercentages.reduce((s, p) => s + p, 0) / userPercentages.length) * 100,
        )
      : 0;

  // Daily active
  const dailyActiveResult = await prisma.triviaAnswer.findMany({
    where: { answeredOn: { gte: today } },
    distinct: ['userId'],
    select: { userId: true },
  });

  // Per-difficulty breakdown
  const answersWithDifficulty = await prisma.triviaAnswer.findMany({
    select: {
      isCorrect: true,
      question: { select: { difficulty: true } },
    },
  });

  const difficultyBreakdown = {};
  for (const a of answersWithDifficulty) {
    const diff = a.question?.difficulty || 'medium';
    if (!difficultyBreakdown[diff]) difficultyBreakdown[diff] = { total: 0, correct: 0 };
    difficultyBreakdown[diff].total++;
    if (a.isCorrect) difficultyBreakdown[diff].correct++;
  }

  return {
    status: 200,
    message: 'Admin trivia overview stats',
    data: {
      totalParticipants,
      totalAnswers,
      averageScore,
      dailyActiveParticipants: dailyActiveResult.length,
      todayAnswers,
      difficultyBreakdown,
    },
  };
};

export const getUserPerformanceList = async (body) => {
  const page = body?.page || 0;
  const pageSize = body?.pageSize || 50;
  const { search, sortBy, sortOrder } = body || {};

  const userWhere = {
    triviaAnswers: { some: {} },
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const total = await prisma.systemUser.count({ where: userWhere });

  const users = await prisma.systemUser.findMany({
    where: userWhere,
    select: { id: true, firstName: true, lastName: true, email: true },
    skip: page * pageSize,
    take: pageSize,
  });

  const userIds = users.map(u => u.id);

  const [totalCounts, correctCounts, lastDates] = await Promise.all([
    prisma.triviaAnswer.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds } },
      _count: { id: true },
    }),
    prisma.triviaAnswer.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds }, isCorrect: true },
      _count: { id: true },
    }),
    prisma.triviaAnswer.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds } },
      _max: { answeredOn: true },
    }),
  ]);

  const totalMap = Object.fromEntries(totalCounts.map(r => [r.userId, r._count.id]));
  const correctMap = Object.fromEntries(correctCounts.map(r => [r.userId, r._count.id]));
  const lastDateMap = Object.fromEntries(lastDates.map(r => [r.userId, r._max.answeredOn]));

  const data = users.map(u => {
    const totalAns = totalMap[u.id] || 0;
    const correctAns = correctMap[u.id] || 0;
    return {
      userId: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      totalAnswered: totalAns,
      correct: correctAns,
      incorrect: totalAns - correctAns,
      percentage: totalAns > 0 ? Math.round((correctAns / totalAns) * 100) : 0,
      lastAnsweredDate: lastDateMap[u.id] || null,
    };
  });

  // Sort in JS
  const validSortBy =
    sortBy && ['totalAnswered', 'correct', 'percentage', 'lastAnsweredDate'].includes(sortBy)
      ? sortBy
      : 'lastAnsweredDate';
  const order = sortOrder === 'asc' ? 1 : -1;
  data.sort((a, b) => {
    const aVal = a[validSortBy] ?? '';
    const bVal = b[validSortBy] ?? '';
    return aVal < bVal ? -order : aVal > bVal ? order : 0;
  });

  return {
    status: 200,
    message: 'User performance list',
    data: { data, total, hasNext: (page + 1) * pageSize < total },
  };
};

export const getUserPerformanceDetail = async (userId) => {
  const user = await prisma.systemUser.findUnique({
    where: { id: userId },
    select: { id: true, firstName: true, lastName: true, email: true, createdOn: true },
  });

  if (!user) {
    return { status: 404, message: 'User not found' };
  }

  const [total, correct, answers] = await Promise.all([
    prisma.triviaAnswer.count({ where: { userId } }),
    prisma.triviaAnswer.count({ where: { userId, isCorrect: true } }),
    prisma.triviaAnswer.findMany({
      where: { userId },
      include: {
        question: {
          select: {
            id: true,
            question: true,
            difficulty: true,
            category: true,
            correctAnswer: true,
            optionsJson: true,
          },
        },
      },
      orderBy: { answeredOn: 'desc' },
      take: 200,
    }),
  ]);

  const serializedAnswers = answers.map(a =>
    serializeBigInt({
      id: a.id,
      questionId: a.questionId,
      selectedAnswer: a.selectedAnswer,
      isCorrect: a.isCorrect,
      answeredOn: a.answeredOn,
      question: a.question.question,
      difficulty: a.question.difficulty,
      category: a.question.category,
    }),
  );

  return {
    status: 200,
    message: 'User performance detail',
    data: {
      user: serializeBigInt(user),
      stats: {
        totalAnswered: total,
        correct,
        incorrect: total - correct,
        percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
      },
      answers: serializedAnswers,
    },
  };
};

export const getQuestionPerformanceStats = async (body) => {
  const page = body?.page || 0;
  const pageSize = body?.pageSize || 50;
  const { search, difficulty, category, sortBy, sortOrder } = body || {};

  const where = {};
  if (difficulty) where.difficulty = difficulty;
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { question: { contains: search, mode: 'insensitive' } },
    ];
  }

  const total = await prisma.triviaQuestion.count({ where });

  const questions = await prisma.triviaQuestion.findMany({
    where,
    select: { id: true, question: true, difficulty: true, category: true },
    skip: page * pageSize,
    take: pageSize,
  });

  const questionIds = questions.map(q => q.id);

  const [totalCounts, correctCounts] = await Promise.all([
    prisma.triviaAnswer.groupBy({
      by: ['questionId'],
      where: { questionId: { in: questionIds } },
      _count: { id: true },
    }),
    prisma.triviaAnswer.groupBy({
      by: ['questionId'],
      where: { questionId: { in: questionIds }, isCorrect: true },
      _count: { id: true },
    }),
  ]);

  const totalMap = Object.fromEntries(totalCounts.map(r => [r.questionId.toString(), r._count.id]));
  const correctMap = Object.fromEntries(correctCounts.map(r => [r.questionId.toString(), r._count.id]));

  const data = questions.map(q => {
    const qId = q.id.toString();
    const timesAnswered = totalMap[qId] || 0;
    const timesCorrect = correctMap[qId] || 0;
    return {
      questionId: serializeBigInt(q).id,
      question: q.question,
      difficulty: q.difficulty,
      category: q.category,
      timesAnswered,
      timesCorrect,
      timesIncorrect: timesAnswered - timesCorrect,
      percentage: timesAnswered > 0 ? Math.round((timesCorrect / timesAnswered) * 100) : 0,
    };
  });

  const validSortBy =
    sortBy && ['timesAnswered', 'percentage', 'timesCorrect'].includes(sortBy)
      ? sortBy
      : 'timesAnswered';
  const order = sortOrder === 'asc' ? 1 : -1;
  data.sort((a, b) => {
    const aVal = a[validSortBy] ?? 0;
    const bVal = b[validSortBy] ?? 0;
    return aVal < bVal ? -order : aVal > bVal ? order : 0;
  });

  return {
    status: 200,
    message: 'Question performance stats',
    data: { data, total, hasNext: (page + 1) * pageSize < total },
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
