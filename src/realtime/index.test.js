import http from "node:http";
import jwt from "jsonwebtoken";
import { io as connectClient } from "socket.io-client";
import { prisma } from "../config/db.js";
import { emitToUser, getIO, initRealtime } from "./index.js";

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
});
