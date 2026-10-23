import express from 'express';
import http from 'node:http';
jest.mock('../../middlewares/auth.middleware.js', () => ({ optionalAuth: (_req, _res, next) => next() }));
jest.mock('./sources.js', () => ({ loadReaderSource: jest.fn(), loadExegesisIndex: jest.fn(), loadBookIndex: jest.fn() }));
jest.mock('../text-to-text-translation/service.js', () => ({ translateText: jest.fn() }));
jest.mock('../../services/cacheService.js', () => ({ cache: { get: jest.fn(), set: jest.fn() } }));
import router, { readerRequestSchema } from './route.js';
import { loadReaderSource } from './sources.js';
import { translateText } from '../text-to-text-translation/service.js';
import { cache } from '../../services/cacheService.js';

let server;
beforeEach(async () => {
  jest.resetAllMocks();
  cache.get.mockResolvedValue(null); cache.set.mockResolvedValue(true);
  loadReaderSource.mockResolvedValue({ source: { id: '1', title: 'English title', content: 'English body.' }, fields: ['title', 'content'], atomicFields: ['title'] });
  translateText.mockImplementation(async ({ q, target }) => ({ translatedText: `FR:${q}`, target }));
  const app = express(); app.use(express.json()); app.use('/reader', router);
  server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
});
afterEach(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
const open = (body, onResponse) => {
  const req = http.request({ hostname: '127.0.0.1', port: server.address().port, path: '/reader/stream', method: 'POST',
    agent: false, headers: { 'Content-Type': 'application/json' } }, onResponse);
  req.end(JSON.stringify(body)); return req;
};

it('streams translated frames over real HTTP before the document is complete, and cancels on disconnect', async () => {
  translateText.mockImplementationOnce(async ({ target }) => ({ translatedText: 'Titre traduit', target }));
  translateText.mockImplementation(() => new Promise(() => {}));
  let req; let response; let text = '';
  await new Promise((resolve, reject) => {
    req = open({ kind: 'daily-devotion', language: 'fr' }, res => {
      response = res;
      res.on('data', chunk => { text += chunk.toString(); if (text.includes('event: patch')) resolve(); });
    });
    req.on('error', reject);
  });
  expect(response.headers['content-type']).toContain('text/event-stream');
  expect(response.headers['x-accel-buffering']).toBe('no');
  expect(text).toContain('Titre traduit'); expect(text).not.toContain('English body.');
  expect(text).not.toContain('event: done');
  response.destroy(); req.destroy();
  await new Promise(resolve => setImmediate(resolve));
  expect(translateText).toHaveBeenCalledTimes(2);
});

it('rejects arbitrary source uploads, unknown kinds/languages, and invalid references', () => {
  for (const body of [
    { kind: 'legal', language: 'fr' }, { kind: 'daily-verse', language: 'xx' },
    { kind: 'daily-verse', language: 'fr', q: 'Client English source' },
    { kind: 'verse-resources', language: 'fr', params: { bookName: 'Genesis' } },
    { kind: 'daily-exegesis', language: 'fr', params: { id: '-1' } },
    { kind: 'book-overview', language: 'fr', params: { bookName: '../../private' } },
  ]) expect(readerRequestSchema.safeParse(body).success).toBe(false);
});

it('returns a normal HTTP error before opening a stream when source lookup fails', async () => {
  loadReaderSource.mockRejectedValue(Object.assign(new Error('Not found'), { status: 404 }));
  const result = await new Promise(resolve => open({ kind: 'daily-verse', language: 'fr' }, res => {
    let text = ''; res.on('data', chunk => { text += chunk; }); res.on('end', () => resolve({ status: res.statusCode, text }));
  }));
  expect(result.status).toBe(404); expect(JSON.parse(result.text).returnCode).toBe(404);
  expect(translateText).not.toHaveBeenCalled();
});

it('charges server-owned source characters before invoking a translation provider', async () => {
  const previous = process.env.TRANSLATION_RATE_LIMIT_CHARACTERS;
  process.env.TRANSLATION_RATE_LIMIT_CHARACTERS = '1';
  try {
    const result = await new Promise(resolve => open({ kind: 'daily-verse', language: 'fr' }, res => {
      let text = ''; res.on('data', chunk => { text += chunk; }); res.on('end', () => resolve({ status: res.statusCode, text }));
    }));
    expect(result.status).toBe(429);
    expect(JSON.parse(result.text).returnCode).toBe(429);
    expect(translateText).not.toHaveBeenCalled();
  } finally {
    if (previous === undefined) delete process.env.TRANSLATION_RATE_LIMIT_CHARACTERS;
    else process.env.TRANSLATION_RATE_LIMIT_CHARACTERS = previous;
  }
});
