-- CreateTable
CREATE TABLE "SurveyResponse" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "skinType" TEXT NOT NULL,
    "codeId" TEXT NOT NULL,
    "usesKoreanProducts" BOOLEAN NOT NULL,
    "facingSkinIssues" BOOLEAN NOT NULL,
    "skinIssues" TEXT[],
    "skinIssueDuration" TEXT,
    "currentProducts" TEXT[],
    "allergicIngredients" TEXT[],
    "doubleCleansePreference" TEXT NOT NULL,
    "sleepHours" TEXT NOT NULL,
    "waterIntake" TEXT NOT NULL,
    "wantsConsultation" BOOLEAN NOT NULL,
    "appliesSunscreen" BOOLEAN NOT NULL,
    "regularPeriodCycle" BOOLEAN NOT NULL,
    "usedSteroidBasedNightCream" BOOLEAN NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SurveyResponse_bookingId_key" ON "SurveyResponse"("bookingId");

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
