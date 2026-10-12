// Support module — user complaints / messages to admins.
//
// A ticket is a conversation thread: the first SupportMessage is the complaint
// the user submits, every later row is a reply from either side. Both the user
// app and the admin dashboard read from the same thread, so there is exactly
// one history per issue.
import { prisma } from "../../config/db.js";
import { serializeBigInt } from "../../utils/helpers.js";
import { withDbRetry } from "../../utils/dbRetry.js";

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
    orderBy: { createdOn: "desc" },
    take: 1,
    select: { body: true, senderRole: true, createdOn: true },
  },
  _count: { select: { messages: true } },
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
        messages: { orderBy: { createdOn: "asc" } },
        user: { select: userSelect },
      },
    }),
  );
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
  if (body.length < LIMITS.bodyMin) {
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
          create: { senderId: userId, senderRole: "user", body },
        },
      },
      include: {
        messages: { orderBy: { createdOn: "asc" } },
        user: { select: userSelect },
      },
    }),
  );

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

  if (ticket.userUnread) {
    await withDbRetry(() =>
      prisma.supportTicket.update({
        where: { id: ticket.id },
        data: { userUnread: false },
      }),
    );
    ticket.userUnread = false;
  }

  return {
    status: 200,
    message: "Conversation fetched successfully",
    data: serializeTicketDetail(ticket),
  };
};

export const replyToTicket = async (data, userId) => {
  const body = cleanText(data?.message ?? data?.body);
  if (body.length < 1) {
    return { status: 400, message: "Reply cannot be empty." };
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
  await withDbRetry(() =>
    prisma.$transaction([
      prisma.supportMessage.create({
        data: { ticketId: ticket.id, senderId: userId, senderRole: "user", body },
      }),
      prisma.supportTicket.update({
        where: { id: ticket.id },
        data: {
          lastMessageAt: now,
          adminUnread: true,
          userUnread: false,
          // A reply on a settled ticket puts it back in the admin queue.
          status: SETTLED_STATUSES.includes(ticket.status) ? "open" : ticket.status,
          resolvedAt: null,
        },
      }),
    ]),
  );

  const updated = await findTicketOrFail(ticket.id);
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

  if (ticket.adminUnread) {
    await withDbRetry(() =>
      prisma.supportTicket.update({
        where: { id: ticket.id },
        data: { adminUnread: false },
      }),
    );
    ticket.adminUnread = false;
  }

  return {
    status: 200,
    message: "Conversation fetched successfully",
    data: serializeTicketDetail(ticket),
  };
};

export const adminReply = async (data, adminId) => {
  const body = cleanText(data?.message ?? data?.body);
  if (body.length < 1) {
    return { status: 400, message: "Reply cannot be empty." };
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
  await withDbRetry(() =>
    prisma.$transaction([
      prisma.supportMessage.create({
        data: { ticketId: ticket.id, senderId: adminId, senderRole: "admin", body },
      }),
      prisma.supportTicket.update({
        where: { id: ticket.id },
        data: {
          lastMessageAt: now,
          adminUnread: false,
          userUnread: true,
          status: ticket.status === "open" ? "in_progress" : ticket.status,
        },
      }),
    ]),
  );

  const updated = await findTicketOrFail(ticket.id);
  return {
    status: 200,
    message: "Reply sent to the user",
    data: serializeTicketDetail(updated),
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
  await withDbRetry(() =>
    prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        status,
        resolvedAt: settled ? new Date() : null,
        resolvedBy: settled ? adminId : null,
        // The user has something new to look at whenever the admin acts.
        userUnread: true,
        adminUnread: false,
      },
    }),
  );

  const updated = await findTicketOrFail(ticket.id);
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
