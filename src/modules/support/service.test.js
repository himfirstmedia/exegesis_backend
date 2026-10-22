import { prisma } from '../../config/db.js';
import { uploadObject } from '../../services/objectStorage.js';
import { sendToUsers } from '../push/service.js';
import { emitToAdmins, emitToUser } from '../../realtime/index.js';
import {
  adminReply,
  createTicket,
  getAdminTicket,
  getMyTickets,
  getSupportStats,
  getTicket,
  getUnreadSummary,
  replyToTicket,
  updateTicketStatus,
  uploadAttachment,
} from './service.js';

jest.mock('../../config/db.js', () => ({
  prisma: {
    supportTicket: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      groupBy: jest.fn(),
    },
    supportMessage: {
      create: jest.fn(),
      updateMany: jest.fn(),
      updateManyAndReturn: jest.fn(),
    },
    message: { create: jest.fn() },
    systemUser: { findMany: jest.fn() },
    // The service passes an array of operations; resolve them together.
    $transaction: jest.fn((ops) => Promise.all(ops)),
  },
}));

// Keep the upload off the real disk / R2 bucket.
jest.mock('../../services/objectStorage.js', () => ({
  contentTypeForExtension: jest.fn((ext) =>
    ext === 'pdf' ? 'application/pdf' : `image/${ext}`,
  ),
  storedMediaLocation: jest.fn((url) =>
    /^(?:\/media\/|\/uploads\/)(?:covers|profile-photos|support)\//.test(String(url))
      ? { key: String(url).split('/').slice(2).join('/'), storage: 'local' }
      : null,
  ),
  uploadObject: jest.fn(),
}));

jest.mock('../push/service.js', () => ({
  sendToUsers: jest.fn().mockResolvedValue({ sent: 0, pruned: 0 }),
}));

jest.mock('../../realtime/index.js', () => ({
  REALTIME_EVENTS: {
    supportMessage: 'support:message',
    supportReceipt: 'support:receipt',
    supportTicketUpdated: 'support:ticket:updated',
    supportUnread: 'support:unread',
  },
  emitToAdmins: jest.fn(),
  emitToUser: jest.fn(),
  hasConnectedAdmins: jest.fn(() => false),
  hasConnectedUser: jest.fn(() => false),
  publishSupportEvent: jest.fn(),
}));

// 1x1 transparent PNG — a real image body so the magic-byte check passes.
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==';
const PDF_BASE64 = Buffer.from('%PDF-1.7\n%%EOF\n').toString('base64');

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
      deliveredAt: null,
      readAt: null,
      createdOn: new Date('2026-10-12T08:00:00.000Z'),
    },
  ],
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  prisma.systemUser.findMany.mockReset();
  prisma.systemUser.findMany.mockResolvedValue([]);
  prisma.message.create.mockResolvedValue({});
  prisma.supportTicket.updateMany.mockResolvedValue({ count: 0 });
  prisma.supportMessage.updateManyAndReturn.mockResolvedValue([]);
  uploadObject.mockResolvedValue({ key: 'support/x.png', url: '/media/support/x.png', storage: 'local' });
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
      attachment: null,
      attachmentName: null,
    });
    expect(createArgs.data.ticketCode).toMatch(/^SUP-\d{8}-[A-F0-9]{6}$/);
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
    prisma.supportTicket.findUnique.mockResolvedValue(makeTicket({
      userUnread: true,
      messages: [{
        ...makeTicket().messages[0],
        id: 2,
        senderId: ADMIN_ID,
        senderRole: 'admin',
      }],
    }));
    prisma.supportTicket.updateMany.mockResolvedValue({ count: 1 });

    const result = await getTicket({ ticketId: 7 }, USER_ID);

    expect(result.status).toBe(200);
    expect(prisma.supportTicket.updateMany).toHaveBeenCalledWith({
      where: {
        id: 7,
        userUnread: true,
        lastMessageAt: new Date('2026-10-12T08:00:00.000Z'),
      },
      data: { userUnread: false },
    });
    expect(result.data.userUnread).toBe(false);
    expect(prisma.supportMessage.updateManyAndReturn).toHaveBeenNthCalledWith(1, {
      where: { id: { in: [2] }, deliveredAt: null },
      data: { deliveredAt: expect.any(Date) },
      select: { id: true },
    });
    expect(prisma.supportMessage.updateManyAndReturn).toHaveBeenNthCalledWith(2, {
      where: { id: { in: [2] }, readAt: null },
      data: { readAt: expect.any(Date) },
      select: { id: true },
    });
  });

  it('pushes read receipts back to the admin room when the user opens a thread', async () => {
    prisma.supportTicket.findUnique.mockResolvedValue(makeTicket({
      messages: [{
        ...makeTicket().messages[0],
        id: 2,
        senderId: ADMIN_ID,
        senderRole: 'admin',
      }],
    }));
    prisma.supportMessage.updateManyAndReturn.mockResolvedValue([{ id: 2 }]);

    await getTicket({ ticketId: 7 }, USER_ID);

    expect(emitToAdmins).toHaveBeenCalledWith(
      'support:receipt',
      expect.objectContaining({
        messageIds: ['2'],
        ticketIds: ['7'],
        deliveredAt: expect.any(String),
        readAt: expect.any(String),
      }),
    );
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

  it('conditionally clears unread state already seen by the replying user', async () => {
    prisma.supportTicket.findUnique.mockResolvedValue(makeTicket({ userUnread: true }));
    prisma.supportMessage.create.mockResolvedValue({ id: 2 });
    prisma.supportTicket.update.mockResolvedValue({});

    await replyToTicket({ ticketId: 7, message: 'I saw your reply.' }, USER_ID);

    expect(prisma.supportTicket.updateMany).toHaveBeenCalledWith({
      where: {
        id: 7,
        userUnread: true,
        lastMessageAt: new Date('2026-10-12T08:00:00.000Z'),
      },
      data: { userUnread: false },
    });
  });

  it('pushes a support-message notification to admins on a user reply', async () => {
    prisma.systemUser.findMany.mockResolvedValue([{ id: ADMIN_ID, email: 'admin@test.local' }]);
    prisma.supportMessage.create.mockResolvedValue({
      id: 22,
      senderId: USER_ID,
      body: 'Any update?',
    });
    prisma.supportTicket.update.mockResolvedValue({});
    prisma.supportTicket.findUnique
      .mockResolvedValueOnce(makeTicket({ status: 'open' }))
      .mockResolvedValueOnce(makeTicket({ status: 'open' }));

    await replyToTicket({ ticketId: 7, message: 'Any update?' }, USER_ID);

    expect(sendToUsers).toHaveBeenCalledWith(
      [ADMIN_ID],
      expect.objectContaining({
        body: 'Any update?',
        data: expect.objectContaining({
          kind: 'support-message',
          audience: 'admin',
          screen: 'AdminSupport',
          ticketId: '7',
          messageId: '22',
          link: '/admin/support?ticketId=7',
        }),
      }),
    );
  });
});

describe('adminReply', () => {
  it.each([
    [{ sent: 1 }, 'accepted'],
    [{ sent: 0, disabled: true }, 'unavailable'],
    [{ sent: 0, noTokens: true }, 'no_devices'],
    [{ sent: 0, errorCodes: ['messaging/authentication-error'] }, 'failed'],
  ])('reports phone push status without treating a saved chat message as delivery: %j', async (delivery, status) => {
    prisma.supportTicket.findUnique.mockResolvedValue(makeTicket());
    prisma.supportMessage.create.mockResolvedValue({ id: 22, senderId: ADMIN_ID, body: 'Delivery status test' });
    prisma.supportTicket.update.mockResolvedValue({});
    sendToUsers.mockResolvedValueOnce(delivery);
    const result = await adminReply({ ticketId: 7, message: 'Delivery status test' }, ADMIN_ID);
    expect(result.status).toBe(200);
    expect(result.data.pushDelivery).toEqual({ sent: delivery.sent, status });
  });
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
      userUnread: true,
    });
    expect(updateArgs.data).not.toHaveProperty('adminUnread');
    expect(prisma.supportTicket.updateMany).toHaveBeenCalledWith({
      where: {
        id: 7,
        adminUnread: true,
        lastMessageAt: new Date('2026-10-12T08:00:00.000Z'),
      },
      data: { adminUnread: false },
    });
    expect(prisma.supportMessage.create).toHaveBeenCalledWith({
      data: {
        ticketId: 7,
        senderId: ADMIN_ID,
        senderRole: 'admin',
        body: 'Fixed in the next build.',
        attachment: null,
        attachmentName: null,
      },
    });
    expect(result.data.status).toBe('in_progress');
  });

  it('pushes a support-message notification to the ticket owner on an admin reply', async () => {
    prisma.supportMessage.create.mockResolvedValue({ id: 33 });
    prisma.supportTicket.update.mockResolvedValue({});
    prisma.supportTicket.findUnique
      .mockResolvedValueOnce(makeTicket({ status: 'open' }))
      .mockResolvedValueOnce(makeTicket({ status: 'in_progress', userUnread: true }));

    await adminReply({ ticketId: 7, message: 'Fixed in the next build.' }, ADMIN_ID);

    expect(sendToUsers).toHaveBeenCalledWith(
      [USER_ID],
      expect.objectContaining({
        data: expect.objectContaining({
          kind: 'support-message',
          audience: 'user',
          ticketId: '7',
          messageId: '33',
          link: '/support?ticketId=7',
        }),
      }),
    );
  });

  it('does not notify the user when the admin replies to their own ticket', async () => {
    // An admin who owns the ticket should not push to themselves.
    prisma.supportMessage.create.mockResolvedValue({ id: 34, senderId: ADMIN_ID });
    prisma.supportTicket.update.mockResolvedValue({});
    prisma.supportTicket.findUnique
      .mockResolvedValueOnce(makeTicket({ status: 'open', userId: ADMIN_ID }))
      .mockResolvedValueOnce(makeTicket({ status: 'in_progress', userUnread: true, userId: ADMIN_ID }));

    await adminReply({ ticketId: 7, message: 'Note to self.' }, ADMIN_ID);

    expect(sendToUsers).not.toHaveBeenCalled();
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

describe('attachments', () => {
  it('rejects an unsupported file type', async () => {
    const result = await uploadAttachment({
      attachment: Buffer.from('MZ\u0090 executable').toString('base64'),
      fileName: 'virus.exe',
    });
    expect(result.status).toBe(400);
    expect(uploadObject).not.toHaveBeenCalled();
  });

  it('rejects an attachment over 5MB', async () => {
    const big = Buffer.alloc(6 * 1024 * 1024, 1).toString('base64');
    const result = await uploadAttachment({ attachment: big, fileName: 'big.png' });
    expect(result.status).toBe(400);
    expect(result.message).toMatch(/too large/i);
  });

  it('stores a screenshot under the support/ prefix and returns its url', async () => {
    const result = await uploadAttachment({ attachment: PNG_BASE64, fileName: 'bug shot.png' });

    expect(result.status).toBe(201);
    expect(result.data.name).toBe('bug shot.png');
    expect(result.data.url).toMatch(/\/media\/support\//);
    const key = uploadObject.mock.calls[0][0].key;
    expect(key).toMatch(/^support\/[0-9a-f-]{36}\.png$/);
  });

  it('accepts a PDF and keeps its declared name', async () => {
    const result = await uploadAttachment({ attachment: PDF_BASE64, fileName: 'logs.pdf' });

    expect(result.status).toBe(201);
    expect(uploadObject.mock.calls[0][0].contentType).toBe('application/pdf');
    expect(uploadObject.mock.calls[0][0].key).toMatch(/\.pdf$/);
  });

  it('stores the attachment on the message when creating a ticket', async () => {
    prisma.supportTicket.create.mockResolvedValue(makeTicket());

    await createTicket(
      {
        subject: 'Screenshot attached',
        message: 'See the screenshot.',
        attachment: '/media/support/abc.png',
        attachmentName: 'abc.png',
      },
      USER_ID,
    );

    const data = prisma.supportTicket.create.mock.calls[0][0].data.messages.create;
    expect(data.attachment).toBe('/media/support/abc.png');
    expect(data.attachmentName).toBe('abc.png');
  });

  it('refuses an attachment hosted outside our storage', async () => {
    const result = await createTicket(
      { subject: 'External link', message: 'See https://evil.example.com/x.png', attachment: 'https://evil.example.com/x.png' },
      USER_ID,
    );

    expect(result.status).toBe(400);
    expect(prisma.supportTicket.create).not.toHaveBeenCalled();
  });

  it('allows an attachment-only reply', async () => {
    prisma.supportTicket.findUnique
      .mockResolvedValueOnce(makeTicket({ status: 'open' }))
      .mockResolvedValueOnce(makeTicket({ status: 'open' }));
    prisma.supportMessage.create.mockResolvedValue({});
    prisma.supportTicket.update.mockResolvedValue({});

    const result = await replyToTicket(
      { ticketId: 7, message: '', attachment: '/media/support/abc.pdf' },
      USER_ID,
    );

    expect(result.status).toBe(200);
    expect(prisma.supportMessage.create.mock.calls[0][0].data.attachment).toBe('/media/support/abc.pdf');
  });
});

describe('admin notifications', () => {
  it('queues one email per admin and pushes to their devices', async () => {
    prisma.systemUser.findMany.mockResolvedValue([
      { id: ADMIN_ID, email: 'admin@test.local' },
    ]);
    // Echo the submitted subject so the notification can be checked against it.
    prisma.supportTicket.create.mockImplementation(async ({ data }) =>
      makeTicket({ subject: data.subject, messages: [data.messages.create] }),
    );

    await createTicket(
      { subject: 'Broken app', message: 'It closes every time.' },
      USER_ID,
    );

    expect(prisma.message.create).toHaveBeenCalledTimes(1);
    const mail = prisma.message.create.mock.calls[0][0].data;
    expect(mail.recipient).toBe('admin@test.local');
    expect(mail.status).toBe('PENDING');
    expect(mail.subject).toContain('Broken app');
    expect(sendToUsers).toHaveBeenCalledWith([ADMIN_ID], expect.objectContaining({ title: expect.stringContaining('Broken app') }));
  });

  it('still delivers the ticket when notifying admins fails', async () => {
    prisma.systemUser.findMany.mockRejectedValue(new Error('db down'));
    prisma.supportTicket.create.mockImplementation(async ({ data }) =>
      makeTicket({ subject: data.subject, messages: [data.messages.create] }),
    );

    const result = await createTicket(
      { subject: 'Broken app', message: 'It closes every time.' },
      USER_ID,
    );

    expect(result.status).toBe(201);
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

describe('getUnreadSummary', () => {
  it('counts unread tickets using the authenticated UUID', async () => {
    prisma.supportTicket.count.mockResolvedValueOnce(3);

    const result = await getUnreadSummary({ id: USER_ID, userRole: 2 });

    expect(result).toEqual({
      status: 200,
      message: 'Unread summary fetched',
      data: { userUnreadCount: 3, adminUnreadCount: 0 },
    });
    expect(prisma.supportTicket.count).toHaveBeenCalledWith({
      where: { userId: USER_ID, userUnread: true },
    });
  });

  it('also returns the shared admin inbox count for admins', async () => {
    prisma.supportTicket.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(4);

    const result = await getUnreadSummary({ id: ADMIN_ID, userRole: 1 });

    expect(result.data).toEqual({
      userUnreadCount: 0,
      adminUnreadCount: 4,
    });
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
    prisma.supportTicket.updateMany.mockResolvedValue({ count: 1 });

    await getAdminTicket({ ticketId: 7 });

    expect(prisma.supportTicket.updateMany).toHaveBeenCalledWith({
      where: {
        id: 7,
        adminUnread: true,
        lastMessageAt: new Date('2026-10-12T08:00:00.000Z'),
      },
      data: { adminUnread: false },
    });
    expect(prisma.supportMessage.updateManyAndReturn).toHaveBeenNthCalledWith(1, {
      where: { id: { in: [1] }, deliveredAt: null },
      data: { deliveredAt: expect.any(Date) },
      select: { id: true },
    });
    expect(prisma.supportMessage.updateManyAndReturn).toHaveBeenNthCalledWith(2, {
      where: { id: { in: [1] }, readAt: null },
      data: { readAt: expect.any(Date) },
      select: { id: true },
    });
  });

  it('returns read receipts for user messages when the admin opens the thread', async () => {
    prisma.supportTicket.findUnique.mockResolvedValue(makeTicket({ adminUnread: false }));
    prisma.supportMessage.updateManyAndReturn.mockResolvedValue([{ id: 1 }]);

    const result = await getAdminTicket({ ticketId: 7 });

    expect(result.data.messages[0].deliveredAt).toEqual(expect.any(String));
    expect(result.data.messages[0].readAt).toEqual(expect.any(String));
  });

  it('preserves the original delivery time when marking a message read', async () => {
    const deliveredAt = new Date('2026-10-12T08:01:00.000Z');
    prisma.supportTicket.findUnique.mockResolvedValue(makeTicket({
      adminUnread: false,
      messages: [{ ...makeTicket().messages[0], deliveredAt }],
    }));
    prisma.supportMessage.updateManyAndReturn
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 1 }]);

    const result = await getAdminTicket({ ticketId: 7 });

    expect(prisma.supportMessage.updateManyAndReturn).toHaveBeenNthCalledWith(1, {
      where: { id: { in: [1] }, deliveredAt: null },
      data: { deliveredAt: expect.any(Date) },
      select: { id: true },
    });
    expect(prisma.supportMessage.updateManyAndReturn).toHaveBeenNthCalledWith(2, {
      where: { id: { in: [1] }, readAt: null },
      data: { readAt: expect.any(Date) },
      select: { id: true },
    });
    expect(result.data.messages[0].deliveredAt).toBe(deliveredAt.toISOString());
    expect(result.data.messages[0].readAt).toEqual(expect.any(String));
  });

  it('pushes read receipts to the ticket owner when an admin opens the thread', async () => {
    prisma.supportTicket.findUnique.mockResolvedValue(makeTicket({ adminUnread: false }));
    prisma.supportMessage.updateManyAndReturn.mockResolvedValue([{ id: 1 }]);

    await getAdminTicket({ ticketId: 7 });

    expect(emitToUser).toHaveBeenCalledWith(
      USER_ID,
      'support:receipt',
      expect.objectContaining({
        messageIds: ['1'],
        ticketIds: ['7'],
        deliveredAt: expect.any(String),
        readAt: expect.any(String),
      }),
    );
  });
});

describe('read-only realtime refreshes', () => {
  it('does not clear the user unread flag when markRead is false', async () => {
    prisma.supportTicket.findUnique.mockResolvedValue(makeTicket({
      userUnread: true,
      messages: [{
        ...makeTicket().messages[0],
        id: 2,
        senderId: ADMIN_ID,
        senderRole: 'admin',
      }],
    }));

    const result = await getTicket({ ticketId: 7, markRead: false }, USER_ID);

    expect(result.status).toBe(200);
    expect(prisma.supportTicket.updateMany).not.toHaveBeenCalled();
    expect(prisma.supportMessage.updateManyAndReturn).toHaveBeenCalledWith({
      where: { id: { in: [2] }, deliveredAt: null },
      data: { deliveredAt: expect.any(Date) },
      select: { id: true },
    });
    expect(result.data.userUnread).toBe(true);
  });

  it('does not clear the admin unread flag when markRead is false', async () => {
    prisma.supportTicket.findUnique.mockResolvedValue(makeTicket({ adminUnread: true }));

    const result = await getAdminTicket({ ticketId: 7, markRead: false });

    expect(result.status).toBe(200);
    expect(prisma.supportTicket.updateMany).not.toHaveBeenCalled();
    expect(prisma.supportMessage.updateManyAndReturn).toHaveBeenCalledWith({
      where: { id: { in: [1] }, deliveredAt: null },
      data: { deliveredAt: expect.any(Date) },
      select: { id: true },
    });
    expect(result.data.adminUnread).toBe(true);
  });
});
