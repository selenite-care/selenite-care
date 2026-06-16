ALTER TABLE "MembershipPayment"
ADD COLUMN IF NOT EXISTS "bankTransactionRef" TEXT;

ALTER TABLE "MembershipPayment"
ADD COLUMN IF NOT EXISTS "bankTransferProof" TEXT;
