// Create a test user with verified email for development/testing
// Run: node backend/prisma/create-test-user.js

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "test@exegesis.test";
  const username = "testuser";
  const password = "TestPass123!";

  // Check if user already exists
  const existing = await prisma.systemUser.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (existing) {
    console.log(`ℹ️  User already exists: ${existing.email}`);
    return existing;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.systemUser.create({
    data: {
      username,
      email,
      password: hashedPassword,
      firstName: "Test",
      lastName: "User",
      phoneNumber: "555-0000",
      gender: "Not specified",
      userRole: 2n,
      emailVerified: true,
      status: true,
      isLoggedIn: false,
      loginCount: 0n,
      subscriptionTier: "free",
    },
  });

  console.log(`✅ Test user created!`);
  console.log(`   Email:    ${email}`);
  console.log(`   Username: ${username}`);
  console.log(`   Password: ${password}`);
  console.log(`   User ID:  ${user.id}`);

  return user;
}

main()
  .catch((e) => {
    console.error("❌ Failed to create test user:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
