// Support module — user complaints / messages to admins.
//
// A ticket is a conversation thread: the first SupportMessage is the complaint
// the user submits, every later row is a reply from either side. Both the user
// app and the admin dashboard read from the same thread, so there is exactly
// one history per issue.
import crypto from "crypto";
import { prisma } from "../../config/db.js";
import { serializeBigInt } from "../../utils/helpers.js";
import { withDbRetry } from "../../utils/dbRetry.js";
import {
  contentTypeForExtension,
  storedMediaLocation,
  uploadObject,
} from "../../services/objectStorage.js";
import { emailTemplates } from "../../utils/emailTemplates.js";
import { sendToUsers } from "../push/service.js";
import { decodeAttachmentUpload, safeAttachmentName } from "./attachmentUpload.js";
import {
  REALTIME_EVENTS,
  emitToAdmins,
  emitToUser,
  hasConnectedAdmins,
  hasConnectedUser,
  publishSupportEvent,
} from "../../realtime/index.js";

export const SUPPORT_CATEGORIES = [
  "account",
  "bible",
  "content",
  "subscription",
  "technical",
  "suggestion",
  "other",
];

export const SUPPORT_PRIORITIES = ["low", "normal", "high"];

export const SUPPORT_STATUSES = ["open", "in_progress", "resolved", "closed"];

// Ticket is "settled" once an admin has dealt with it. A user reply reopens it.
const SETTLED_STATUSES = ["resolved", "closed"];

const LIMITS = {
  subjectMin: 3,
  subjectMax: 140,
  bodyMin: 10,
  bodyMax: 4000,
  deviceInfoMax: 300,
  attachmentNameMax: 120,
};

const makeTicketCode = () => {
  const now = new Date();
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SUP-${datePart}-${randomPart}`;
};

const cleanText = (value) => String(value ?? "").trim();

const normalizePage = (page, pageSize) => {
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const pageSizeNum = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 50);
  return { pageNum, pageSizeNum, offset: (pageNum - 1) * pageSizeNum };
};

/** Whose turn it is: the user reads their own thread, admins read all of them. */
const summarySelect = {
  messages: {
    orderBy: [{ createdOn: "desc" }, { id: "desc" }],
    take: 1,
    select: {
      body: true,
      senderRole: true,
      createdOn: true,
      attachment: true,
      attachmentName: true,
      deliveredAt: true,
      readAt: true,
    },
  },
  _count: { select: { messages: true } },
};

/**
 * Attachments must already live in our own storage — a client cannot point a
 * message at an arbitrary external URL.
 */
const normalizeAttachment = (attachment, attachmentName) => {
  if (!attachment) return { attachment: null, attachmentName: null };
  const stored = storedMediaLocation(String(attachment));
  if (!stored) return { error: "Attachment must be uploaded first." };
  const name = attachmentName
    ? safeAttachmentName(attachmentName, "file").slice(0, LIMITS.attachmentNameMax)
    : null;
  return { attachment: String(attachment), attachmentName: name };
};

// ─── Admin notifications ─────────────────────────────────────────────────────
// Never allowed to break a reader's send: failures are logged and swallowed.

const getAdminContacts = async () => {
  const configured = String(process.env.SUPPORT_ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const admins = await withDbRetry(() =>
    prisma.systemUser.findMany({
      where: { userRole: 1, status: true, accountStatus: "active" },
      select: { id: true, email: true },
    }),
  );
  const ids = admins.map((admin) => admin.id);
  const emails = new Set(admins.map((admin) => admin.email).filter(Boolean));
  configured.forEach((email) => emails.add(email));
  return { ids, emails: [...emails] };
};

export const notifySupportMessage = async (ticket, message, audience) => {
  try {
    const ids = audience === "admin"
      ? (await getAdminContacts()).ids.filter(id => id !== message.senderId)
      : [ticket.userId].filter(id => id !== message.senderId);
    if (!ids.length) return;
    const path = audience === "admin" ? "/admin/support" : "/support";
    const preview = String(message.body || "").replace(/\s+/g, " ").trim().slice(0, 140);
    let imageUrl;
    if (/\.(png|jpe?g|webp)(?:\?|$)/i.test(message.attachment || '')) {
      try { imageUrl = new URL(message.attachment, process.env.BACKEND_URL || undefined).href; } catch { /* Client resolves relative media URLs. */ }
    }
    const title = audience === "admin"
        ? `Support: ${ticket.subject}`.slice(0, 120)
        : "Exegesis Support replied";
    const body = preview || (message.attachment ? 'New attachment. Tap to view it.' : "You have a new support message. Tap to open the conversation.");
    const result = await sendToUsers(ids, {
      imageUrl,
      title,
      body,
      data: {
        kind: "support-message",
        notificationTitle: title,
        notificationBody: body,
        audience,
        screen: audience === "admin" ? "AdminSupport" : "SupportThread",
        ticketId: String(ticket.id),
        messageId: String(message.id),
        deepLink: `exegesis://support/${ticket.id}?messageId=${message.id}`,
        notificationId: `support-message-${message.id}`,
        ...(/\.(png|jpe?g|webp)(?:\?|$)/i.test(message.attachment || '') && { imageUrl: imageUrl || message.attachment }),
        link: `${path}?ticketId=${ticket.id}`,
      },
    });
    console.info('[support:push]', { ticketId: String(ticket.id), messageId: String(message.id), audience,
      sent: result?.sent ?? 0, disabled: result?.disabled === true });
    return result;
  } catch (error) {
    // The message is already persisted; a notification outage cannot turn a
    // successful send into a retry that would duplicate the support message.
    console.error("[Support] Message push failed:", error.message);
  }
};

export const notifyAdminsOfNewTicket = async (ticket) => {
  try {
    const { ids, emails } = await getAdminContacts();
    if (ids.length === 0 && emails.length === 0) return;

    const adminUrl = `${(process.env.CLIENT_URL || "https://exegesisproject.org").replace(/\/+$/, "")}/admin/support`;
    const template = emailTemplates.newSupportTicket({
      ticket,
      reporter: ticket.user,
      adminUrl,
    });

    for (const recipient of emails) {
      await withDbRetry(() =>
        prisma.message.create({
          data: {
            message: template.html,
            recipient,
            subject: template.subject,
            status: "PENDING",
            sendCount: 0n,
            createdBy: ticket.userId,
            createdOn: new Date(),
          },
        }),
      );
    }

  } catch (error) {
    console.error("[Support] Failed to notify admins:", error.message);
  }
  const message = ticket.messages?.[0];
  if (message) await notifySupportMessage(ticket, message, "admin");
};

const serializeTicketSummary = (ticket) => {
  const serialized = serializeBigInt(ticket);
  const lastMessage = serialized.messages?.[0] ?? null;
  return {
    id: serialized.id,
    ticketCode: serialized.ticketCode,
    subject: serialized.subject,
    category: serialized.category,
    priority: serialized.priority,
    status: serialized.status,
    adminUnread: serialized.adminUnread,
    userUnread: serialized.userUnread,
    deviceInfo: serialized.deviceInfo,
    lastMessageAt: serialized.lastMessageAt,
    createdOn: serialized.createdOn,
    updatedOn: serialized.updatedOn,
    resolvedAt: serialized.resolvedAt,
    messageCount: serialized._count?.messages ?? 0,
    lastMessage,
    user: serialized.user,
  };
};

const serializeTicketDetail = (ticket) => {
  const serialized = serializeBigInt(ticket);
  return {
    ...serialized,
    messageCount: serialized.messages?.length ?? 0,
  };
};

const buildRealtimeSummary = (ticket) => {
  const serialized = serializeBigInt(ticket);
  const messages = Array.isArray(serialized.messages)
    ? serialized.messages
    : [];
  const lastMessage =
    messages.length > 0
      ? messages[messages.length - 1]
      : (serialized.lastMessage ? serialized.lastMessage : null);
  const messageCount = messages.length || serialized._count?.messages || 0;
  return {
    id: serialized.id,
    ticketCode: serialized.ticketCode,
    userId: serialized.userId,
    subject: serialized.subject,
    category: serialized.category,
    priority: serialized.priority,
    status: serialized.status,
    deviceInfo: serialized.deviceInfo,
    adminUnread: serialized.adminUnread,
    userUnread: serialized.userUnread,
    lastMessageAt: serialized.lastMessageAt,
    resolvedAt: serialized.resolvedAt,
    resolvedBy: serialized.resolvedBy,
    createdOn: serialized.createdOn,
    updatedOn: serialized.updatedOn,
    user: serialized.user
      ? {
          id: serialized.user.id,
          firstName: serialized.user.firstName,
          lastName: serialized.user.lastName,
          username: serialized.user.username,
          email: serialized.user.email,
          profilePhotoUrl: serialized.user.profilePhotoUrl,
          subscriptionTier: serialized.user.subscriptionTier,
        }
      : null,
    messageCount,
    lastMessage: lastMessage
      ? {
          id: lastMessage.id,
          ticketId: lastMessage.ticketId,
          senderId: lastMessage.senderId,
          senderRole: lastMessage.senderRole,
          body: lastMessage.body,
          attachment: lastMessage.attachment,
          attachmentName: lastMessage.attachmentName,
          deliveredAt: lastMessage.deliveredAt,
          readAt: lastMessage.readAt,
          createdOn: lastMessage.createdOn,
        }
      : null,
    _count: serialized._count ? { messages: messageCount } : undefined,
  };
};

const emitSupportMessageToUserAndAdmins = (ticket, message) => {
  const summary = buildRealtimeSummary(ticket);
  const msg = serializeBigInt(message);
  publishSupportEvent({
    audience: "admin",
    event: REALTIME_EVENTS.supportMessage,
    ticket: summary,
    message: msg,
  });
  publishSupportEvent({
    audience: "user",
    userId: ticket.userId,
    event: REALTIME_EVENTS.supportMessage,
    ticket: summary,
    message: msg,
  });
  // Signal unread refresh for both rooms.
  publishSupportEvent({
    audience: "admin",
    event: REALTIME_EVENTS.supportUnread,
    ticket: summary,
    message: null,
  });
  publishSupportEvent({
    audience: "user",
    userId: ticket.userId,
    event: REALTIME_EVENTS.supportUnread,
    ticket: summary,
    message: null,
  });
};

const emitTicketUpdate = (ticket) => {
  const summary = buildRealtimeSummary(ticket);
  publishSupportEvent({
    audience: "admin",
    event: REALTIME_EVENTS.supportTicketUpdated,
    ticket: summary,
    message: null,
  });
  publishSupportEvent({
    audience: "user",
    userId: ticket.userId,
    event: REALTIME_EVENTS.supportTicketUpdated,
    ticket: summary,
    message: null,
  });
  // Unread badge refresh.
  publishSupportEvent({
    audience: "admin",
    event: REALTIME_EVENTS.supportUnread,
    ticket: summary,
    message: null,
  });
  publishSupportEvent({
    audience: "user",
    userId: ticket.userId,
    event: REALTIME_EVENTS.supportUnread,
    ticket: summary,
    message: null,
  });
};

/**
 * Tell the *sender* that their messages were delivered/read. `recipientRole`
 * is the side that just opened the conversation, so the receipt always goes to
 * the opposite room and its `messageIds` only contain the sender's messages.
 */
const emitSupportReceipt = (ticket, recipientRole, receipts) => {
  if (!receipts?.changed || receipts.messageIds.length === 0) return;
  const payload = {
    ticketIds: [String(ticket.id)],
    messageIds: receipts.messageIds.map(String),
    ...(receipts.deliveredAt && {
      deliveredAt: receipts.deliveredAt.toISOString(),
    }),
    ...(receipts.readAt && { readAt: receipts.readAt.toISOString() }),
    at: new Date().toISOString(),
  };
  if (recipientRole === "user") {
    emitToAdmins(REALTIME_EVENTS.supportReceipt, payload);
  } else {
    emitToUser(ticket.userId, REALTIME_EVENTS.supportReceipt, payload);
  }
};

const userSelect = {
  id: true,
  firstName: true,
  lastName: true,
  username: true,
  email: true,
  profilePhotoUrl: true,
  subscriptionTier: true,
};

const findTicketOrFail = async (ticketId) => {
  const id = Number(ticketId);
  if (!Number.isFinite(id) || id <= 0) return null;
  return withDbRetry(() =>
    prisma.supportTicket.findUnique({
      where: { id },
      include: {
        messages: { orderBy: [{ createdOn: "asc" }, { id: "asc" }] },
        user: { select: userSelect },
      },
    }),
  );
};

const markMessagesReceived = async (ticket, recipientRole, markRead) => {
  const senderRole = recipientRole === "admin" ? "user" : "admin";
  const messageIds = ticket.messages
    .filter((message) => message.senderRole === senderRole)
    .map((message) => message.id);
  if (messageIds.length === 0) {
    return {
      changed: false,
      messageIds: [],
      deliveredAt: null,
      readAt: null,
    };
  }

  const now = new Date();
  const delivered = await withDbRetry(() =>
    prisma.supportMessage.updateManyAndReturn({
      where: {
        id: { in: messageIds },
        deliveredAt: null,
      },
      data: { deliveredAt: now },
      select: { id: true },
    }),
  );
  const read = markRead
    ? await withDbRetry(() =>
        prisma.supportMessage.updateManyAndReturn({
          where: { id: { in: messageIds }, readAt: null },
          data: { readAt: now },
          select: { id: true },
        }),
      )
    : [];

  const deliveredIds = new Set(delivered.map((message) => String(message.id)));
  const readIds = new Set(read.map((message) => String(message.id)));
  if (delivered.length > 0 || read.length > 0) {
    for (const message of ticket.messages) {
      if (message.senderRole !== senderRole) continue;
      if (deliveredIds.has(String(message.id))) message.deliveredAt = now;
      if (readIds.has(String(message.id))) message.readAt = now;
    }
  }

  const changedIds = new Set([...deliveredIds, ...readIds]);
  return {
    changed: changedIds.size > 0,
    messageIds: messageIds.filter((id) => changedIds.has(String(id))),
    deliveredAt: delivered.length > 0 ? now : null,
    readAt: read.length > 0 ? now : null,
  };
};

// ─── Attachments ─────────────────────────────────────────────────────────────
// Screenshots and PDFs are uploaded first (base64 → object storage), then the
// returned URL is attached to the message on create/reply.

export const uploadAttachment = async (data) => {
  const decoded = decodeAttachmentUpload(
    data?.attachment ?? data?.file ?? data?.data,
    data?.fileName ?? data?.name,
  );
  if (decoded.error) return decoded.error;

  const key = `support/${crypto.randomUUID()}.${decoded.extension}`;
  let stored;
  try {
    stored = await uploadObject({
      key,
      buffer: decoded.buffer,
      contentType: contentTypeForExtension(decoded.extension),
    });
  } catch (error) {
    console.error("Support attachment upload failed:", error);
    return { status: 500, message: "Failed to store the attachment" };
  }

  return {
    status: 201,
    message: "Attachment uploaded",
    data: {
      url: stored.url,
      name: decoded.name,
      size: decoded.buffer.length,
      type: contentTypeForExtension(decoded.extension),
    },
  };
};

// ─── User-side ───────────────────────────────────────────────────────────────

export const createTicket = async (data, userId) => {
  const subject = cleanText(data?.subject);
  const body = cleanText(data?.message ?? data?.body);
  const category = SUPPORT_CATEGORIES.includes(data?.category)
    ? data.category
    : "other";
  const priority = SUPPORT_PRIORITIES.includes(data?.priority)
    ? data.priority
    : "normal";
  const deviceInfo = data?.deviceInfo
    ? cleanText(data.deviceInfo).slice(0, LIMITS.deviceInfoMax)
    : null;

  if (subject.length < LIMITS.subjectMin) {
    return {
      status: 400,
      message: `Please add a short subject (at least ${LIMITS.subjectMin} characters).`,
    };
  }
  if (subject.length > LIMITS.subjectMax) {
    return {
      status: 400,
      message: `Subject must be ${LIMITS.subjectMax} characters or fewer.`,
    };
  }
  const attached = normalizeAttachment(data?.attachment, data?.attachmentName);
  if (attached.error) return { status: 400, message: attached.error };
  if (!attached.attachment && body.length < LIMITS.bodyMin) {
    return {
      status: 400,
      message: `Please describe the issue in at least ${LIMITS.bodyMin} characters.`,
    };
  }
  if (body.length > LIMITS.bodyMax) {
    return {
      status: 400,
      message: `Message must be ${LIMITS.bodyMax} characters or fewer.`,
    };
  }

  const now = new Date();
  const ticket = await withDbRetry(() =>
    prisma.supportTicket.create({
      data: {
        ticketCode: makeTicketCode(),
        userId,
        subject,
        category,
        priority,
        deviceInfo,
        status: "open",
        adminUnread: true,
        userUnread: false,
        lastMessageAt: now,
        messages: {
          create: {
            senderId: userId,
            senderRole: "user",
            body,
            attachment: attached.attachment,
            attachmentName: attached.attachmentName,
            ...(hasConnectedAdmins() ? { deliveredAt: now } : {}),
          },
        },
      },
      include: {
        messages: { orderBy: [{ createdOn: "asc" }, { id: "asc" }] },
        user: { select: userSelect },
      },
    }),
  );

  // The notifier swallows delivery failures, so readers still get a successful
  // response while tests and callers can rely on notification work completing.
  await notifyAdminsOfNewTicket(ticket);

  // Realtime: new ticket from user -> push to admins (and also user room for completeness).
  try {
    emitSupportMessageToUserAndAdmins(ticket, ticket.messages?.[ticket.messages.length - 1]);
  } catch (error) {
    console.warn("[support] Realtime emit failed for new ticket:", error.message);
  }

  return {
    status: 201,
    message: "Your message has been sent. Our team will reply soon.",
    data: serializeTicketDetail(ticket),
  };
};

export const getMyTickets = async (data, userId) => {
  const { pageNum, pageSizeNum, offset } = normalizePage(
    data?.page,
    data?.pageSize,
  );
  const status = SUPPORT_STATUSES.includes(data?.status) ? data.status : null;

  const where = { userId, ...(status ? { status } : {}) };

  const [tickets, totalCount, unreadCount] = await Promise.all([
    withDbRetry(() =>
      prisma.supportTicket.findMany({
        where,
        skip: offset,
        take: pageSizeNum,
        orderBy: { lastMessageAt: "desc" },
        include: summarySelect,
      }),
    ),
    withDbRetry(() => prisma.supportTicket.count({ where })),
    withDbRetry(() =>
      prisma.supportTicket.count({ where: { userId, userUnread: true } }),
    ),
  ]);

  return {
    status: 200,
    message: "Tickets fetched successfully",
    data: {
      tickets: tickets.map(serializeTicketSummary),
      totalCount,
      unreadCount,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(totalCount / pageSizeNum),
    },
  };
};

export const getTicket = async (data, userId) => {
  const ticket = await findTicketOrFail(data?.ticketId ?? data?.id);
  if (!ticket || ticket.userId !== userId) {
    return { status: 404, message: "Conversation not found" };
  }

  const markRead = data?.markRead !== false;
  const receipts = await markMessagesReceived(ticket, "user", markRead);
  let unreadChanged = false;
  if (ticket.userUnread && markRead) {
    const result = await withDbRetry(() =>
      prisma.supportTicket.updateMany({
        where: {
          id: ticket.id,
          userUnread: true,
          lastMessageAt: ticket.lastMessageAt,
        },
        data: { userUnread: false },
      }),
    );
    if ((result?.count ?? 0) > 0) {
      ticket.userUnread = false;
      unreadChanged = true;
    }
  }
  const currentTicket = await findTicketOrFail(ticket.id) ?? ticket;
  if (receipts.changed || unreadChanged) {
    emitSupportReceipt(currentTicket, "user", receipts);
    emitTicketUpdate(currentTicket);
  }

  return {
    status: 200,
    message: "Conversation fetched successfully",
    data: serializeTicketDetail(currentTicket),
  };
};

export const replyToTicket = async (data, userId) => {
  const body = cleanText(data?.message ?? data?.body);
  const attached = normalizeAttachment(data?.attachment, data?.attachmentName);
  if (attached.error) return { status: 400, message: attached.error };
  if (!body && !attached.attachment) {
    return { status: 400, message: "Add a message or an attachment." };
  }
  if (body.length > LIMITS.bodyMax) {
    return {
      status: 400,
      message: `Message must be ${LIMITS.bodyMax} characters or fewer.`,
    };
  }

  const ticket = await withDbRetry(() =>
    prisma.supportTicket.findUnique({ where: { id: Number(data?.ticketId ?? data?.id) } }),
  );
  if (!ticket || ticket.userId !== userId) {
    return { status: 404, message: "Conversation not found" };
  }
  if (ticket.status === "closed") {
    return {
      status: 400,
      message:
        "This conversation was closed. Please start a new message if you still need help.",
    };
  }

  const now = new Date();
  const operations = [];
  if (ticket.userUnread) {
    operations.push(
      prisma.supportTicket.updateMany({
        where: {
          id: ticket.id,
          userUnread: true,
          lastMessageAt: ticket.lastMessageAt,
        },
        data: { userUnread: false },
      }),
    );
  }
  const messageOperationIndex = operations.length;
  operations.push(
    prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: userId,
        senderRole: "user",
        body,
        attachment: attached.attachment,
        attachmentName: attached.attachmentName,
        ...(hasConnectedAdmins() ? { deliveredAt: now } : {}),
      },
    }),
    prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        lastMessageAt: now,
        adminUnread: true,
        // A reply on a settled ticket puts it back in the admin queue.
        status: SETTLED_STATUSES.includes(ticket.status) ? "open" : ticket.status,
        resolvedAt: null,
      },
    }),
  );
  const transactionResult = await withDbRetry(() =>
    prisma.$transaction(operations),
  );
  const createdMessage = transactionResult[messageOperationIndex];

  const updated = await findTicketOrFail(ticket.id);
  try {
    emitSupportMessageToUserAndAdmins(updated, createdMessage);
  } catch (error) {
    console.warn("[support] Realtime emit failed for user reply:", error.message);
  }
  await notifySupportMessage(updated, createdMessage, "admin");
  return {
    status: 200,
    message: "Reply sent",
    data: serializeTicketDetail(updated),
  };
};

// ─── Admin-side ──────────────────────────────────────────────────────────────

export const getAdminTickets = async (data) => {
  const { pageNum, pageSizeNum, offset } = normalizePage(
    data?.page,
    data?.pageSize,
  );
  const status = SUPPORT_STATUSES.includes(data?.status) ? data.status : null;
  const category = SUPPORT_CATEGORIES.includes(data?.category)
    ? data.category
    : null;
  const search = cleanText(data?.search);

  const where = {
    ...(status ? { status } : {}),
    ...(category ? { category } : {}),
    ...(search
      ? {
          OR: [
            { subject: { contains: search, mode: "insensitive" } },
            { ticketCode: { contains: search, mode: "insensitive" } },
            { user: { email: { contains: search, mode: "insensitive" } } },
            { user: { username: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [tickets, totalCount] = await Promise.all([
    withDbRetry(() =>
      prisma.supportTicket.findMany({
        where,
        skip: offset,
        take: pageSizeNum,
        orderBy: [{ adminUnread: "desc" }, { lastMessageAt: "desc" }],
        include: { ...summarySelect, user: { select: userSelect } },
      }),
    ),
    withDbRetry(() => prisma.supportTicket.count({ where })),
  ]);

  return {
    status: 200,
    message: "Tickets fetched successfully",
    data: {
      tickets: tickets.map(serializeTicketSummary),
      totalCount,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(totalCount / pageSizeNum),
    },
  };
};

export const getAdminTicket = async (data) => {
  const ticket = await findTicketOrFail(data?.ticketId ?? data?.id);
  if (!ticket) return { status: 404, message: "Conversation not found" };

  const markRead = data?.markRead !== false;
  const receipts = await markMessagesReceived(ticket, "admin", markRead);
  let unreadChanged = false;
  if (ticket.adminUnread && markRead) {
    const result = await withDbRetry(() =>
      prisma.supportTicket.updateMany({
        where: {
          id: ticket.id,
          adminUnread: true,
          lastMessageAt: ticket.lastMessageAt,
        },
        data: { adminUnread: false },
      }),
    );
    if ((result?.count ?? 0) > 0) {
      ticket.adminUnread = false;
      unreadChanged = true;
    }
  }
  const currentTicket = await findTicketOrFail(ticket.id) ?? ticket;
  if (receipts.changed || unreadChanged) {
    emitSupportReceipt(currentTicket, "admin", receipts);
    emitTicketUpdate(currentTicket);
  }

  return {
    status: 200,
    message: "Conversation fetched successfully",
    data: serializeTicketDetail(currentTicket),
  };
};

export const adminReply = async (data, adminId) => {
  const body = cleanText(data?.message ?? data?.body);
  const attached = normalizeAttachment(data?.attachment, data?.attachmentName);
  if (attached.error) return { status: 400, message: attached.error };
  if (!body && !attached.attachment) {
    return { status: 400, message: "Add a message or an attachment." };
  }
  if (body.length > LIMITS.bodyMax) {
    return {
      status: 400,
      message: `Message must be ${LIMITS.bodyMax} characters or fewer.`,
    };
  }

  const ticket = await withDbRetry(() =>
    prisma.supportTicket.findUnique({ where: { id: Number(data?.ticketId ?? data?.id) } }),
  );
  if (!ticket) return { status: 404, message: "Conversation not found" };

  const now = new Date();
  const operations = [];
  if (ticket.adminUnread) {
    operations.push(
      prisma.supportTicket.updateMany({
        where: {
          id: ticket.id,
          adminUnread: true,
          lastMessageAt: ticket.lastMessageAt,
        },
        data: { adminUnread: false },
      }),
    );
  }
  const messageOperationIndex = operations.length;
  operations.push(
    prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: adminId,
        senderRole: "admin",
        body,
        attachment: attached.attachment,
        attachmentName: attached.attachmentName,
        ...(hasConnectedUser(ticket.userId) ? { deliveredAt: now } : {}),
      },
    }),
    prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        lastMessageAt: now,
        userUnread: true,
        status: ticket.status === "open" ? "in_progress" : ticket.status,
      },
    }),
  );
  const transactionResult = await withDbRetry(() =>
    prisma.$transaction(operations),
  );
  const createdMessage = transactionResult[messageOperationIndex];

  const updated = await findTicketOrFail(ticket.id);
  try {
    emitSupportMessageToUserAndAdmins(updated, createdMessage);
  } catch (error) {
    console.warn("[support] Realtime emit failed for admin reply:", error.message);
  }
  const delivery = await notifySupportMessage(updated, createdMessage, "user");
  const pushDelivery = {
    sent: delivery?.sent ?? 0,
    status: delivery?.sent > 0 ? 'accepted'
      : delivery?.disabled || !delivery ? 'unavailable'
      : delivery?.noTokens ? 'no_devices' : 'failed',
  };
  return {
    status: 200,
    message: "Reply sent to the user",
    data: { ...serializeTicketDetail(updated), pushDelivery },
  };
};

export const updateTicketStatus = async (data, adminId) => {
  const status = data?.status;
  if (!SUPPORT_STATUSES.includes(status)) {
    return { status: 400, message: "Invalid status" };
  }

  const ticket = await withDbRetry(() =>
    prisma.supportTicket.findUnique({ where: { id: Number(data?.ticketId ?? data?.id) } }),
  );
  if (!ticket) return { status: 404, message: "Conversation not found" };

  const settled = SETTLED_STATUSES.includes(status);
  const updatedAt = new Date();
  await withDbRetry(() =>
    prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        status,
        resolvedAt: settled ? updatedAt : null,
        resolvedBy: settled ? adminId : null,
        lastMessageAt: updatedAt,
        // The user has something new to look at whenever the admin acts.
        userUnread: true,
        adminUnread: false,
      },
    }),
  );

  const updated = await findTicketOrFail(ticket.id);
  try {
    emitTicketUpdate(updated);
  } catch (error) {
    console.warn("[support] Realtime emit failed for status update:", error.message);
  }
  return {
    status: 200,
    message: `Ticket marked as ${status.replace("_", " ")}`,
    data: serializeTicketDetail(updated),
  };
};

export const getSupportStats = async () => {
  const [grouped, totalCount, unreadCount] = await Promise.all([
    withDbRetry(() =>
      prisma.supportTicket.groupBy({ by: ["status"], _count: { _all: true } }),
    ),
    withDbRetry(() => prisma.supportTicket.count()),
    withDbRetry(() =>
      prisma.supportTicket.count({ where: { adminUnread: true } }),
    ),
  ]);

  const counts = {};
  for (const status of SUPPORT_STATUSES) counts[status] = 0;
  for (const row of grouped) {
    counts[row.status] = row._count?._all ?? 0;
  }

  return {
    status: 200,
    message: "Support stats fetched successfully",
    data: { counts, totalCount, unreadCount },
  };
};

export const getUserUnreadSummary = async (userId) => {
  const uid = String(userId || "").trim();
  if (!uid) return { userUnreadCount: 0 };
  const count = await withDbRetry(() =>
    prisma.supportTicket.count({ where: { userId: uid, userUnread: true } }),
  );
  return { userUnreadCount: count };
};

export const getAdminUnreadSummary = async () => {
  const count = await withDbRetry(() =>
    prisma.supportTicket.count({ where: { adminUnread: true } }),
  );
  return { adminUnreadCount: count };
};

export const getUnreadSummary = async (reqUser) => {
  const summary = { userUnreadCount: 0, adminUnreadCount: 0 };
  if (!reqUser?.id) {
    return { status: 200, message: "Unread summary fetched", data: summary };
  }
  summary.userUnreadCount = (
    await getUserUnreadSummary(reqUser.id)
  ).userUnreadCount;
  if (Number(reqUser.userRole) === 1) {
    summary.adminUnreadCount = (
      await getAdminUnreadSummary()
    ).adminUnreadCount;
  }
  return { status: 200, message: "Unread summary fetched", data: summary };
};
