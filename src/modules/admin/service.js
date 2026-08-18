import { serializeBigInt } from "../../utils/helpers.js";
import { prisma } from "../../config/db.js";
import { cache } from "../../services/cacheService.js";

const parseLocalDate = (value) => {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(value);
};

export const getUsersByAdmin = async (data, adminId) => {
  const { search, userId, page = 1, pageSize = 10 } = data;
  const pageNum = parseInt(page) || 1;
  const pageSizeNum = Math.min(parseInt(pageSize) || 10, 100);
  const offset = (pageNum - 1) * pageSizeNum;

  const whereClause = {};
  if (userId) {
    whereClause.id = userId;
  } else if (search) {
    whereClause.OR = [
      { username: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
    ];
  }

  const [users, totalCount] = await Promise.all([
    prisma.systemUser.findMany({
      where: whereClause,
      skip: offset,
      take: pageSizeNum,
      orderBy: { createdOn: "desc" },
    }),
    prisma.systemUser.count({ where: whereClause }),
  ]);

  const usersWithoutPassword = users.map((u) => {
    const { password, ...rest } = u;
    return serializeBigInt({ ...rest, password: null });
  });
  const totalPages = Math.ceil(totalCount / pageSizeNum);

  return {
    status: 200,
    message: "Users fetched successfully",
    data: {
      users: usersWithoutPassword,
      totalCount,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages,
    },
  };
};

export const updateUser = async (data, adminId) => {
  const {
    username,
    firstName,
    lastName,
    middleName,
    gender,
    maritalStatus,
    phoneNumber,
    email,
    roleName,
    roleId,
    status,
  } = data;

  if (!username) {
    return { status: 400, message: "Username is required" };
  }

  const user = await prisma.systemUser.findFirst({ where: { username } });
  if (!user) {
    return { status: 404, message: "User not found" };
  }

  const updateData = {};
  if (firstName) updateData.firstName = firstName.trim();
  if (lastName) updateData.lastName = lastName.trim();
  if (middleName !== undefined)
    updateData.middleName = middleName?.trim() || null;
  if (gender) updateData.gender = gender;
  if (maritalStatus !== undefined) updateData.maritalStatus = maritalStatus;
  if (phoneNumber) updateData.phoneNumber = phoneNumber.trim();
  if (email) {
    const newEmail = email.trim().toLowerCase();
    if (newEmail !== user.email) {
      const existingEmail = await prisma.systemUser.findFirst({
        where: { email: newEmail, id: { not: user.id } },
      });
      if (existingEmail) {
        return {
          status: 400,
          message: "Email is already in use by another account",
        };
      }
      updateData.email = newEmail;
    }
  }
  if (roleName) {
    const roleNameLower = roleName.trim().toLowerCase();
    updateData.userRole = roleId
      ? BigInt(roleId)
      : roleNameLower === "admin"
        ? 1n
        : 2n;
  } else if (roleId) {
    updateData.userRole = BigInt(roleId);
  }
  if (status !== undefined) updateData.status = status;

  updateData.updatedOn = new Date();
  updateData.updatedBy = adminId;

  const updatedUser = await prisma.systemUser.update({
    where: { id: user.id },
    data: updateData,
  });

  updatedUser.password = null;
  return {
    status: 200,
    message: "User updated successfully",
    data: serializeBigInt(updatedUser),
  };
};

export const deleteUser = async (data, adminId) => {
  const { username } = data;
  if (!username) {
    return { status: 400, message: "Username is required" };
  }

  const user = await prisma.systemUser.findFirst({ where: { username } });
  if (!user) {
    return { status: 404, message: "User not found" };
  }

  if (user.id === adminId) {
    return { status: 403, message: "You cannot delete your own account" };
  }

  await prisma.activity.deleteMany({ where: { userId: user.id } });
  await prisma.highlight.deleteMany({ where: { createdBy: user.id } });
  await prisma.favorite.deleteMany({ where: { createdBy: user.id } });
  await prisma.note.deleteMany({ where: { createdBy: user.id } });
  await prisma.readHistory.deleteMany({ where: { createdBy: user.id } });
  await prisma.userQuizAnswer.deleteMany({ where: { userId: user.id } });
  await prisma.userPlanProgress.deleteMany({ where: { userId: user.id } });
  await prisma.verification.deleteMany({ where: { createdBy: user.id } });
  await prisma.message.deleteMany({ where: { createdBy: user.id } });
  await prisma.dailyVerse.deleteMany({ where: { createdBy: user.id } });

  await prisma.systemUser.delete({ where: { id: user.id } });

  return {
    status: 200,
    message: "User and all associated activity deleted successfully",
  };
};

export const toggleUserStatus = async (data, adminId) => {
  const { username, status } = data;
  if (!username) {
    return { status: 400, message: "Username is required" };
  }

  const user = await prisma.systemUser.findFirst({ where: { username } });
  if (!user) {
    return { status: 404, message: "User not found" };
  }

  if (user.id === adminId) {
    return {
      status: 403,
      message: "You cannot change your own account status",
    };
  }

  const newStatus = status !== undefined ? status : !user.status;
  await prisma.systemUser.update({
    where: { id: user.id },
    data: { status: newStatus, updatedOn: new Date(), updatedBy: adminId },
  });

  const msg = newStatus
    ? "User activated successfully"
    : "User deactivated successfully";
  return { status: 200, message: msg };
};

export const toggleUserVerification = async (data, adminId) => {
  const { username, isVerified } = data;
  if (!username) {
    return { status: 400, message: "Username is required" };
  }

  const user = await prisma.systemUser.findFirst({ where: { username } });
  if (!user) {
    return { status: 404, message: "User not found" };
  }

  const newVerified =
    isVerified !== undefined ? isVerified : !user.emailVerified;
  await prisma.systemUser.update({
    where: { id: user.id },
    data: {
      emailVerified: newVerified,
      updatedOn: new Date(),
      updatedBy: adminId,
    },
  });

  const msg = newVerified
    ? "User email verified successfully"
    : "User email verification revoked";
  return { status: 200, message: msg };
};

export const getAdminDashboardStats = async () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const [
    totalUsers,
    activeUsers,
    inactiveUsers,
    verifiedUsers,
    unverifiedUsers,
    adminCount,
    memberCount,
    totalPlans,
    activePlans,
    totalEnrollments,
    completedEnrollments,
    newUsersThisMonth,
    newUsersToday,
  ] = await Promise.all([
    prisma.systemUser.count(),
    prisma.systemUser.count({ where: { status: true } }),
    prisma.systemUser.count({ where: { status: false } }),
    prisma.systemUser.count({ where: { emailVerified: true } }),
    prisma.systemUser.count({ where: { emailVerified: false } }),
    prisma.systemUser.count({ where: { userRole: 1n } }),
    prisma.systemUser.count({ where: { userRole: 2n } }),
    prisma.readingPlan.count(),
    prisma.readingPlan.count({ where: { isActive: true } }),
    prisma.userPlanProgress.count(),
    prisma.userPlanProgress.count({ where: { isCompleted: true } }),
    prisma.systemUser.count({ where: { createdOn: { gte: startOfMonth } } }),
    prisma.systemUser.count({
      where: { createdOn: { gte: startOfToday, lt: startOfTomorrow } },
    }),
  ]);

  return {
    status: 200,
    message: "Dashboard stats retrieved successfully",
    data: serializeBigInt({
      totalUsers,
      activeUsers,
      inactiveUsers,
      verifiedUsers,
      unverifiedUsers,
      adminCount,
      memberCount,
      newUsersThisMonth,
      newUsersToday,
      totalPlans,
      activePlans,
      totalEnrollments,
      completedEnrollments,
      activeRate:
        totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 1000) / 10 : 0,
      verificationRate:
        totalUsers > 0
          ? Math.round((verifiedUsers / totalUsers) * 1000) / 10
          : 0,
      completionRate:
        totalEnrollments > 0
          ? Math.round((completedEnrollments / totalEnrollments) * 1000) / 10
          : 0,
    }),
  };
};

export const getUserActivity = async (data) => {
  const { username, page = 1, pageSize = 10 } = data;
  if (!username) {
    return { status: 400, message: "Username is required" };
  }

  const user = await prisma.systemUser.findFirst({ where: { username } });
  if (!user) {
    return { status: 404, message: "User not found" };
  }

  const pageNum = parseInt(page) || 1;
  const pageSizeNum = Math.min(parseInt(pageSize) || 10, 50);
  const offset = (pageNum - 1) * pageSizeNum;

  const [activities, totalCount] = await Promise.all([
    prisma.activity.findMany({
      where: { userId: user.id },
      orderBy: { loggedInAt: "desc" },
      skip: offset,
      take: pageSizeNum,
    }),
    prisma.activity.count({ where: { userId: user.id } }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSizeNum);

  return {
    status: 200,
    message: "Activity fetched successfully",
    data: {
      sessions: activities,
      totalCount,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages,
    },
  };
};

export const getAllActivity = async (data) => {
  const {
    page = 1,
    pageSize = 20,
    username,
    success,
    deviceType,
    onlineOnly,
    endedOnly,
  } = data;
  const pageNum = parseInt(page) || 1;
  const pageSizeNum = Math.min(parseInt(pageSize) || 20, 100);
  const offset = (pageNum - 1) * pageSizeNum;

  const whereClause = {};

  if (username) {
    whereClause.username = { contains: username, mode: "insensitive" };
  }

  if (success !== undefined) {
    whereClause.success = success;
  }

  if (deviceType && deviceType !== "all") {
    whereClause.deviceType = deviceType;
  }

  if (onlineOnly) {
    whereClause.loggedOutAt = null;
    whereClause.success = true;
  }

  if (endedOnly) {
    whereClause.loggedOutAt = { not: null };
  }

  const [activities, totalCount] = await Promise.all([
    prisma.activity.findMany({
      where: whereClause,
      orderBy: { loggedInAt: "desc" },
      skip: offset,
      take: pageSizeNum,
    }),
    prisma.activity.count({ where: whereClause }),
  ]);

  const sessions = serializeBigInt(activities);

  const summary = {
    successCount: await prisma.activity.count({ where: { success: true } }),
    failedCount: await prisma.activity.count({ where: { success: false } }),
    onlineCount: await prisma.activity.count({
      where: { loggedOutAt: null, success: true },
    }),
  };

  const totalPages = Math.ceil(totalCount / pageSizeNum);

  return {
    status: 200,
    message: "Activity fetched successfully",
    data: {
      sessions,
      totalCount,
      page: pageNum,
      pageSize: pageSizeNum,
      totalPages,
      summary,
    },
  };
};

export const deleteActivity = async (data) => {
  const { activityId } = data;
  if (!activityId) {
    return { status: 400, message: "Activity ID is required" };
  }

  await prisma.activity.delete({ where: { id: BigInt(activityId) } });
  return { status: 200, message: "Activity deleted successfully" };
};

export const addDailyVerse = async (data, adminId) => {
  const {
    id,
    bookName,
    chapter,
    verseNumber,
    bibleVersion,
    displayDate,
    displayTime,
    reflection,
    explanation,
    learnMore,
    application,
    verseIntroduction,
    backgroundAuthor,
    backgroundBook,
    backgroundContext,
    wordStudies,
    practicalApplications,
    keyThemes,
    crossReferences,
    finalThoughts,
    takeaways,
    published,
  } = data;

  if (!bookName || !chapter || !verseNumber || !displayDate) {
    return {
      status: 400,
      message: "bookName, chapter, verseNumber, and displayDate are required",
    };
  }

  let dailyVerse;
  if (id) {
    dailyVerse = await prisma.dailyVerse.update({
      where: { id: BigInt(id) },
      data: {
        bookName,
        chapter: BigInt(chapter),
        verseNumber: BigInt(verseNumber),
        bibleVersion: bibleVersion || "KJV",
        displayDate: new Date(displayDate),
        displayTime: displayTime ? new Date(displayTime) : null,
        reflection,
        explanation,
        learnMore,
        application,
        verseIntroduction,
        backgroundAuthor,
        backgroundBook,
        backgroundContext,
        wordStudies,
        practicalApplications,
        keyThemes,
        crossReferences,
        finalThoughts,
        takeaways,
        isPublished: published ?? true,
        updatedBy: adminId,
      },
    });
  } else {
    dailyVerse = await prisma.dailyVerse.create({
      data: {
        bookName,
        chapter: BigInt(chapter),
        verseNumber: BigInt(verseNumber),
        bibleVersion: bibleVersion || "KJV",
        displayDate: new Date(displayDate),
        displayTime: displayTime ? new Date(displayTime) : null,
        reflection,
        explanation,
        learnMore,
        application,
        verseIntroduction,
        backgroundAuthor,
        backgroundBook,
        backgroundContext,
        wordStudies,
        practicalApplications,
        keyThemes,
        crossReferences,
        finalThoughts,
        takeaways,
        createdBy: adminId,
        isPublished: published ?? true,
      },
    });
  }

  const msg = id
    ? "Daily verse updated successfully"
    : "Daily verse added successfully";

  // Admin changes must be visible immediately rather than waiting for the
  // 30-minute daily-verse cache to expire.
  await Promise.all([
    cache.del("bible", "todays-verse:v2"),
    cache.del("bible", "todays-verse:v2:en"),
    cache.del("bible", "todays-verse:v2:ar"),
    cache.del("bible", "todays-verse:v2:es"),
    cache.del("bible", "todays-verse:v2:fr"),
  ]);

  return { status: 200, message: msg, data: serializeBigInt(dailyVerse) };
};

export const getAllDailyVerses = async (data) => {
  const {
    page = 0,
    size = 12,
    startDate,
    endDate,
    smartDefault,
    futureDays = 2,
    bookName,
    chapter,
    verseNumber,
    search,
  } = data || {};
  const pageNum = parseInt(page) || 0;
  const pageSize = Math.min(parseInt(size) || 12, 50);
  const offset = pageNum * pageSize;

  const whereClause = {};

  if (startDate || endDate) {
    whereClause.displayDate = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      whereClause.displayDate.gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      whereClause.displayDate.lte = end;
    }
  }

  if (bookName) {
    whereClause.bookName = { contains: bookName, mode: "insensitive" };
  }

  if (chapter) {
    whereClause.chapter = BigInt(chapter);
  }

  if (verseNumber) {
    whereClause.verseNumber = BigInt(verseNumber);
  }

  if (search && String(search).trim()) {
    const q = String(search).trim();
    whereClause.OR = [
      { bookName: { contains: q, mode: "insensitive" } },
      { explanation: { contains: q, mode: "insensitive" } },
      { application: { contains: q, mode: "insensitive" } },
      { verseIntroduction: { contains: q, mode: "insensitive" } },
      { finalThoughts: { contains: q, mode: "insensitive" } },
    ];
  }

  if (smartDefault) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + parseInt(futureDays));

    whereClause.displayDate = { gte: today, lte: futureDate };
  }

  const [dailyVerses, totalElements] = await Promise.all([
    prisma.dailyVerse.findMany({
      where: whereClause,
      orderBy: [{ updatedOn: "desc" }, { createdOn: "desc" }],
      skip: offset,
      take: pageSize,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
    }),
    prisma.dailyVerse.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(totalElements / pageSize);
  const rawContent = dailyVerses.map((dv) => {
    const { user, ...rest } = dv;
    return {
      ...rest,
      creatorName: user
        ? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
          user.username
        : "System",
    };
  });
  const content = serializeBigInt(rawContent);

  return {
    status: 200,
    message: "Daily verses fetched successfully",
    data: {
      content,
      currentPage: pageNum,
      pageSize,
      totalElements,
      totalPages,
      hasNext: pageNum < totalPages - 1,
      hasPrevious: pageNum > 0,
      isFirst: pageNum === 0,
      isLast: pageNum >= totalPages - 1,
    },
  };
};

export const deleteDailyVerse = async (data) => {
  const { verseId, id } = data;
  const targetId = verseId || id;
  if (!targetId) {
    return { status: 400, message: "Verse ID is required" };
  }

  await prisma.dailyVerse.delete({ where: { id: BigInt(targetId) } });
  return { status: 200, message: "Daily verse deleted successfully" };
};

// ── Daily Devotion CRUD ─────────────────────────────────────────────────────────

export const addDailyDevotion = async (data, adminId) => {
  const {
    id,
    title,
    content,
    bookName,
    chapter,
    verseNumber,
    bibleVersion,
    displayDate,
    displayTime,
    reflection,
    explanation,
    learnMore,
    application,
    verseIntroduction,
    backgroundAuthor,
    backgroundBook,
    backgroundContext,
    wordStudies,
    practicalApplications,
    keyThemes,
    crossReferences,
    finalThoughts,
    takeaways,
    published,
  } = data;

  if (!title || !content || !displayDate) {
    return {
      status: 400,
      message: "title, content, and displayDate are required",
    };
  }

  const richContent = {
    bibleVersion: bibleVersion || null,
    reflection: reflection || null,
    explanation: explanation || null,
    learnMore: learnMore || null,
    application: application || null,
    verseIntroduction: verseIntroduction || null,
    backgroundAuthor: backgroundAuthor || null,
    backgroundBook: backgroundBook || null,
    backgroundContext: backgroundContext || null,
    wordStudies: wordStudies || null,
    practicalApplications: practicalApplications || null,
    keyThemes: keyThemes || null,
    crossReferences: crossReferences || null,
    finalThoughts: finalThoughts || null,
    takeaways: takeaways || null,
  };

  let dailyDevotion;
  if (id) {
    dailyDevotion = await prisma.dailyDevotion.update({
      where: { id: BigInt(id) },
      data: {
        title,
        content,
        bookName: bookName || null,
        chapter: chapter ? BigInt(chapter) : null,
        verseNumber: verseNumber ? BigInt(verseNumber) : null,
        displayDate: new Date(displayDate),
        displayTime: displayTime ? new Date(displayTime) : null,
        isPublished: published ?? true,
        updatedBy: adminId,
        ...richContent,
      },
    });
  } else {
    dailyDevotion = await prisma.dailyDevotion.create({
      data: {
        title,
        content,
        bookName: bookName || null,
        chapter: chapter ? BigInt(chapter) : null,
        verseNumber: verseNumber ? BigInt(verseNumber) : null,
        displayDate: new Date(displayDate),
        displayTime: displayTime ? new Date(displayTime) : null,
        createdBy: adminId,
        isPublished: published ?? true,
        ...richContent,
      },
    });
  }

  const msg = id
    ? "Daily devotion updated successfully"
    : "Daily devotion added successfully";

  // Admin changes must be visible immediately rather than waiting for the
  // daily-devotion cache to expire.
  await Promise.all([
    cache.del("bible", "todays-devotion"),
    cache.del("bible", "todays-devotion:en"),
    cache.del("bible", "todays-devotion:ar"),
    cache.del("bible", "todays-devotion:es"),
    cache.del("bible", "todays-devotion:fr"),
  ]);

  return { status: 200, message: msg, data: serializeBigInt(dailyDevotion) };
};

export const getAllDailyDevotions = async (data) => {
  const {
    page = 0,
    size = 12,
    startDate,
    endDate,
    smartDefault,
    futureDays = 2,
  } = data || {};
  const pageNum = parseInt(page) || 0;
  const pageSize = Math.min(parseInt(size) || 12, 50);

  const whereClause = {};

  if (smartDefault) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + (futureDays || 2));

    whereClause.OR = [
      { displayDate: { gte: today, lte: futureDate }, isPublished: true },
      { displayDate: { lt: today }, isPublished: true },
    ];
  } else {
    if (startDate) {
      whereClause.displayDate = {
        ...whereClause.displayDate,
        gte: new Date(startDate),
      };
    }
    if (endDate) {
      whereClause.displayDate = {
        ...whereClause.displayDate,
        lte: new Date(endDate),
      };
    }
  }

  const totalElements = await prisma.dailyDevotion.count({
    where: whereClause,
  });
  const totalPages = Math.ceil(totalElements / pageSize);

  const rawContent = await prisma.dailyDevotion.findMany({
    where: whereClause,
    orderBy: { displayDate: "desc" },
    skip: pageNum * pageSize,
    take: pageSize,
  });

  const content = serializeBigInt(rawContent);

  return {
    status: 200,
    message: "Daily devotions fetched successfully",
    data: {
      content,
      currentPage: pageNum,
      pageSize,
      totalElements,
      totalPages,
      hasNext: pageNum < totalPages - 1,
      hasPrevious: pageNum > 0,
      isFirst: pageNum === 0,
      isLast: pageNum >= totalPages - 1,
    },
  };
};

// ── Site Settings ─────────────────────────────────────────────────────────────

export const getSiteSetting = async (data) => {
  const { key } = data;
  if (!key) {
    return { status: 400, message: "Setting key is required" };
  }
  const setting = await prisma.siteSetting.findUnique({ where: { key } });
  return {
    status: 200,
    message: "Setting retrieved successfully",
    data: setting ? serializeBigInt(setting) : null,
  };
};

export const setSiteSetting = async (data, adminId) => {
  const { key, value } = data;
  if (!key || value === undefined) {
    return { status: 400, message: "Key and value are required" };
  }
  const setting = await prisma.siteSetting.upsert({
    where: { key },
    update: { value: String(value), updatedBy: adminId },
    create: { key, value: String(value), updatedBy: adminId },
  });
  return {
    status: 200,
    message: "Setting saved successfully",
    data: serializeBigInt(setting),
  };
};

export const deleteDailyDevotion = async (data) => {
  const { devotionId, id } = data;
  const targetId = devotionId || id;
  if (!targetId) {
    return { status: 400, message: "Devotion ID is required" };
  }

  await prisma.dailyDevotion.delete({ where: { id: BigInt(targetId) } });
  return { status: 200, message: "Daily devotion deleted successfully" };
};

// ── Lordsbook Daily Exegesis CRUD ─────────────────────────────────────────────

export const addDailyExegesis = async (data, adminId) => {
  const {
    id,
    title,
    passageReference,
    introduction,
    contextSummary,
    teachingBody,
    application,
    prayer,
    tags,
    displayDate,
    displayTime,
    published,
  } = data;

  if (!title || !passageReference || !teachingBody || !displayDate) {
    return {
      status: 400,
      message:
        "title, passageReference, teachingBody, and displayDate are required",
    };
  }

  const payload = {
    title,
    passageReference,
    introduction: introduction || null,
    contextSummary: contextSummary || null,
    teachingBody,
    application: application || null,
    prayer: prayer || null,
    tags: tags || null,
    displayDate: parseLocalDate(displayDate),
    displayTime: displayTime ? new Date(displayTime) : null,
    isPublished: published ?? true,
  };

  const dailyExegesis = id
    ? await prisma.dailyExegesis.update({
        where: { id: BigInt(id) },
        data: { ...payload, updatedBy: adminId },
      })
    : await prisma.dailyExegesis.create({
        data: { ...payload, createdBy: adminId },
      });

  const msg = id
    ? "Daily exegesis updated successfully"
    : "Daily exegesis added successfully";
  return { status: 200, message: msg, data: serializeBigInt(dailyExegesis) };
};

export const getAllDailyExegesis = async (data) => {
  const {
    page = 0,
    size = 12,
    startDate,
    endDate,
    smartDefault,
    futureDays = 2,
  } = data || {};
  const pageNum = parseInt(page) || 0;
  const pageSize = Math.min(parseInt(size) || 12, 50);

  const whereClause = {};

  if (smartDefault) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + (futureDays || 2));

    whereClause.OR = [
      { displayDate: { gte: today, lte: futureDate }, isPublished: true },
      { displayDate: { lt: today }, isPublished: true },
    ];
  } else {
    if (startDate)
      whereClause.displayDate = {
        ...whereClause.displayDate,
        gte: new Date(startDate),
      };
    if (endDate)
      whereClause.displayDate = {
        ...whereClause.displayDate,
        lte: new Date(endDate),
      };
  }

  const totalElements = await prisma.dailyExegesis.count({
    where: whereClause,
  });
  const totalPages = Math.ceil(totalElements / pageSize);

  const rawContent = await prisma.dailyExegesis.findMany({
    where: whereClause,
    orderBy: { displayDate: "desc" },
    skip: pageNum * pageSize,
    take: pageSize,
  });

  return {
    status: 200,
    message: "Daily exegesis fetched successfully",
    data: {
      content: serializeBigInt(rawContent),
      currentPage: pageNum,
      pageSize,
      totalElements,
      totalPages,
      hasNext: pageNum < totalPages - 1,
      hasPrevious: pageNum > 0,
      isFirst: pageNum === 0,
      isLast: pageNum >= totalPages - 1,
    },
  };
};

export const deleteDailyExegesis = async (data) => {
  const { exegesisId, id } = data;
  const targetId = exegesisId || id;
  if (!targetId) {
    return { status: 400, message: "Daily exegesis ID is required" };
  }

  await prisma.dailyExegesis.delete({ where: { id: BigInt(targetId) } });
  return { status: 200, message: "Daily exegesis deleted successfully" };
};
