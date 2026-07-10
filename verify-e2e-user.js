import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.systemUser.findFirst({
    where: { username: "e2etestuser" },
  });
  if (!user) {
    console.error("User not found");
    process.exit(1);
  }
  await prisma.systemUser.update({
    where: { id: user.id },
    data: { emailVerified: true, subscriptionTier: "legacy_sower" },
  });
  console.log(`✅ Verified user: ${user.username} (${user.email})`);
  console.log(`   ID: ${user.id}`);
  console.log(`   Tier: legacy_sower`);
}

main()
  .catch((e) => {
    console.error("Error:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
