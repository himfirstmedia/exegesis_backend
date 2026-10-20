// Realtime (Socket.IO) server.
//
// Attached to the same HTTP server as the REST API so there is one host, one
// auth model (JWT), and one deploy. Clients join a private `user:<id>` room;
// admins additionally join the shared `admins` room. Feature services publish
// through the small helpers below and never touch the Socket.IO types directly.
import { Server } from "socket.io";
import { verifyToken } from "../utils/helpers.js";
import { ADMIN_ROOM, REALTIME_EVENTS, userRoom } from "./events.js";
import { prisma } from "../config/db.js";
import { withDbRetry } from "../utils/dbRetry.js";

let io = null;

/**
 * CORS mirrors the REST server: reflect the caller. Socket.IO needs an explicit
 * origin callback (it does not reuse the Express cors middleware).
 */
const corsOrigin = (origin, callback) => callback(null, true);

const authenticateSocket = async (socket) => {
  const token =
    socket.handshake?.auth?.token ||
    (typeof socket.handshake?.headers?.authorization === "string" &&
    socket.handshake.headers.authorization.startsWith("Bearer ")
      ? socket.handshake.headers.authorization.slice(7)
      : null);

  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded?.id) return null;

  const account = await withDbRetry(() =>
    prisma.systemUser.findUnique({
      where: { id: decoded.id },
      select: { status: true, accountStatus: true, userRole: true },
    }),
  );
  if (!account || !account.status || account.accountStatus === "deleted") {
    return null;
  }

  // Use the current database role, not a potentially long-lived JWT claim.
  return { ...decoded, userRole: Number(account.userRole) };
};

const joinRooms = (socket, user) => {
  if (!user?.id) return;
  socket.join(userRoom(user.id));
  if (Number(user.userRole) === 1) socket.join(ADMIN_ROOM);
};

const markWaitingMessagesDelivered = async (user) => {
  const isAdmin = Number(user.userRole) === 1;
  const waiting = await withDbRetry(() =>
    prisma.supportMessage.findMany({
      where: isAdmin
        ? { senderRole: "user", deliveredAt: null }
        : {
            senderRole: "admin",
            deliveredAt: null,
            ticket: { userId: user.id },
          },
      select: {
        id: true,
        ticketId: true,
        ticket: { select: { userId: true } },
      },
    }),
  );
  if (waiting.length === 0) return;

  const deliveredAt = new Date();
  const delivered = await withDbRetry(() =>
    prisma.supportMessage.updateManyAndReturn({
      where: {
        id: { in: waiting.map((message) => message.id) },
        deliveredAt: null,
      },
      data: { deliveredAt },
      select: { id: true },
    }),
  );
  if (delivered.length === 0) return;
  const deliveredIds = new Set(delivered.map((message) => String(message.id)));
  const deliveredMessages = waiting.filter((message) =>
    deliveredIds.has(String(message.id)),
  );

  const payload = {
    messageIds: deliveredMessages.map((message) => String(message.id)),
    ticketIds: [...new Set(deliveredMessages.map((message) => String(message.ticketId)))],
    deliveredAt: deliveredAt.toISOString(),
    at: deliveredAt.toISOString(),
  };
  if (!isAdmin) {
    emitToAdmins(REALTIME_EVENTS.supportReceipt, payload);
    return;
  }

  const messagesByUser = new Map();
  for (const message of deliveredMessages) {
    const userId = message.ticket.userId;
    const current = messagesByUser.get(userId) ?? [];
    current.push(message);
    messagesByUser.set(userId, current);
  }
  for (const [userId, messages] of messagesByUser) {
    emitToUser(userId, REALTIME_EVENTS.supportReceipt, {
      ...payload,
      messageIds: messages.map((message) => String(message.id)),
      ticketIds: [...new Set(messages.map((message) => String(message.ticketId)))],
    });
  }
};

export const initRealtime = (httpServer) => {
  if (io) return io;

  io = new Server(httpServer, {
    path: "/socket.io",
    cors: { origin: corsOrigin, credentials: true },
    // Polling first keeps flaky mobile networks working; Socket.IO upgrades to
    // websocket when it can.
    transports: ["polling", "websocket"],
  });

  io.use(async (socket, next) => {
    try {
      const user = await authenticateSocket(socket);
      if (!user) return next(new Error("Unauthorized"));
      socket.data.user = user;
      return next();
    } catch (error) {
      console.error("[realtime] Socket authentication failed:", error.message);
      return next(new Error("Authentication unavailable"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;
    joinRooms(socket, user);
    // App-wide connectivity, not whether the Support screen is open.
    const publishPresence = () => {
      emitToAdmins(REALTIME_EVENTS.supportPresence, {
        userId: String(user.id), userOnline: hasConnectedUser(user.id),
      });
      if (Number(user.userRole) === 1) {
        io.emit(REALTIME_EVENTS.supportPresence, { adminOnline: hasConnectedAdmins() });
      }
    };
    publishPresence();
    socket.emit(REALTIME_EVENTS.supportPresence, { adminOnline: hasConnectedAdmins() });
    // Reuse the same ownership checks and receipt writes as REST. A reconnect
    // fetches a durable snapshot, rather than assuming socket events replay.
    socket.on("support:sync", async (payload, acknowledge) => {
      if (typeof acknowledge !== "function") return;
      try {
        const ticketId = String(payload?.ticketId ?? "");
        if (!/^[1-9]\d*$/.test(ticketId)) {
          acknowledge({ status: 400, message: "Invalid conversation" });
          return;
        }
        const { getTicket, getAdminTicket } = await import("../modules/support/service.js");
        const data = { ticketId, markRead: payload?.markRead === true };
        const result = Number(user.userRole) === 1
          ? await getAdminTicket(data)
          : await getTicket(data, user.id);
        if (result.status === 200) {
          result.presence = {
            userOnline: hasConnectedUser(result.data.userId),
            adminOnline: hasConnectedAdmins(),
          };
        }
        acknowledge(result);
      } catch (error) {
        console.warn("[realtime] Support sync failed:", error.message);
        acknowledge({ status: 503, message: "Conversation sync unavailable" });
      }
    });
    markWaitingMessagesDelivered(user).catch((error) => {
      console.warn("[realtime] Failed to update support delivery receipts:", error.message);
    });

    // Existing clients send this after connect. A changed identity must create
    // a fresh connection so the socket can never retain a previous user's room.
    socket.on("client:auth", async (payload) => {
      const token = payload?.token;
      const decoded = token ? verifyToken(token) : null;
      if (!decoded || String(decoded.id) !== String(user.id)) {
        socket.disconnect(true);
      }
    });

    socket.on("client:hello", () => {
      // No-op handshake acknowledgement; keeps older clients happy.
    });

    socket.on("client:subscribe", (payload) => {
      // Topics are intentionally not free-form: private rooms are derived from
      // the authenticated user only, so a client cannot subscribe to another
      // user's room.
      if (user) joinRooms(socket, user);
      void payload;
    });

    socket.on("client:unsubscribe", () => {});
    socket.on("disconnect", publishPresence);
  });

  console.log("[realtime] Socket.IO server ready on /socket.io");
  return io;
};

export const getIO = () => io;

/** True once the server is attached (used to skip work in tests/boot). */
export const isRealtimeReady = () => Boolean(io);

/**
 * Publish an event to a single user's private room. Safe to call before the
 * realtime server is initialized (returns false) so feature code can emit
 * unconditionally without an init-order dependency.
 */
export const emitToUser = (userId, event, payload) => {
  if (!io || !userId) return false;
  io.to(userRoom(userId)).emit(event, payload);
  return true;
};

/** Publish an event to every connected admin. */
export const emitToAdmins = (event, payload) => {
  if (!io) return false;
  io.to(ADMIN_ROOM).emit(event, payload);
  return true;
};

/** True when at least one admin socket is currently in the admin room. */
export const hasConnectedAdmins = () => {
  if (!io) return false;
  try {
    return (io.sockets.adapter.rooms.get(ADMIN_ROOM)?.size ?? 0) > 0;
  } catch (error) {
    return false;
  }
};

/** True when the user currently has at least one connected client. */
export const hasConnectedUser = (userId) => {
  if (!io || !userId) return false;
  try {
    return (io.sockets.adapter.rooms.get(userRoom(userId))?.size ?? 0) > 0;
  } catch (error) {
    return false;
  }
};

export { REALTIME_EVENTS, ADMIN_ROOM, userRoom } from "./events.js";

/**
 * Fan out a full support envelope. `audience` selects user/admins and the
 * envelope carries both the ticket summary and the new message so a client can
 * update its list and open thread without a refetch.
 */
export const publishSupportEvent = ({
  audience,
  userId,
  event = REALTIME_EVENTS.supportMessage,
  ticket,
  message,
  unreadCount,
}) => {
  const payload = {
    event,
    ticket,
    message: message ?? null,
    unreadCount: typeof unreadCount === "number" ? unreadCount : undefined,
    at: new Date().toISOString(),
  };
  if (audience === "admin") return emitToAdmins(event, payload);
  return emitToUser(userId, event, payload);
};
