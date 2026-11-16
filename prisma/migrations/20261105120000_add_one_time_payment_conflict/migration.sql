ALTER TABLE "OneTimeConsultation"
ADD COLUMN "paymentConflict" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "paymentConflictNote" TEXT;
