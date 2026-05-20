import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();

const ADMIN_EMAIL = "careseleniteit@gmail.com";
const NEW_PASSWORD = "password123";

async function main() {
  console.log(`Updating password for ${ADMIN_EMAIL}...`);

  const user = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

  if (!user) {
    console.error("Admin user not found. Make sure the email is correct and the database is reachable.");
    process.exitCode = 2;
    return;
  }

  const hashed = await bcrypt.hash(NEW_PASSWORD, 10);

  await prisma.user.update({
    where: { email: ADMIN_EMAIL },
    data: { password: hashed },
  });

  console.log("Password updated successfully.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
