import { prisma } from '../../config/db.js';
import { serializeBigInt } from '../../utils/helpers.js';

const LOOK_PROMPTS = [
  'What specific words or phrases stand out to you in this passage?',
  'Who is speaking? Who is listening or being addressed?',
  'What commands, promises, warnings, or truths do you see?',
  'What is repeated in this passage?',
  'What contrasts do you notice (light/darkness, before/after, etc.)?',
  'What questions does this passage raise in your mind?',
];

export const startSession = async (userId, body) => {
  const { bookName, chapter, verseStart, verseEnd } = body;

  if (!bookName || !chapter) {
    return { status: 400, message: 'bookName and chapter are required' };
  }

  // Check for existing incomplete session
  const existing = await prisma.exegesisSession.findFirst({
    where: { userId, completed: false },
  });

  if (existing) {
    // Return existing session so user can continue
    return {
      status: 200,
      message: 'Continuing existing session',
      data: serializeBigInt(existing),
    };
  }

  const passageRef = verseStart
    ? `${bookName} ${chapter}:${verseStart}${verseEnd && verseEnd !== verseStart ? `-${verseEnd}` : ''}`
    : `${bookName} ${chapter}`;

  const session = await prisma.exegesisSession.create({
    data: {
      userId,
      passageRef,
      bookName,
      chapter: BigInt(chapter),
      verseStart: verseStart ? BigInt(verseStart) : null,
      verseEnd: verseEnd ? BigInt(verseEnd) : null,
      currentStage: 'look',
      lookPromptsJson: JSON.stringify(LOOK_PROMPTS),
    },
  });

  return {
    status: 200,
    message: 'Exegesis session started',
    data: serializeBigInt(session),
  };
};

export const getCurrentSession = async (userId) => {
  const session = await prisma.exegesisSession.findFirst({
    where: { userId, completed: false },
    orderBy: { createdOn: 'desc' },
  });

  if (!session) {
    return { status: 200, message: 'No active session', data: null };
  }

  return {
    status: 200,
    message: 'Active session found',
    data: serializeBigInt(session),
  };
};

export const getSessionHistory = async (userId, body) => {
  const page = body?.page || 0;
  const pageSize = body?.pageSize || 20;

  const [sessions, total] = await Promise.all([
    prisma.exegesisSession.findMany({
      where: { userId },
      orderBy: { updatedOn: 'desc' },
      skip: page * pageSize,
      take: pageSize,
      select: {
        id: true,
        passageRef: true,
        bookName: true,
        chapter: true,
        verseStart: true,
        verseEnd: true,
        currentStage: true,
        completed: true,
        createdOn: true,
        updatedOn: true,
      },
    }),
    prisma.exegesisSession.count({ where: { userId } }),
  ]);

  return {
    status: 200,
    message: 'Session history',
    data: {
      data: sessions.map(s => serializeBigInt(s)),
      total,
      hasNext: (page + 1) * pageSize < total,
    },
  };
};

export const saveLookStage = async (sessionId, userId, body) => {
  const session = await prisma.exegesisSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) {
    return { status: 404, message: 'Session not found' };
  }

  const updated = await prisma.exegesisSession.update({
    where: { id: sessionId },
    data: {
      lookNotes: body.notes || session.lookNotes,
      currentStage: 'listen',
    },
  });

  return {
    status: 200,
    message: 'Look stage saved',
    data: serializeBigInt(updated),
  };
};

export const saveListenStage = async (sessionId, userId, body) => {
  const session = await prisma.exegesisSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) {
    return { status: 404, message: 'Session not found' };
  }

  const updated = await prisma.exegesisSession.update({
    where: { id: sessionId },
    data: {
      listenCompleted: true,
      listenDuration: body.duration || session.listenDuration,
      currentStage: 'learn',
    },
  });

  return {
    status: 200,
    message: 'Listen stage saved',
    data: serializeBigInt(updated),
  };
};

export const saveLearnStage = async (sessionId, userId, body) => {
  const session = await prisma.exegesisSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) {
    return { status: 404, message: 'Session not found' };
  }

  const updated = await prisma.exegesisSession.update({
    where: { id: sessionId },
    data: {
      learnNotes: body.notes || session.learnNotes,
      currentStage: 'abide',
    },
  });

  return {
    status: 200,
    message: 'Learn stage saved',
    data: serializeBigInt(updated),
  };
};

export const saveAbideStage = async (sessionId, userId, body) => {
  const session = await prisma.exegesisSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) {
    return { status: 404, message: 'Session not found' };
  }

  // Create journal entry from abide content
  const journalEntry = await prisma.journalEntry.create({
    data: {
      userId,
      title: `Exegesis: ${session.passageRef}`,
      content: body.reflection || '',
      bookName: session.bookName,
      chapter: session.chapter,
      verseNumber: session.verseStart,
      category: 'study',
      prayers: body.prayer || '',
      application: body.application || '',
      tags: body.tags || '',
      isPublished: body.isPublic || false,
    },
  });

  const updated = await prisma.exegesisSession.update({
    where: { id: sessionId },
    data: {
      abideReflection: body.reflection,
      abidePrayer: body.prayer,
      abideApplication: body.application,
      abideTags: body.tags,
      strongsWords: body.strongsWords || null,
      strongsIds: body.strongsIds || null,
      isPublic: body.isPublic ?? false,
      journalEntryId: journalEntry.id,
      completed: true,
      currentStage: 'completed',
    },
  });

  return {
    status: 200,
    message: 'Exegesis complete! Saved to Legacy Ledger.',
    data: serializeBigInt({
      session: updated,
      journalEntry: serializeBigInt(journalEntry),
    }),
  };
};

export const saveProgress = async (sessionId, userId, body) => {
  const session = await prisma.exegesisSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) {
    return { status: 404, message: 'Session not found' };
  }

  // Build update object with only the fields that were provided
  // Do NOT change currentStage — this is a save-without-advancing endpoint
  const updateData = {};
  if (body.lookNotes !== undefined) updateData.lookNotes = body.lookNotes;
  if (body.learnNotes !== undefined) updateData.learnNotes = body.learnNotes;
  if (body.listenDuration !== undefined) updateData.listenDuration = body.listenDuration;
  if (body.listenElapsed !== undefined) updateData.listenElapsed = body.listenElapsed;
  if (body.listenCompleted !== undefined) updateData.listenCompleted = body.listenCompleted;
  if (body.abideReflection !== undefined) updateData.abideReflection = body.abideReflection;
  if (body.abidePrayer !== undefined) updateData.abidePrayer = body.abidePrayer;
  if (body.abideApplication !== undefined) updateData.abideApplication = body.abideApplication;
  if (body.abideTags !== undefined) updateData.abideTags = body.abideTags;
  if (body.isPublic !== undefined) updateData.isPublic = body.isPublic;
  if (body.strongsWords !== undefined) updateData.strongsWords = body.strongsWords;
  if (body.strongsIds !== undefined) updateData.strongsIds = body.strongsIds;

  if (Object.keys(updateData).length === 0) {
    return { status: 400, message: 'No fields to update' };
  }

  const updated = await prisma.exegesisSession.update({
    where: { id: sessionId },
    data: updateData,
  });

  return {
    status: 200,
    message: 'Progress saved',
    data: serializeBigInt(updated),
  };
};

export const getSession = async (sessionId, userId) => {
  const session = await prisma.exegesisSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) {
    return { status: 404, message: 'Session not found' };
  }

  return {
    status: 200,
    message: 'Session found',
    data: serializeBigInt(session),
  };
};

export const abandonSession = async (sessionId, userId) => {
  const session = await prisma.exegesisSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) {
    return { status: 404, message: 'Session not found' };
  }

  const updated = await prisma.exegesisSession.update({
    where: { id: sessionId },
    data: { completed: true, currentStage: 'abandoned' },
  });

  return {
    status: 200,
    message: 'Session abandoned',
    data: serializeBigInt(updated),
  };
};
