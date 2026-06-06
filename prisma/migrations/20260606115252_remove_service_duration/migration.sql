/*
  Warnings:

  - You are about to drop the column `duration` on the `Service` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Service" DROP COLUMN "duration",
ADD COLUMN     "details" TEXT,
ADD COLUMN     "originalPrice" DOUBLE PRECISION;
