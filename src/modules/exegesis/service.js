import { prisma } from '../../config/db.js';
import { Prisma } from '@prisma/client';
import { serializeBigInt } from '../../utils/helpers.js';
import PDFDocument from 'pdfkit';
import { translateSessionPrompts } from './translation.js';

const LOOK_PROMPTS = [
  'What specific words or phrases stand out to you in this passage?',
  'Who is speaking? Who is listening or being addressed?',
  'What commands, promises, warnings, or truths do you see?',
  'What is repeated in this passage?',
  'What contrasts do you notice (light/darkness, before/after, etc.)?',
  'What questions does this passage raise in your mind?',
];

const JSON_FIELDS = new Set([
  'observations',
  'lookHighlights',
  'lookQuestions',
  'listenSelections',
  'listenQuestions',
  'learnQuestions',
  'applyTiming',
  'applyReminder',
  'applyResults',
]);

const LOOK_FIELDS = {
  lookNotes: ['lookNotes', 'notes'],
  observations: ['observations', 'lookObservations'],
  lookHighlights: ['lookHighlights', 'highlights'],
  lookQuestions: ['lookQuestions', 'questions'],
};

const LISTEN_FIELDS = {
  listenDuration: ['listenDuration', 'duration'],
  listenElapsed: ['listenElapsed'],
  listenSelections: ['listenSelections', 'selections'],
  listenNotes: ['listenNotes', 'notes'],
  listenQuestions: ['listenQuestions', 'questions'],
  listenRepeats: ['listenRepeats', 'repeats'],
  listenRepeatCount: ['listenRepeatCount', 'repeatCount'],
};

const LEARN_FIELDS = {
  learnSummary: ['learnSummary', 'summary'],
  learnNotes: ['learnNotes', 'notes'],
  learnQuestions: ['learnQuestions', 'questions'],
};

const ABIDE_FIELDS = {
  abideSelectedVerse: ['abideSelectedVerse', 'selectedVerse'],
  abideTruth: ['abideTruth', 'selectedTruth', 'truth'],
  abideReflection: ['abideReflection', 'reflection'],
  abidePrayer: ['abidePrayer', 'prayer'],
  abideApplication: ['abideApplication', 'application'],
  abideTags: ['abideTags', 'tags'],
};

const APPLY_FIELDS = {
  applyPrinciple: ['applyPrinciple', 'principle'],
  applyResponse: ['applyResponse', 'response'],
  applyChallenge: ['applyChallenge', 'challenge'],
  applyTiming: ['applyTiming', 'timing'],
  applyReminder: ['applyReminder', 'reminder'],
  applyResults: ['applyResults', 'results'],
};

const LEGACY_FIELDS = {
  isPublic: ['isPublic'],
  strongsWords: ['strongsWords'],
  strongsIds: ['strongsIds'],
};

// Undefined means "not sent" and must not overwrite a draft. Null, empty text,
// false, zero, and empty arrays/objects are intentional values. Prisma uses a
// distinct sentinel for SQL NULL on nullable JSON columns.
const copyDefinedFields = (target, body, fields) => {
  let copied = false;
  Object.entries(fields).forEach(([field, aliases]) => {
    const key = aliases.find(alias => body?.[alias] !== undefined);
    if (!key) return;
    const value = body[key];
    target[field] = value === null && JSON_FIELDS.has(field) ? Prisma.DbNull : value;
    copied = true;
  });
  return copied;
};

const STAGE_RANK = { look: 0, listen: 1, learn: 2, abide: 3, apply: 4, completed: 5, abandoned: 5 };

// A delayed/offline replay may save artifacts again, but it must never move the
// lifecycle backward or reopen a completed/abandoned session.
const nextStage = (session, stage) => {
  if (session.completed) return session.currentStage === 'abandoned' ? 'abandoned' : 'completed';
  const currentRank = STAGE_RANK[session.currentStage] ?? 0;
  return currentRank > STAGE_RANK[stage] ? session.currentStage : stage;
};

const savedSession = (message, session) => ({
  status: 200,
  message,
  data: serializeBigInt(session),
});

const optionalBigInt = value =>
  value === undefined || value === null || value === '' ? null : BigInt(value);


export const startSession = async (userId, body) => {
  const { bookName, chapter, verseStart, verseEnd, createNew = false } = body;
  if (typeof bookName !== 'string' || !bookName.trim() || chapter === undefined || chapter === null || chapter === '') {
    return { status: 400, message: 'bookName and chapter are required' };
  }

  let normalizedChapter;
  let normalizedVerseStart;
  let normalizedVerseEnd;
  try {
    normalizedChapter = BigInt(chapter);
    normalizedVerseStart = optionalBigInt(verseStart);
    normalizedVerseEnd = optionalBigInt(verseEnd);
  } catch {
    return { status: 400, message: 'chapter and verse numbers must be valid integers' };
  }

  if (normalizedChapter < 1 || (normalizedVerseStart !== null && normalizedVerseStart < 1) ||
      (normalizedVerseEnd !== null && normalizedVerseEnd < 1) ||
      (normalizedVerseStart === null && normalizedVerseEnd !== null) ||
      (normalizedVerseStart !== null && normalizedVerseEnd !== null && normalizedVerseEnd < normalizedVerseStart)) {
    return { status: 400, message: 'Enter a valid chapter and verse range' };
  }

  const normalizedBookName = bookName.trim();

  const passageRef = normalizedVerseStart !== null
    ? `${normalizedBookName} ${chapter}:${verseStart}${normalizedVerseEnd !== null && normalizedVerseEnd !== normalizedVerseStart ? `-${verseEnd}` : ''}`
    : `${normalizedBookName} ${chapter}`;

  // Legacy callers may continue a draft, but only for the exact requested
  // passage. createNew always creates a separate draft for that passage.
  if (!createNew) {
    const existing = await prisma.exegesisSession.findFirst({
      where: {
        userId,
        completed: false,
        bookName: normalizedBookName,
        chapter: normalizedChapter,
        verseStart: normalizedVerseStart,
        verseEnd: normalizedVerseEnd,
      },
      orderBy: [{ updatedOn: 'desc' }, { id: 'desc' }],
    });

    if (existing) {
      return {
        status: 200,
        message: 'Continuing existing session',
        data: await translateSessionPrompts(serializeBigInt(existing), body?.lang),
      };
    }
  }

  const session = await prisma.exegesisSession.create({
    data: {
      userId,
      passageRef,
      bookName: normalizedBookName,
      chapter: normalizedChapter,
      verseStart: normalizedVerseStart,
      verseEnd: normalizedVerseEnd,
      currentStage: 'look',
      artifactVersion: 2,
      lookPromptsJson: JSON.stringify(LOOK_PROMPTS),
    },
  });

  return {
    status: 200,
    message: 'Exegesis session started',
    data: await translateSessionPrompts(serializeBigInt(session), body?.lang),
  };
};

export const getCurrentSession = async (userId, lang = 'en') => {
  const session = await prisma.exegesisSession.findFirst({
    where: { userId, completed: false },
    orderBy: [{ updatedOn: 'desc' }, { id: 'desc' }],
  });

  if (!session) {
    return { status: 200, message: 'No active session', data: null };
  }

  return {
    status: 200,
    message: 'Active session found',
    data: await translateSessionPrompts(serializeBigInt(session), lang),
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

  const data = { currentStage: nextStage(session, 'listen') };
  copyDefinedFields(data, body, LOOK_FIELDS);

  const updated = await prisma.exegesisSession.update({
    where: { id: sessionId },
    data,
  });

  return savedSession('Look stage saved', updated);
};

export const saveListenStage = async (sessionId, userId, body) => {
  const session = await prisma.exegesisSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) {
    return { status: 404, message: 'Session not found' };
  }

  const data = {
    listenCompleted: body?.listenCompleted !== false,
    currentStage: nextStage(session, 'learn'),
  };
  copyDefinedFields(data, body, LISTEN_FIELDS);

  const updated = await prisma.exegesisSession.update({
    where: { id: sessionId },
    data,
  });

  return savedSession('Listen stage saved', updated);
};

export const saveLearnStage = async (sessionId, userId, body) => {
  const session = await prisma.exegesisSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) {
    return { status: 404, message: 'Session not found' };
  }

  const data = { currentStage: nextStage(session, 'abide') };
  copyDefinedFields(data, body, LEARN_FIELDS);
  copyDefinedFields(data, body, { isPublic: LEGACY_FIELDS.isPublic });

  const updated = await prisma.exegesisSession.update({
    where: { id: sessionId },
    data,
  });

  return savedSession('Learn stage saved', updated);
};

export const saveAbideStage = async (sessionId, userId, body) => {
  const session = await prisma.exegesisSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) {
    return { status: 404, message: 'Session not found' };
  }

  // Abide is a draft save only. Completion and Ledger persistence are separate,
  // explicitly requested operations after Apply has been saved.
  const data = { currentStage: nextStage(session, 'apply') };
  copyDefinedFields(data, body, LOOK_FIELDS);
  copyDefinedFields(data, body, ABIDE_FIELDS);
  copyDefinedFields(data, body, LEGACY_FIELDS);

  const updated = await prisma.exegesisSession.update({
    where: { id: sessionId },
    data,
  });

  return savedSession('Abide stage saved', updated);
};

export const saveProgress = async (sessionId, userId, body) => {
  const session = await prisma.exegesisSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) {
    return { status: 404, message: 'Session not found' };
  }

  // Save without advancing the stage. Completion and journalEntryId are owned
  // by their explicit endpoints so replayed progress cannot bypass lifecycle.
  const updateData = {};
  const fields = {
    ...LOOK_FIELDS,
    ...LISTEN_FIELDS,
    ...LEARN_FIELDS,
    ...ABIDE_FIELDS,
    ...APPLY_FIELDS,
    ...LEGACY_FIELDS,
  };
  // Generic draft saves use canonical names for ambiguous fields (e.g.
  // `notes` could be Look, Listen or Learn); stage routes accept short names.
  const aliasCounts = Object.values(fields).flat().reduce((counts, alias) => {
    counts[alias] = (counts[alias] ?? 0) + 1;
    return counts;
  }, Object.create(null));
  copyDefinedFields(updateData, body, Object.fromEntries(
    Object.entries(fields).map(([field, aliases]) => [
      field, aliases.filter(alias => aliasCounts[alias] === 1),
    ]),
  ));
  if (body.listenCompleted !== undefined) updateData.listenCompleted = body.listenCompleted;

  if (Object.keys(updateData).length === 0) {
    return { status: 400, message: 'No fields to update' };
  }

  const updated = await prisma.exegesisSession.update({
    where: { id: sessionId },
    data: updateData,
  });

  return savedSession('Progress saved', updated);
};

export const saveApplyStage = async (sessionId, userId, body) => {
  const session = await prisma.exegesisSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) {
    return { status: 404, message: 'Session not found' };
  }

  // An empty Apply save is valid: reading and reflection need not produce typed
  // text, but the successful save marker is required before completion.
  const data = {
    applySavedOn: new Date(),
    currentStage: nextStage(session, 'apply'),
  };
  copyDefinedFields(data, body, APPLY_FIELDS);

  const updated = await prisma.exegesisSession.update({
    where: { id: sessionId },
    data,
  });

  return savedSession('Apply stage saved', updated);
};

export const completeSession = async (sessionId, userId) => {
  const session = await prisma.exegesisSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) {
    return { status: 404, message: 'Session not found' };
  }

  if (session.currentStage === 'abandoned') {
    return { status: 409, message: 'An abandoned session cannot be completed' };
  }
  if (session.completed) {
    return savedSession('Exegesis session already completed', session);
  }

  if (!session.applySavedOn) {
    return { status: 409, message: 'Apply stage must be saved before completion' };
  }

  const updated = await prisma.exegesisSession.update({
    where: { id: sessionId },
    data: {
      completed: true,
      completedOn: session.completedOn ?? new Date(),
      currentStage: 'completed',
    },
  });

  return savedSession('Exegesis session completed', updated);
};

const artifactText = value => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
};

const artifactSection = (label, value) => {
  const text = artifactText(value);
  return text && text !== '[]' && text !== '{}' ? `${label}:\n${text}` : '';
};

const artifactSections = sections => sections.filter(Boolean).join('\n\n');

const ledgerArtifacts = session => ({
  content: artifactSections([
    artifactSection('Selected verse', session.abideSelectedVerse),
    artifactSection('Truth', session.abideTruth),
    artifactSection('Reflection', session.abideReflection),
  ]),
  observations: artifactSections([
    artifactSection('Look notes', session.lookNotes),
    artifactSection('Observations', session.observations),
    artifactSection('Highlights', session.lookHighlights),
    artifactSection('Look questions', session.lookQuestions),
    artifactSection('Listen selections', session.listenSelections),
    artifactSection('Listening notes', session.listenNotes),
    artifactSection('Wording questions', session.listenQuestions),
  ]),
  learnings: artifactSections([
    artifactSection('Summary', session.learnSummary),
    artifactSection('Study notes', session.learnNotes),
    artifactSection('Unresolved questions', session.learnQuestions),
  ]),
  prayers: artifactText(session.abidePrayer),
  application: artifactSections([
    artifactSection('Abide application', session.abideApplication),
    artifactSection('Principle', session.applyPrinciple),
    artifactSection('Response', session.applyResponse),
    artifactSection('Challenge', session.applyChallenge),
    artifactSection('Timing', session.applyTiming),
    artifactSection('Later results', session.applyResults),
  ]),
});

export const saveSessionLedger = async (sessionId, userId, body = {}) => {
  const session = await prisma.exegesisSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) {
    return { status: 404, message: 'Session not found' };
  }

  if (!session.completed || session.currentStage === 'abandoned') {
    return { status: 409, message: 'Complete the Apply stage before saving to the Legacy Ledger' };
  }

  const artifacts = ledgerArtifacts(session);
  const journalData = {
    title: `Exegesis: ${session.passageRef}`,
    ...artifacts,
    observations: artifacts.observations || null,
    learnings: artifacts.learnings || null,
    prayers: artifacts.prayers || null,
    application: artifacts.application || null,
    bookName: session.bookName,
    chapter: session.chapter,
    verseNumber: session.verseStart,
    category: 'study',
    source: 'exegesis-lab',
    sourceSessionId: session.id,
    // The early Lab isPublic preference is deliberately not inherited. Every
    // Ledger save is private unless this request explicitly chooses public.
    isPublished: body.isPublic === true || body.isPublished === true,
    strongsWords: session.strongsWords ?? null,
    strongsIds: session.strongsIds ?? null,
    tags: session.abideTags ?? null,
  };

  const updated = await prisma.$transaction(async tx => {
    let entry = session.journalEntryId
      ? await tx.journalEntry.findFirst({
          where: { id: session.journalEntryId, userId },
        })
      : null;

    if (entry) {
      entry = await tx.journalEntry.update({
        where: { id: entry.id },
        data: { ...journalData, updatedBy: userId },
      });
    } else {
      // The stable sourceSessionId also covers a cleared/deleted legacy link and
      // makes concurrent or offline replays converge on one JournalEntry row.
      entry = await tx.journalEntry.upsert({
        where: { sourceSessionId: session.id },
        create: {
          userId,
          ...journalData,
          createdBy: userId,
        },
        update: { ...journalData, updatedBy: userId },
      });
    }

    return tx.exegesisSession.update({
      where: { id: session.id },
      data: { journalEntryId: entry.id },
    });
  });

  return savedSession('Exegesis session saved to Legacy Ledger', updated);
};

export const getSession = async (sessionId, userId, lang = 'en') => {
  const session = await prisma.exegesisSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) {
    return { status: 404, message: 'Session not found' };
  }

  return {
    status: 200,
    message: 'Session found',
    data: await translateSessionPrompts(serializeBigInt(session), lang),
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

// ── PDF export ───────────────────────────────────────────────────────────────
// Generates a styled PDF of a completed Exegesis Lab session, mirroring the
// layout of the web print document (web/src/lib/studyPdf.ts): Look answers
// headed by their actual question prompts, Learn notes, Strong's words,
// Reflection, Prayer, Application, and Tags. Returns base64 content + filename
// + mimeType so the client can download the file.

export const exportSessionPdf = async (sessionId, userId) => {
  const session = await prisma.exegesisSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) {
    return { status: 404, message: 'Session not found' };
  }

  // Look prompts saved on the session (fall back to the canonical list).
  const prompts = (() => {
    try {
      const parsed = session.lookPromptsJson ? JSON.parse(session.lookPromptsJson) : null;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : LOOK_PROMPTS;
    } catch {
      return LOOK_PROMPTS;
    }
  })();

  // lookNotes is JSON keyed by prompt index → answer.
  const lookEntries = (() => {
    if (!session.lookNotes) return [];
    try {
      const parsed = JSON.parse(session.lookNotes);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return Object.entries(parsed)
          .filter(([, v]) => v && String(v).trim())
          .map(([key, val]) => {
            const idx = Number(key);
            return { question: prompts[idx] || `Question ${idx + 1}`, answer: String(val) };
          });
      }
      return [{ question: '', answer: String(session.lookNotes) }];
    } catch {
      return [{ question: '', answer: String(session.lookNotes) }];
    }
  })();

  const strongsWords = (() => {
    if (!session.strongsWords) return [];
    try {
      const parsed = JSON.parse(session.strongsWords);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const tags = (session.abideTags || '')
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

  const passageRef =
    session.passageRef ||
    `${session.bookName}${session.chapter ? ` ${Number(session.chapter)}` : ''}${session.verseStart ? `:${Number(session.verseStart)}` : ''}`;
  const dateStr = new Date(session.updatedOn || session.createdOn).toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'long', day: 'numeric',
  });

  const doc = new PDFDocument({ margin: 50, info: { Title: `Bible Study: ${passageRef}`, Author: 'Exegesis Bible App' } });
  const buffers = [];
  doc.on('data', chunk => buffers.push(chunk));

  const marginX = 50;
  const marginRight = 50;
  const contentWidth = doc.page.width - marginX - marginRight;
  const bottomY = () => doc.page.height - 40;

  const sectionDivider = () => {
    doc.moveTo(marginX, doc.y).lineTo(doc.page.width - marginRight, doc.y).strokeColor('#E5E7EB').stroke();
  };

  const sectionHeader = ({ label, color }) => {
    doc.moveDown(0.6);
    if (doc.y > bottomY() - 50) doc.addPage();
    doc.roundedRect(marginX, doc.y + 2, 3, 18, 1.5).fillColor(color).fill();
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1F2937').text(label, marginX + 12, doc.y - 2);
    doc.moveDown(0.4);
  };

  const bodyText = (text) => {
    doc.fontSize(12).font('Helvetica').fillColor('#374151').text(text, { lineGap: 7, align: 'justify', paragraphGap: 5 });
  };

  const writeFooter = () => {
    const fy = doc.page.maxY() - doc.currentLineHeight(true);
    if (doc.y > doc.page.margins.top + 30 && doc.y < fy) {
      doc.save();
      doc.fontSize(12).font('Helvetica').fillColor('#9CA3AF');
      doc.text('Generated by Exegesis Bible App', marginX, fy, { align: 'center', width: contentWidth, lineBreak: false });
      doc.restore();
    }
  };
  const origAddPage = doc.addPage.bind(doc);
  doc.addPage = (...args) => { writeFooter(); return origAddPage(...args); };

  // ── Header ──
  doc.fontSize(24).font('Helvetica-Bold').fillColor('#1F2937').text('Exegesis Bible Study');
  doc.moveDown(0.1);
  doc.fontSize(12).font('Helvetica').fillColor('#9CA3AF').text('Created with Exegesis Bible App');
  doc.moveDown(0.5);
  sectionDivider();
  doc.moveDown(0.6);

  // ── Passage title ──
  doc.fontSize(18).font('Helvetica-Bold').fillColor('#1F2937').text(passageRef);
  doc.moveDown(0.2);
  doc.fontSize(12).font('Helvetica').fillColor('#6B7280').text(dateStr);
  doc.moveDown(0.5);

  // ── Look — Observations (Q&A cards headed by the actual question) ──
  if (lookEntries.length > 0) {
    sectionHeader({ label: 'Look — Observations', color: '#F59E0B' });
    lookEntries.forEach((entry) => {
      if (entry.question) {
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#B45309').text(entry.question);
        doc.moveDown(0.1);
      }
      bodyText(entry.answer);
      doc.moveDown(0.3);
    });
  }

  // ── Learn — Study Notes ──
  if (session.learnNotes) {
    sectionHeader({ label: 'Learn — Study Notes', color: '#8B5CF6' });
    bodyText(String(session.learnNotes));
    doc.moveDown(0.2);
  }

  // ── Strong's Words Studied ──
  if (strongsWords.length > 0) {
    sectionHeader({ label: "Strong's Words Studied", color: '#6B7280' });
    strongsWords.forEach(w => {
      const label = w.surfaceText || w.strongsId || '';
      const id = w.strongsId ? ` (${w.strongsId})` : '';
      const lemma = w.lemma ? ` — ${w.lemma}` : '';
      doc.fontSize(12).font('Helvetica').fillColor('#4B5563').text(`  • ${label}${id}${lemma}`);
    });
    doc.moveDown(0.1);
  }

  // ── Reflection ──
  if (session.abideReflection) {
    sectionHeader({ label: 'Reflection', color: '#10B981' });
    bodyText(String(session.abideReflection));
    doc.moveDown(0.2);
  }

  // ── Prayer ──
  if (session.abidePrayer) {
    sectionHeader({ label: 'Prayer', color: '#8B5CF6' });
    bodyText(String(session.abidePrayer));
    doc.moveDown(0.2);
  }

  // ── Application ──
  if (session.abideApplication) {
    sectionHeader({ label: 'Application', color: '#EF4444' });
    bodyText(String(session.abideApplication));
    doc.moveDown(0.2);
  }

  // ── Tags (chip pills) ──
  if (tags.length > 0) {
    sectionHeader({ label: 'Tags', color: '#6B7280' });
    const tagFontSize = 12;
    const tagPaddingX = 7;
    const tagPaddingY = 4;
    const tagGap = 5;
    const tagColor = '#6B7280';
    const tagBg = '#F3F4F6';
    let x = marginX;
    tags.forEach((tag) => {
      const label = `#${tag}`;
      const textWidth = doc.widthOfString(label, { fontSize: tagFontSize, font: 'Helvetica' });
      const chipWidth = textWidth + tagPaddingX * 2;
      const chipHeight = tagFontSize + tagPaddingY * 2 + 2;
      if (x + chipWidth > doc.page.width - marginRight && x > marginX) {
        x = marginX;
        doc.y += chipHeight + tagGap;
        if (doc.y > bottomY() - 20) doc.addPage();
      }
      doc.roundedRect(x, doc.y, chipWidth, chipHeight, 4).fillColor(tagBg).fill();
      doc.fontSize(tagFontSize).font('Helvetica-Bold').fillColor(tagColor)
        .text(label, x + tagPaddingX, doc.y + tagPaddingY, { lineBreak: false });
      x += chipWidth + tagGap;
    });
    doc.moveDown(1.2);
  }

  doc.moveDown(1);
  writeFooter();
  sectionDivider();

  const slug = (session.bookName || 'exegesis').toLowerCase().replace(/\s+/g, '-');
  const filename = `${slug}-${new Date().toISOString().split('T')[0]}.pdf`;

  return new Promise((resolve) => {
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve({
        status: 200,
        message: 'Session PDF generated',
        data: {
          content: pdfBuffer.toString('base64'),
          filename,
          mimeType: 'application/pdf',
        },
      });
    });
    doc.end();
  });
};
