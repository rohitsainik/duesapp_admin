import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = "admin123"; // change
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      userId: "ADMIN001",
      name: "Admin",
      email: "admin@example.com",
      phone: "9999999999",
      role: "ADMIN",
      passwordHash,
    },
  });

}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });