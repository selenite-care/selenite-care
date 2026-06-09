-- CreateEnum
CREATE TYPE "MembershipTier" AS ENUM ('SIGNATURE', 'CRYSTAL', 'PLATINUM');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_serviceId_fkey";

-- AlterTable
ALTER TABLE "Booking" ALTER COLUMN "serviceId" DROP NOT NULL,
ALTER COLUMN "appointmentTime" DROP NOT NULL;

-- CreateTable
CREATE TABLE "SurveyProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "age" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "skinType" TEXT,
    "usesKoreanProducts" BOOLEAN NOT NULL DEFAULT false,
    "facingSkinIssues" BOOLEAN NOT NULL DEFAULT false,
    "skinIssues" TEXT[],
    "skinIssueDuration" TEXT,
    "currentProducts" TEXT[],
    "allergicIngredients" TEXT[],
    "doubleCleansePreference" TEXT,
    "sleepHours" TEXT,
    "waterIntake" TEXT,
    "appliesSunscreen" BOOLEAN NOT NULL DEFAULT false,
    "regularPeriodCycle" BOOLEAN NOT NULL DEFAULT false,
    "usedSteroidBasedNightCream" BOOLEAN NOT NULL DEFAULT false,
    "skinImages" TEXT[],
    "note" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" "MembershipTier" NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipPayment" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "stripePaymentId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MembershipPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SurveyProfile_userId_key" ON "SurveyProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_membershipId_key" ON "Membership"("membershipId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_key" ON "Membership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipPayment_membershipId_key" ON "MembershipPayment"("membershipId");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipPayment_stripePaymentId_key" ON "MembershipPayment"("stripePaymentId");

-- AddForeignKey
ALTER TABLE "SurveyProfile" ADD CONSTRAINT "SurveyProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipPayment" ADD CONSTRAINT "MembershipPayment_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;
