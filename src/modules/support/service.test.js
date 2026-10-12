import { prisma } from '../../config/db.js';
import {
  adminReply,
  createTicket,
  getAdminTicket,
  getMyTickets,
  getSupportStats,
  getTicket,
  replyToTicket,
  updateTicketStatus,
} from './service.js';

jest.mock('../../config/db.js', () => ({
  prisma: {
    supportTicket: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      groupBy: jest.fn(),
    },
    supportMessage: { create: jest.fn() },
    // The service passes an array of operations; resolve them together.
    $transaction: jest.fn((ops) => Promise.all(ops)),
  },
}));

const USER_ID = 'user-1';
const ADMIN_ID = 'admin-1';

const makeTicket = (overrides = {}) => ({
  id: 7,
  ticketCode: 'SUP-20261012-ABCD',
  userId: USER_ID,
  subject: 'App closes on chapter open',
  category: 'technical',
  priority: 'normal',
  status: 'open',
  deviceInfo: 'android 34',
  adminUnread: true,
  userUnread: false,
  lastMessageAt: new Date('2026-10-12T08:00:00.000Z'),
  resolvedAt: null,
  resolvedBy: null,
  createdOn: new Date('2026-10-12T08:00:00.000Z'),
  updatedOn: new Date('2026-10-12T08:00:00.000Z'),
  messages: [
    {
      id: 1,
      ticketId: 7,
      senderId: USER_ID,
      senderRole: 'user',
      body: 'It closes every time.',
      createdOn: new Date('2026-10-12T08:00:00.000Z'),
    },
  ],
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createTicket', () => {
  it('rejects a subject that is too short', async () => {
    const result = await createTicket({ subject: 'hi', message: 'x'.repeat(20) }, USER_ID);
    expect(result.status).toBe(400);
    expect(prisma.supportTicket.create).not.toHaveBeenCalled();
  });

  it('rejects a message that is too short', async () => {
    const result = await createTicket({ subject: 'Broken app', message: 'help' }, USER_ID);
    expect(result.status).toBe(400);
    expect(prisma.supportTicket.create).not.toHaveBeenCalled();
  });

  it('falls back to the "other" category for an unknown category', async () => {
    prisma.supportTicket.create.mockResolvedValue(makeTicket({ category: 'other' }));

    const result = await createTicket(
      { subject: 'Broken app', message: 'It closes every time I open a chapter.', category: 'nonsense' },
      USER_ID,
    );

    expect(result.status).toBe(201);
    expect(prisma.supportTicket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: USER_ID,
          category: 'other',
          priority: 'normal',
          adminUnread: true,
        }),
      }),
    );
  });

  it('stores the complaint as the first message of the thread', async () => {
    prisma.supportTicket.create.mockResolvedValue(makeTicket());

    const result = await createTicket(
      { subject: 'Broken app', message: 'It closes every time.' },
      USER_ID,
    );

    const createArgs = prisma.supportTicket.create.mock.calls[0][0];
    expect(createArgs.data.messages.create).toEqual({
      senderId: USER_ID,
      senderRole: 'user',
      body: 'It closes every time.',
    });
    expect(createArgs.data.ticketCode).toMatch(/^SUP-\d{8}-[A-Z0-9]{4}$/);
    expect(result.data.messageCount).toBe(1);
  });
});

describe('getTicket', () => {
  it('refuses to hand another user\'s conversation to the caller', async () => {
    prisma.supportTicket.findUnique.mockResolvedValue(
      makeTicket({ userId: 'someone-else' }),
    );

    const result = await getTicket({ ticketId: 7 }, USER_ID);

    expect(result.status).toBe(404);
    expect(prisma.supportTicket.update).not.toHaveBeenCalled();
  });

  it('clears the user unread flag when the owner opens it', async () => {
    prisma.supportTicket.findUnique.mockResolvedValue(makeTicket({ userUnread: true }));
    prisma.supportTicket.update.mockResolvedValue(makeTicket({ userUnread: false }));

    const result = await getTicket({ ticketId: 7 }, USER_ID);

    expect(result.status).toBe(200);
    expect(prisma.supportTicket.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { userUnread: false },
    });
    expect(result.data.userUnread).toBe(false);
  });
});

describe('replyToTicket', () => {
  it('reopens a resolved conversation so it returns to the admin queue', async () => {
    prisma.supportTicket.findUnique.mockResolvedValue(makeTicket({ status: 'resolved' }));
    prisma.supportMessage.create.mockResolvedValue({});
    prisma.supportTicket.update.mockResolvedValue({});
    prisma.supportTicket.findUnique
      .mockResolvedValueOnce(makeTicket({ status: 'resolved' }))
      .mockResolvedValueOnce(makeTicket({ status: 'open', adminUnread: true }));

    const result = await replyToTicket({ ticketId: 7, message: 'Still broken.' }, USER_ID);

    const updateArgs = prisma.supportTicket.update.mock.calls[0][0];
    expect(updateArgs.data.status).toBe('open');
    expect(updateArgs.data.adminUnread).toBe(true);
    expect(result.status).toBe(200);
  });

  it('rejects a reply on a closed conversation', async () => {
    prisma.supportTicket.findUnique.mockResolvedValue(makeTicket({ status: 'closed' }));

    const result = await replyToTicket({ ticketId: 7, message: 'Hello?' }, USER_ID);

    expect(result.status).toBe(400);
    expect(prisma.supportMessage.create).not.toHaveBeenCalled();
  });
});

describe('adminReply', () => {
  it('moves an open ticket to in_progress and flags it for the user', async () => {
    prisma.supportTicket.findUnique
      .mockResolvedValueOnce(makeTicket({ status: 'open' }))
      .mockResolvedValueOnce(makeTicket({ status: 'in_progress', userUnread: true }));
    prisma.supportMessage.create.mockResolvedValue({});
    prisma.supportTicket.update.mockResolvedValue({});

    const result = await adminReply({ ticketId: 7, message: 'Fixed in the next build.' }, ADMIN_ID);

    const updateArgs = prisma.supportTicket.update.mock.calls[0][0];
    expect(updateArgs.data).toMatchObject({
      status: 'in_progress',
      adminUnread: false,
      userUnread: true,
    });
    expect(prisma.supportMessage.create).toHaveBeenCalledWith({
      data: { ticketId: 7, senderId: ADMIN_ID, senderRole: 'admin', body: 'Fixed in the next build.' },
    });
    expect(result.data.status).toBe('in_progress');
  });
});

describe('updateTicketStatus', () => {
  it('rejects an unknown status', async () => {
    const result = await updateTicketStatus({ ticketId: 7, status: 'nope' }, ADMIN_ID);
    expect(result.status).toBe(400);
  });

  it('stamps resolvedAt/resolvedBy when settling a ticket', async () => {
    prisma.supportTicket.findUnique
      .mockResolvedValueOnce(makeTicket())
      .mockResolvedValueOnce(makeTicket({ status: 'resolved' }));
    prisma.supportTicket.update.mockResolvedValue({});

    await updateTicketStatus({ ticketId: 7, status: 'resolved' }, ADMIN_ID);

    const updateArgs = prisma.supportTicket.update.mock.calls[0][0];
    expect(updateArgs.data.status).toBe('resolved');
    expect(updateArgs.data.resolvedBy).toBe(ADMIN_ID);
    expect(updateArgs.data.resolvedAt).toBeInstanceOf(Date);
  });
});

describe('getSupportStats', () => {
  it('zero-fills statuses that have no rows yet', async () => {
    prisma.supportTicket.groupBy.mockResolvedValue([
      { status: 'open', _count: { _all: 3 } },
    ]);
    prisma.supportTicket.count
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(2);

    const result = await getSupportStats();

    expect(result.data.counts).toEqual({
      open: 3,
      in_progress: 0,
      resolved: 0,
      closed: 0,
    });
    expect(result.data.totalCount).toBe(5);
    expect(result.data.unreadCount).toBe(2);
  });
});

describe('getMyTickets', () => {
  it('returns only the caller\'s conversations, newest activity first', async () => {
    prisma.supportTicket.findMany.mockResolvedValue([
      {
        ...makeTicket(),
        messages: [{ body: 'Latest', senderRole: 'admin', createdOn: new Date() }],
        _count: { messages: 2 },
      },
    ]);
    prisma.supportTicket.count.mockResolvedValue(1);

    const result = await getMyTickets({ page: 1, pageSize: 20 }, USER_ID);

    expect(prisma.supportTicket.findMany.mock.calls[0][0].where.userId).toBe(USER_ID);
    expect(prisma.supportTicket.findMany.mock.calls[0][0].orderBy).toEqual({
      lastMessageAt: 'desc',
    });
    expect(result.data.tickets[0].messageCount).toBe(2);
    expect(result.data.tickets[0].lastMessage.body).toBe('Latest');
  });
});

describe('getAdminTicket', () => {
  it('clears the admin unread flag when an admin opens it', async () => {
    prisma.supportTicket.findUnique.mockResolvedValue(makeTicket({ adminUnread: true }));
    prisma.supportTicket.update.mockResolvedValue({});

    await getAdminTicket({ ticketId: 7 });

    expect(prisma.supportTicket.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { adminUnread: false },
    });
  });
});
