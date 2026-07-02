CREATE INDEX IF NOT EXISTS "Booking_createdAt_idx" ON "Booking"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Booking_appointmentTime_idx" ON "Booking"("appointmentTime" DESC);
CREATE INDEX IF NOT EXISTS "Booking_status_idx" ON "Booking"("status");
CREATE INDEX IF NOT EXISTS "Booking_userId_idx" ON "Booking"("userId");
CREATE INDEX IF NOT EXISTS "Booking_doctorId_idx" ON "Booking"("doctorId");

CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "User"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "User_isActive_idx" ON "User"("isActive");

CREATE INDEX IF NOT EXISTS "Membership_createdAt_idx" ON "Membership"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Membership_expiresAt_idx" ON "Membership"("expiresAt");
CREATE INDEX IF NOT EXISTS "Membership_tier_idx" ON "Membership"("tier");

CREATE INDEX IF NOT EXISTS "Order_createdAt_idx" ON "Order"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "Order"("status");
CREATE INDEX IF NOT EXISTS "Order_userId_idx" ON "Order"("userId");

CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt" DESC);

CREATE INDEX IF NOT EXISTS "LeadCapture_createdAt_idx" ON "LeadCapture"("createdAt" DESC);

CREATE INDEX IF NOT EXISTS "MembershipPayment_createdAt_idx" ON "MembershipPayment"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "MembershipPayment_status_idx" ON "MembershipPayment"("status");
