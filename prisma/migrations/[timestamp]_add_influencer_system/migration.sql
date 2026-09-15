-- Add INFLUENCER to Role enum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'INFLUENCER';

-- Add referralCode to Membership table
ALTER TABLE "Membership" 
ADD COLUMN IF NOT EXISTS "referralCode" TEXT;

-- Create ReferralStatus enum
DO $$ BEGIN
    CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Create Influencer table
CREATE TABLE IF NOT EXISTS "Influencer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "referralCode" TEXT NOT NULL,
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "totalEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Influencer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Influencer_userId_key" 
ON "Influencer"("userId");

CREATE UNIQUE INDEX IF NOT EXISTS "Influencer_referralCode_key" 
ON "Influencer"("referralCode");

CREATE INDEX IF NOT EXISTS "Influencer_referralCode_idx" 
ON "Influencer"("referralCode");

-- Create InfluencerReferral table
CREATE TABLE IF NOT EXISTS "InfluencerReferral" (
    "id" TEXT NOT NULL,
    "influencerId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "originalAmount" DOUBLE PRECISION NOT NULL,
    "discountAmount" DOUBLE PRECISION NOT NULL,
    "clientPaid" DOUBLE PRECISION NOT NULL,
    "commissionAmount" DOUBLE PRECISION NOT NULL,
    "companyReceives" DOUBLE PRECISION NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InfluencerReferral_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "InfluencerReferral_membershipId_key" 
ON "InfluencerReferral"("membershipId");

CREATE INDEX IF NOT EXISTS "InfluencerReferral_influencerId_idx" 
ON "InfluencerReferral"("influencerId");

CREATE INDEX IF NOT EXISTS "InfluencerReferral_createdAt_idx"
ON "InfluencerReferral"("createdAt" DESC);

-- Create InfluencerPayment table
CREATE TABLE IF NOT EXISTS "InfluencerPayment" (
    "id" TEXT NOT NULL,
    "influencerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'BKASH',
    "note" TEXT,
    "paidBy" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InfluencerPayment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "InfluencerPayment_influencerId_idx" 
ON "InfluencerPayment"("influencerId");

-- Foreign keys
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Influencer_userId_fkey') THEN
        ALTER TABLE "Influencer" ADD CONSTRAINT "Influencer_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InfluencerReferral_influencerId_fkey') THEN
        ALTER TABLE "InfluencerReferral" ADD CONSTRAINT "InfluencerReferral_influencerId_fkey"
            FOREIGN KEY ("influencerId") REFERENCES "Influencer"("id");
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InfluencerReferral_clientId_fkey') THEN
        ALTER TABLE "InfluencerReferral" ADD CONSTRAINT "InfluencerReferral_clientId_fkey"
            FOREIGN KEY ("clientId") REFERENCES "User"("id");
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InfluencerReferral_membershipId_fkey') THEN
        ALTER TABLE "InfluencerReferral" ADD CONSTRAINT "InfluencerReferral_membershipId_fkey"
            FOREIGN KEY ("membershipId") REFERENCES "Membership"("id");
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'InfluencerPayment_influencerId_fkey') THEN
        ALTER TABLE "InfluencerPayment" ADD CONSTRAINT "InfluencerPayment_influencerId_fkey"
            FOREIGN KEY ("influencerId") REFERENCES "Influencer"("id");
    END IF;
END $$;