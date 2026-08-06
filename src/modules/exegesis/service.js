import { prisma } from '../../config/db.js';
import { serializeBigInt } from '../../utils/helpers.js';
import PDFDocument from 'pdfkit';

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
      isPublic: body.isPublic !== undefined ? body.isPublic : session.isPublic,
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
      strongsWords: body.strongsWords || null,
      strongsIds: body.strongsIds || null,
      source: 'exegesis-lab',
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
  if (body.journalEntryId !== undefined) updateData.journalEntryId = BigInt(body.journalEntryId);
  if (body.completed !== undefined) updateData.completed = body.completed;

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
