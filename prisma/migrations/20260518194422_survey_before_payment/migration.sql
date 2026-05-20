/*
  Warnings:

  - The `waterIntake` column on the `SurveyResponse` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropForeignKey
ALTER TABLE "SurveyResponse" DROP CONSTRAINT "SurveyResponse_bookingId_fkey";

-- AlterTable
ALTER TABLE "SurveyResponse" ALTER COLUMN "bookingId" DROP NOT NULL,
ALTER COLUMN "codeId" DROP NOT NULL,
DROP COLUMN "waterIntake",
ADD COLUMN     "waterIntake" TEXT[];

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
