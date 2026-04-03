import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = "superadmin123"; // change
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      userId: "SUPER001",
      name: "Super Admin",
      email: "superadmin@example.com",
      phone: "9999999999",
      role: "SUPER_ADMIN",
      passwordHash,
    },
  });

  console.log("✅ Super Admin created:", user);
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });