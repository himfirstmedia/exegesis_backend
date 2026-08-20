// src/config/db.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["error", "warn"]
      : ["error"],
  // Connection pool is configured via DATABASE_URL query params:
  // ?pool_timeout=30&connection_limit=15
  // Defaults if not set: pool_timeout=10, connection_limit=9 (too low)
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
