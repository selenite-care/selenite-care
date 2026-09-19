-- SkinAnalysis table (same as before)
CREATE TABLE IF NOT EXISTS "SkinAnalysis" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "imageUrl" TEXT NOT NULL,
    "imageHash" TEXT NOT NULL,
    "skinType" TEXT,
    "concerns" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "fullAnalysis" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paymentAmount" DOUBLE PRECISION,
    "epsMerchantTxnId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SkinAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SkinAnalysis_userId_idx" 
ON "SkinAnalysis"("userId");

CREATE INDEX IF NOT EXISTS "SkinAnalysis_imageHash_idx" 
ON "SkinAnalysis"("imageHash");

CREATE UNIQUE INDEX IF NOT EXISTS "SkinAnalysis_epsMerchantTxnId_key" 
ON "SkinAnalysis"("epsMerchantTxnId");

-- Updated SkinAnalysisCredit with membership tracking
CREATE TABLE IF NOT EXISTS "SkinAnalysisCredit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paidCredits" INTEGER NOT NULL DEFAULT 0,
    "freeCreditsUsed" INTEGER NOT NULL DEFAULT 0,
    "lastMembershipTier" TEXT,
    "lastMembershipId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SkinAnalysisCredit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SkinAnalysisCredit_userId_key" 
ON "SkinAnalysisCredit"("userId");

-- Foreign keys
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint 
    WHERE conname = 'SkinAnalysis_userId_fkey') THEN
        ALTER TABLE "SkinAnalysis" ADD CONSTRAINT "SkinAnalysis_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint 
    WHERE conname = 'SkinAnalysisCredit_userId_fkey') THEN
        ALTER TABLE "SkinAnalysisCredit" ADD CONSTRAINT "SkinAnalysisCredit_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
    END IF;
END $$;