ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verificationToken" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "User_verificationToken_key" ON "User"("verificationToken");
