/*
  Warnings:

  - You are about to drop the column `serviceId` on the `Doctor` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Doctor" DROP CONSTRAINT "Doctor_serviceId_fkey";

-- AlterTable
ALTER TABLE "Doctor" DROP COLUMN "serviceId";
