import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Create/update the tester admin account for Claire.
 * Does not send or queue any email message.
 *
 * Usage (from backend/):
 *   node src/modules/admin/create-claire-admin.js
 * Or: npm run seed:tester-admin-claire
 */
async function main() {
  const email = "claire.admin@gmail.com";
  const username = "claire.admin";
  const plainPassword = "claire.admin";

  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const data = {
    username,
    email,
    password: hashedPassword,
    firstName: "Claire",
    lastName: "Admin",
    phoneNumber: "",
    gender: "Not specified",
    userRole: 1n,
    emailVerified: true,
    mustChangePassword: false,
    status: true,
    isLoggedIn: false,
    loginCount: 0n,
    subscriptionTier: "free",
    accountStatus: "active",
  };

  const existingByEmail = await prisma.systemUser.findUnique({ where: { email } });

  if (existingByEmail) {
    await prisma.systemUser.update({ where: { id: existingByEmail.id }, data });
    console.log(`Updated tester admin: ${email} (${username})`);
  } else {
    const existingByUsername = await prisma.systemUser.findUnique({ where: { username } });
    if (existingByUsername) {
      await prisma.systemUser.update({ where: { id: existingByUsername.id }, data });
      console.log(`Updated tester admin (matched username): ${email} (${username})`);
    } else {
      await prisma.systemUser.create({ data });
      console.log(`Created tester admin: ${email} (${username})`);
    }
  }

  console.log("Credentials: claire.admin@gmail.com / claire.admin");
  console.log("Role: ADMIN (verified, active, no forced password change)");
  console.log("No email message queued or sent.");
}

main()
  .catch((e) => {
    console.error("Failed to create tester admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
