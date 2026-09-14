// src/config/db.js
import { PrismaClient } from "@prisma/client";

/**
 * The managed Postgres proxy (Railway) drops connections under load, so the
 * pool must be tuned to recover quickly instead of starving requests
 * (symptom: P2024 "Timed out fetching a new connection from the connection
 * pool. Current connection pool timeout: 10, connection limit: 9").
 *
 * Prisma reads pool settings from DATABASE_URL query params only — they are
 * enforced here when missing so dev/prod behave identically:
 *   connection_limit=15  more headroom for API + scheduler concurrency
 *   pool_timeout=30      wait longer for a free connection before failing
 *   connect_timeout=15   tolerate slow proxy handshakes
 */
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
    process.exit(1);
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
