CREATE INDEX IF NOT EXISTS "Booking_userId_idx" ON "Booking"("userId");
CREATE INDEX IF NOT EXISTS "Booking_doctorId_idx" ON "Booking"("doctorId");
CREATE INDEX IF NOT EXISTS "Booking_status_idx" ON "Booking"("status");

CREATE INDEX IF NOT EXISTS "Membership_userId_idx" ON "Membership"("userId");
CREATE INDEX IF NOT EXISTS "Membership_status_idx" ON "Membership"("status");

CREATE INDEX IF NOT EXISTS "SurveyProfile_userId_idx" ON "SurveyProfile"("userId");

CREATE INDEX IF NOT EXISTS "Diagnosis_bookingId_idx" ON "Diagnosis"("bookingId");

CREATE INDEX IF NOT EXISTS "Product_name_idx" ON "Product"("name");
CREATE INDEX IF NOT EXISTS "Product_type_idx" ON "Product"("type");