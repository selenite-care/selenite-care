CREATE TABLE IF NOT EXISTS "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Diagnosis" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "problemIdentification" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Diagnosis_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Diagnosis_bookingId_key" 
    ON "Diagnosis"("bookingId");

CREATE TABLE IF NOT EXISTS "ProductRecommendation" (
    "id" TEXT NOT NULL,
    "diagnosisId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductRecommendation_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Diagnosis_bookingId_fkey'
    ) THEN
        ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_bookingId_fkey"
            FOREIGN KEY ("bookingId") REFERENCES "Booking"("id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ProductRecommendation_diagnosisId_fkey'
    ) THEN
        ALTER TABLE "ProductRecommendation" 
            ADD CONSTRAINT "ProductRecommendation_diagnosisId_fkey"
            FOREIGN KEY ("diagnosisId") REFERENCES "Diagnosis"("id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ProductRecommendation_productId_fkey'
    ) THEN
        ALTER TABLE "ProductRecommendation" 
            ADD CONSTRAINT "ProductRecommendation_productId_fkey"
            FOREIGN KEY ("productId") REFERENCES "Product"("id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;