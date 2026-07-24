// Upgrade test user subscription tier for full feature access
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.systemUser.update({
    where: { username: "testuser" },
    data: { subscriptionTier: "legacy_sower" },
  });
  console.log(`✅ Upgraded: ${user.email} → ${user.subscriptionTier}`);
}

main()
  .catch((e) => { console.error("❌", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
