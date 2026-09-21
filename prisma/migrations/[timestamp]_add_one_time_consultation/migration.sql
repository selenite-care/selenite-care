ALTER TABLE "Booking" 
ADD COLUMN IF NOT EXISTS "isOneTimeConsultation" BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS "OneTimeConsultation" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "packagePrice" DOUBLE PRECISION NOT NULL DEFAULT 99,
    "epsMerchantTxnId" TEXT,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "paidAt" TIMESTAMP(3),
    "includesFollowUp" BOOLEAN NOT NULL DEFAULT true,
    "followUpUsed" BOOLEAN NOT NULL DEFAULT false,
    "followUpBookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OneTimeConsultation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "OneTimeConsultation_bookingId_key" 
ON "OneTimeConsultation"("bookingId");

CREATE UNIQUE INDEX IF NOT EXISTS "OneTimeConsultation_epsMerchantTxnId_key" 
ON "OneTimeConsultation"("epsMerchantTxnId");

CREATE INDEX IF NOT EXISTS "OneTimeConsultation_createdAt_idx"
ON "OneTimeConsultation"("createdAt" DESC);
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint 
    WHERE conname = 'OneTimeConsultation_bookingId_fkey') THEN
        ALTER TABLE "OneTimeConsultation" 
        ADD CONSTRAINT "OneTimeConsultation_bookingId_fkey"
            FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") 
            ON DELETE CASCADE;
    END IF;
END $$;
INSERT INTO "AppSetting" (id, key, value, description) VALUES
  (gen_random_uuid()::text, 'one_time_consultation_price', '99', 
   'Price for one-time direct consultation package in BDT')
ON CONFLICT (key) DO NOTHING;