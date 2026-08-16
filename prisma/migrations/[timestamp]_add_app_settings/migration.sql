CREATE TABLE IF NOT EXISTS "AppSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AppSetting_key_key" 
ON "AppSetting"("key");

-- Insert default settings
INSERT INTO "AppSetting" (id, key, value, description) VALUES
  (gen_random_uuid()::text, 'product_discount_percent', '10', 'Global product discount percentage shown to all clients. Set to 0 to disable.'),
  (gen_random_uuid()::text, 'product_discount_enabled', 'true', 'Whether the global product discount is active'),
  (gen_random_uuid()::text, 'product_discount_label', '10% OFF - Limited Time Offer', 'Label shown on discount banner'),
  (gen_random_uuid()::text, 'membership_signature_price', '990', 'Signature membership offered price in BDT'),
  (gen_random_uuid()::text, 'membership_signature_original', '2190', 'Signature membership original price in BDT'),
  (gen_random_uuid()::text, 'membership_crystal_price', '4500', 'Crystal membership price in BDT'),
  (gen_random_uuid()::text, 'membership_platinum_price', '12500', 'Platinum membership price in BDT')
ON CONFLICT (key) DO NOTHING;