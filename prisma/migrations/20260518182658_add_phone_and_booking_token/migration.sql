/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `token` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "token" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phone" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Booking_token_key" ON "Booking"("token");
