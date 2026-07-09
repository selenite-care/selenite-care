ALTER TABLE "MembershipPayment" ADD COLUMN IF NOT EXISTS "epsTransactionId" TEXT;
ALTER TABLE "MembershipPayment" ADD COLUMN IF NOT EXISTS "epsMerchantTxnId" TEXT;
ALTER TABLE "MembershipPayment" ADD COLUMN IF NOT EXISTS "epsPaymentMethod" TEXT;
ALTER TABLE "MembershipPayment" ADD COLUMN IF NOT EXISTS "epsStatus" TEXT;

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "epsTransactionId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "epsMerchantTxnId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "epsPaymentMethod" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "MembershipPayment_epsMerchantTxnId_key" 
ON "MembershipPayment"("epsMerchantTxnId");

CREATE UNIQUE INDEX IF NOT EXISTS "Order_epsMerchantTxnId_key" 
ON "Order"("epsMerchantTxnId");