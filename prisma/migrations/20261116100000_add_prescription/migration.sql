CREATE TABLE IF NOT EXISTS "Prescription" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "pdfPath" TEXT NOT NULL,
  "followUpDays" INTEGER,
  "followUpDate" TIMESTAMP(3),
  "createdById" TEXT,
  "createdByRole" TEXT,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Prescription_bookingId_version_key" ON "Prescription"("bookingId", "version");
CREATE INDEX IF NOT EXISTS "Prescription_bookingId_idx" ON "Prescription"("bookingId");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Prescription_bookingId_fkey') THEN
    ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_bookingId_fkey"
      FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE;
  END IF;
END $$;

ALTER TABLE "Prescription" ENABLE ROW LEVEL SECURITY;