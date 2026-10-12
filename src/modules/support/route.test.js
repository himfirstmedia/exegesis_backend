// Route-level checks: the /support endpoints are mounted, authenticated, and
// the admin-only endpoints really reject non-admin readers.
import express from 'express';

jest.mock('../../config/db.js', () => ({
  prisma: {
    systemUser: { findUnique: jest.fn() },
    supportTicket: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      groupBy: jest.fn(),
    },
    supportMessage: { create: jest.fn() },
    $transaction: jest.fn((ops) => Promise.all(ops)),
  },
}));

import { prisma } from '../../config/db.js';
import { generateToken } from '../../utils/helpers.js';
import supportRouter from './route.js';

const USER_ID = '11111111-1111-1111-1111-111111111111';
const ADMIN_ID = '22222222-2222-2222-2222-222222222222';

const makeTicket = () => ({
  id: 7,
  ticketCode: 'SUP-20261012-ABCD',
  userId: USER_ID,
  subject: 'App closes on chapter open',
  category: 'technical',
  priority: 'normal',
  status: 'open',
  deviceInfo: null,
  adminUnread: true,
  userUnread: false,
  lastMessageAt: new Date('2026-10-12T08:00:00.000Z'),
  createdOn: new Date('2026-10-12T08:00:00.000Z'),
  updatedOn: new Date('2026-10-12T08:00:00.000Z'),
  resolvedAt: null,
  messages: [],
});

const startServer = () => {
  const app = express();
  app.use(express.json());
  app.use('/support', supportRouter);
  const server = app.listen(0);
  const { port } = server.address();
  return { server, base: `http://127.0.0.1:${port}/support` };
};

let server;
let base;

beforeAll(() => {
  process.env.JWT_SECRET = 'support-test-secret';
  ({ server, base } = startServer());
  // The auth middleware checks account status on every request.
  prisma.systemUser.findUnique.mockResolvedValue({
    status: true,
    accountStatus: 'active',
  });
});

afterAll(() => {
  server?.close();
});

beforeEach(() => {
  jest.clearAllMocks();
  prisma.systemUser.findUnique.mockResolvedValue({
    status: true,
    accountStatus: 'active',
  });
});

const post = (path, body, token) =>
  fetch(`${base}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });

describe('/support routes', () => {
  it('rejects an unauthenticated create with 401', async () => {
    const res = await post('/create', { subject: 'Broken app', message: 'It closes a lot.' });
    expect(res.status).toBe(401);
    expect(prisma.supportTicket.create).not.toHaveBeenCalled();
  });

  it('accepts a signed-in reader and returns the created ticket', async () => {
    prisma.supportTicket.create.mockResolvedValue(makeTicket());
    const token = generateToken({ id: USER_ID, username: 'reader', email: 'r@x.com', userRole: 3 });

    const res = await post(
      '/create',
      { subject: 'App closes on chapter open', message: 'It closes every single time.' },
      token,
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.returnCode).toBe(201);
    expect(body.returnData.ticketCode).toBe('SUP-20261012-ABCD');
  });

  it('blocks a non-admin reader from the admin inbox', async () => {
    const token = generateToken({ id: USER_ID, username: 'reader', email: 'r@x.com', userRole: 3 });

    const res = await post('/admin/get-tickets', {}, token);

    expect(res.status).toBe(403);
    expect(prisma.supportTicket.findMany).not.toHaveBeenCalled();
  });

  it('allows an admin to read the inbox stats', async () => {
    prisma.supportTicket.groupBy.mockResolvedValue([{ status: 'open', _count: { _all: 2 } }]);
    prisma.supportTicket.count.mockResolvedValueOnce(2).mockResolvedValueOnce(1);
    const token = generateToken({ id: ADMIN_ID, username: 'admin', email: 'a@x.com', userRole: 1 });

    const res = await post('/admin/stats', {}, token);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.returnData).toMatchObject({
      totalCount: 2,
      unreadCount: 1,
      counts: { open: 2, in_progress: 0, resolved: 0, closed: 0 },
    });
  });
});
