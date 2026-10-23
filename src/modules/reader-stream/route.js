import express from 'express';
import { z } from 'zod/v4';
import { optionalAuth } from '../../middlewares/auth.middleware.js';
import { translationLimiter, translationCharacterLimiter } from '../../middlewares/rateLimiter.middleware.js';
import { loadReaderSource, loadExegesisIndex, loadBookIndex } from './sources.js';
import { streamReaderTranslation, abortable } from './service.js';
import { formatApiResponse } from '../../utils/helpers.js';
import { BIBLE_BOOK_NAMES } from '../bible/bookNames.js';

export const readerRequestSchema = z.object({
  kind: z.enum(['book-overview', 'book-introduction', 'daily-verse', 'daily-devotion', 'daily-exegesis', 'verse-explanation', 'verse-resources']),
  language: z.enum('en es fr ar de pt hi bn ta te mr gu kn ml pa ur sw it el ru ne fil as doi kok mai mni or sa sat sd id ja ko zh pl ro uk tr'.split(' ')),
  scope: z.enum(['commentaries', 'crossrefs', 'wordStudies', 'dictionary', 'interlinear', 'topics']).optional(),
  params: z.object({ bookName: z.enum([...Object.keys(BIBLE_BOOK_NAMES.en), 'Psalm']).optional(),
    chapter: z.number().int().min(1).max(150).optional(), verseNumber: z.number().int().min(1).max(176).optional(),
    id: z.string().regex(/^\d{1,19}$/).optional() }).strict().default({}),
}).strict().superRefine((value, ctx) => {
  if (['book-overview', 'book-introduction', 'verse-explanation', 'verse-resources'].includes(value.kind) && !value.params.bookName) ctx.addIssue({ code: 'custom', message: 'Book is required' });
  if (['verse-explanation', 'verse-resources'].includes(value.kind) && (!value.params.chapter || !value.params.verseNumber)) ctx.addIssue({ code: 'custom', message: 'Verse reference is required' });
  if (value.scope && value.kind !== 'verse-resources') ctx.addIssue({ code: 'custom', message: 'Scope is only supported for resources' });
  if (value.params.id && value.kind !== 'daily-exegesis') ctx.addIssue({ code: 'custom', message: 'ID is only supported for exegesis' });
});

const active = new Map();
export async function readerStreamController(req, res) {
  const parsed = readerRequestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ returnCode: 400, returnMessage: 'Invalid reader request' });
  const owner = req.user?.id ? `user:${req.user.id}` : `ip:${req.ip}`;
  if ((active.get(owner) || 0) >= 3) return res.status(429).json({ returnCode: 429, returnMessage: 'Too many active reader streams' });
  active.set(owner, (active.get(owner) || 0) + 1);
  const controller = new AbortController();
  const close = () => controller.abort();
  res.once('close', close);
  const deadline = setTimeout(close, 5 * 60_000);
  let heartbeat;
  const emit = async (event, data) => {
    if (controller.signal.aborted || res.destroyed || res.writableEnded) return;
    if (!res.headersSent) {
      res.status(200);
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();
      heartbeat = setInterval(() => {
        if (!controller.signal.aborted && !res.destroyed && !res.writableNeedDrain) res.write(': keepalive\n\n');
      }, 15_000);
    }
    if (!res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)) {
      await new Promise((resolve, reject) => {
        const cleanup = () => { res.off('drain', drain); controller.signal.removeEventListener('abort', abort); };
        const drain = () => { cleanup(); resolve(); };
        const abort = () => { cleanup(); reject(Object.assign(new Error('Closed'), { name: 'AbortError' })); };
        res.once('drain', drain); controller.signal.addEventListener('abort', abort, { once: true });
        if (controller.signal.aborted) abort();
      });
    }
  };
  try {
    const document = await abortable(loadReaderSource(parsed.data), controller.signal);
    await streamReaderTranslation({ ...parsed.data, ...document, signal: controller.signal, emit,
      reserveCharacters: async cost => {
        let allowed = false;
        translationCharacterLimiter({ ip: req.ip, user: req.user, translationCharacterCost: cost }, res, () => { allowed = true; });
        if (!allowed) throw Object.assign(new Error('Translation budget exhausted'), { status: 429 });
      },
    });
  } catch (error) {
    if (error.name !== 'AbortError' && !res.writableEnded && !res.destroyed) {
      if (!res.headersSent) res.status(error.status || 500).json({ returnCode: error.status || 500, returnMessage: 'Reader content unavailable' });
      else await emit('error', { code: 'STREAM_FAILED' }).catch(() => {});
    }
  } finally {
    clearTimeout(deadline); clearInterval(heartbeat);
    res.off('close', close);
    controller.abort();
    const count = (active.get(owner) || 1) - 1;
    if (count) active.set(owner, count); else active.delete(owner);
    if (!res.destroyed && !res.writableEnded) res.end();
  }
}

const indexSchema = z.object({ page: z.number().int().min(0).default(0), size: z.number().int().min(1).max(50).default(12),
  lang: z.string().regex(/^[a-z]{2,3}(?:-[A-Za-z]{2,4})?$/).optional(),
  smartDefault: z.boolean().optional(), futureDays: z.number().int().min(0).max(365).optional(),
  startDate: z.string().max(40).optional(), endDate: z.string().max(40).optional() }).strict();
const router = express.Router();
router.post('/stream', optionalAuth, translationLimiter, readerStreamController);
router.post('/exegesis-index', optionalAuth, translationLimiter, async (req, res, next) => {
  const parsed = indexSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ returnCode: 400, returnMessage: 'Invalid reader request' });
  try { const result = await loadExegesisIndex(parsed.data); return res.status(result.status).json(formatApiResponse(result)); }
  catch (error) { return next(error); }
});
router.post('/book-index', optionalAuth, translationLimiter, async (req, res, next) => {
  const parsed = z.object({ page: z.number().int().min(0).default(0), pageSize: z.number().int().min(1).max(50).default(24),
    search: z.string().max(100).optional(), lang: z.string().max(10).optional() }).strict().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ returnCode: 400, returnMessage: 'Invalid reader request' });
  try { const result = await loadBookIndex(parsed.data); return res.status(result.status).json(formatApiResponse(result)); }
  catch (error) { return next(error); }
});
export default router;
