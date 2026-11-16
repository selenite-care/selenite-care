ALTER TABLE "Order"
ADD COLUMN IF NOT EXISTS "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID';

-- Existing orders that were already verified or moved forward were paid
UPDATE "Order"
SET "paymentStatus" = 'PAID'
WHERE status IN ('VERIFIED', 'PROCESSING', 'SHIPPED', 'DELIVERED');

INSERT INTO "AppSetting" (id, key, value, description) VALUES
  (gen_random_uuid()::text, 'cod_enabled', 'true', 'Cash on delivery for product orders'),
  (gen_random_uuid()::text, 'cod_inside_dhaka_only', 'true', 'Restrict COD to Inside Dhaka')
ON CONFLICT (key) DO NOTHING;