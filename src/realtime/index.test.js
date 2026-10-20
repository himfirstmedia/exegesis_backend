import http from "node:http";
import jwt from "jsonwebtoken";
import { io as connectClient } from "socket.io-client";
import { prisma } from "../config/db.js";
import { emitToUser, getIO, initRealtime } from "./index.js";
import { getTicket, getAdminTicket } from '../modules/support/service.js';

jest.mock('../modules/support/service.js', () => ({
  getTicket: jest.fn(),
  getAdminTicket: jest.fn(),
}));

jest.mock("../config/db.js", () => ({
  prisma: {
    systemUser: { findUnique: jest.fn() },
    supportMessage: {
      findMany: jest.fn().mockResolvedValue([]),
      updateManyAndReturn: jest.fn().mockResolvedValue([]),
    },
  },
}));

describe("realtime socket authentication", () => {
  let server;
  let origin;

  beforeAll(async () => {
    process.env.JWT_SECRET = "realtime-test-secret";
    server = http.createServer();
    initRealtime(server);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    origin = `http://127.0.0.1:${server.address().port}`;
  });

  afterAll(async () => {
    await new Promise((resolve) => getIO().close(resolve));
  });

  const tokenFor = (payload) =>
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "5m" });

  const connect = (token) =>
    new Promise((resolve, reject) => {
      const client = connectClient(origin, {
        path: "/socket.io",
        transports: ["websocket"],
        auth: { token },
        reconnection: false,
      });
      client.once("connect", () => resolve(client));
      client.once("connect_error", (error) => {
        client.disconnect();
        reject(error);
      });
    });

  it("rejects a disabled account even when its JWT is valid", async () => {
    prisma.systemUser.findUnique.mockResolvedValue({
      status: false,
      accountStatus: "active",
      userRole: 2,
    });

    await expect(
      connect(tokenFor({ id: "disabled-user", userRole: 2 })),
    ).rejects.toThrow("Unauthorized");
  });

  it("uses the current database role and delivers only to the private room", async () => {
    prisma.systemUser.findUnique.mockResolvedValue({
      status: true,
      accountStatus: "active",
      userRole: 2,
    });
    const client = await connect(tokenFor({ id: "reader-1", userRole: 1 }));
    const serverSocket = [...getIO().sockets.sockets.values()][0];

    expect(serverSocket.rooms.has("user:reader-1")).toBe(true);
    expect(serverSocket.rooms.has("admins")).toBe(false);

    const received = new Promise((resolve) =>
      client.once("support:unread", resolve),
    );
    emitToUser("reader-1", "support:unread", { count: 2 });
    await expect(received).resolves.toEqual({ count: 2 });
    client.disconnect();
  });

  it("emits reconnect delivery receipts only for rows it updated", async () => {
    prisma.systemUser.findUnique
      .mockResolvedValueOnce({
        status: true,
        accountStatus: "active",
        userRole: 2,
      })
      .mockResolvedValueOnce({
        status: true,
        accountStatus: "active",
        userRole: 1,
      });
    prisma.supportMessage.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: 9n, ticketId: 3n, ticket: { userId: "reader-2" } },
        { id: 10n, ticketId: 3n, ticket: { userId: "reader-2" } },
      ]);
    prisma.supportMessage.updateManyAndReturn.mockResolvedValueOnce([{ id: 10n }]);

    const reader = await connect(tokenFor({ id: "reader-2", userRole: 2 }));
    const receipt = new Promise((resolve) =>
      reader.once("support:receipt", resolve),
    );
    const admin = await connect(tokenFor({ id: "admin-2", userRole: 1 }));

    await expect(receipt).resolves.toMatchObject({
      messageIds: ["10"],
      ticketIds: ["3"],
    });
    reader.disconnect();
    admin.disconnect();
  });

  it('syncs a reader snapshot and attachments using the authenticated identity', async () => {
    prisma.systemUser.findUnique.mockResolvedValue({ status: true, accountStatus: 'active', userRole: 2 });
    getTicket.mockResolvedValue({ status: 200, data: {
      id: '7', userId: 'reader-sync', messages: [{ id: '8', attachment: '/media/support/photo.jpg' }],
    } });
    const client = await connect(tokenFor({ id: 'reader-sync', userRole: 1 }));
    try {
      const result = await new Promise(resolve => client.emit('support:sync', { ticketId: 7, markRead: true, userId: 'someone-else' }, resolve));
      expect(getTicket).toHaveBeenCalledWith({ ticketId: '7', markRead: true }, 'reader-sync');
      expect(result).toMatchObject({ status: 200, presence: { userOnline: true }, data: { messages: [{ attachment: '/media/support/photo.jpg' }] } });
    } finally { client.disconnect(); }
  });

  it('reports app-wide reader presence without opening a support thread', async () => {
    prisma.systemUser.findUnique.mockResolvedValue({ status: true, accountStatus: 'active', userRole: 1 });
    const admin = await connect(tokenFor({ id: 'presence-admin' }));
    const waitForReader = (isOnline) => new Promise(resolve => {
      const listener = payload => {
        if (payload.userId !== 'presence-reader' || payload.userOnline !== isOnline) return;
        admin.off('support:presence', listener);
        resolve(payload);
      };
      admin.on('support:presence', listener);
    });
    try {
      prisma.systemUser.findUnique.mockResolvedValue({ status: true, accountStatus: 'active', userRole: 2 });
      const online = waitForReader(true);
      const reader = await connect(tokenFor({ id: 'presence-reader' }));
      await expect(online).resolves.toMatchObject({ userId: 'presence-reader', userOnline: true });
      const offline = waitForReader(false);
      reader.disconnect();
      await expect(offline).resolves.toMatchObject({ userId: 'presence-reader', userOnline: false });
    } finally { admin.disconnect(); }
  });

  it('returns access denial without disclosing presence for another ticket', async () => {
    prisma.systemUser.findUnique.mockResolvedValue({ status: true, accountStatus: 'active', userRole: 2 });
    getTicket.mockResolvedValue({ status: 404, message: 'Conversation not found' });
    const client = await connect(tokenFor({ id: 'reader-private' }));
    try {
      const result = await new Promise(resolve => client.emit('support:sync', { ticketId: 9 }, resolve));
      expect(result).toEqual({ status: 404, message: 'Conversation not found' });
    } finally { client.disconnect(); }
  });

  it('uses the admin service only for a current database admin', async () => {
    prisma.systemUser.findUnique.mockResolvedValue({ status: true, accountStatus: 'active', userRole: 1 });
    getAdminTicket.mockResolvedValue({ status: 200, data: { id: '7', userId: 'reader-sync', messages: [] } });
    const client = await connect(tokenFor({ id: 'admin-sync' }));
    try {
      const result = await new Promise(resolve => client.emit('support:sync', { ticketId: 7, markRead: true }, resolve));
      expect(getAdminTicket).toHaveBeenCalledWith({ ticketId: '7', markRead: true });
      expect(result).toMatchObject({ status: 200, presence: { adminOnline: true } });
    } finally { client.disconnect(); }
  });
});
