// src/config/db.js
import { PrismaClient } from "@prisma/client";


const ensurePoolParams = (url) => {
  if (!url || !/^postgres(ql)?:\/\//i.test(url)) return url;
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has("connection_limit")) {
      parsed.searchParams.set("connection_limit", "15");
    }
    if (!parsed.searchParams.has("pool_timeout")) {
      parsed.searchParams.set("pool_timeout", "30");
    }
    if (!parsed.searchParams.has("connect_timeout")) {
      parsed.searchParams.set("connect_timeout", "15");
    }
    return parsed.toString();
  } catch {
    return url;
  }
};

const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["error", "warn"]
      : ["error"],
  datasourceUrl: ensurePoolParams(process.env.DATABASE_URL),
});

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("database connected successfully via prisma");
  } catch (error) {
    console.error("database connection failed:", error.message);
    // Don't exit on DB failure — let the app start so health checks
    // and static routes still work while the DB recovers.
  }
};

const disconnectDB = async () => {
  try {
    await prisma.$disconnect();
    console.log("database disconnected successfully via prisma");
  } catch (error) {
    console.error("database disconnection failed:", error.message);
    process.exit(1);
  }
};

export { connectDB, disconnectDB, prisma };
