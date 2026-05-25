/*
  Warnings:

  - You are about to drop the column `wantsConsultation` on the `SurveyResponse` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SurveyResponse" DROP COLUMN "wantsConsultation",
ALTER COLUMN "waterIntake" SET NOT NULL,
ALTER COLUMN "waterIntake" SET DATA TYPE TEXT;
