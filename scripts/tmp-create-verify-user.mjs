/**
 * Temporary dev-only helper: creates (or resets) a verified throwaway user
 * for browser verification of the Bible reader, prints the frontend user_data
 * payload to write into localStorage. Deleted right after use.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const EMAIL = "browser-verify@test.local";

const user = await prisma.systemUser.upsert({
  where: { email: EMAIL },
  update: { emailVerified: true, password: await bcrypt.hash("Verify!1234", 10) },
  create: {
    firstName: "Browser",
    lastName: "Verify",
    gender: "other",
    email: EMAIL,
    phoneNumber: "+10000000000",
    username: "browser_verify",
    password: await bcrypt.hash("Verify!1234", 10),
    emailVerified: true,
    userRole: 2,
  },
});

console.log(JSON.stringify({ id: user.id, username: user.username }));
await prisma.$disconnect();
