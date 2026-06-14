CREATE TABLE IF NOT EXISTS "RoutineGuideline" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "content" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RoutineGuideline_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RoutineGuideline_bookingId_key" 
    ON "RoutineGuideline"("bookingId");

CREATE TABLE IF NOT EXISTS "CustomerFeedback" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "feedback" TEXT,
    "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomerFeedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CustomerFeedback_bookingId_key" 
    ON "CustomerFeedback"("bookingId");

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'RoutineGuideline_bookingId_fkey'
    ) THEN
        ALTER TABLE "RoutineGuideline" ADD CONSTRAINT "RoutineGuideline_bookingId_fkey"
            FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'CustomerFeedback_bookingId_fkey'
    ) THEN
        ALTER TABLE "CustomerFeedback" ADD CONSTRAINT "CustomerFeedback_bookingId_fkey"
            FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;