/*
  Warnings:

  - Added the optional column `skinImages` to the `SurveyResponse` table.

*/
-- AlterTable
ALTER TABLE "SurveyResponse" ADD COLUMN     "skinImages" TEXT[];
