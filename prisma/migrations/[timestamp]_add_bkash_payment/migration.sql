DO $$ BEGIN
    CREATE TYPE "PaymentMethod" AS ENUM ('STRIPE', 'BKASH', 'BANK_TRANSFER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "MembershipPayment" ALTER COLUMN "stripePaymentId" DROP NOT NULL;
ALTER TABLE "MembershipPayment" ADD COLUMN IF NOT EXISTS "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'STRIPE';
ALTER TABLE "MembershipPayment" ADD COLUMN IF NOT EXISTS "bkashPaymentId" TEXT;
ALTER TABLE "MembershipPayment" ADD COLUMN IF NOT EXISTS "bkashTrxId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "MembershipPayment_bkashPaymentId_key" ON "MembershipPayment"("bkashPaymentId");