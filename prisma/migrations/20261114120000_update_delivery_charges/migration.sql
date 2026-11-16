ALTER TABLE "Order"
ALTER COLUMN "deliveryCharge" SET DEFAULT 100;

INSERT INTO "AppSetting" (id, key, value, description) VALUES
  (gen_random_uuid()::text, 'delivery_charge_inside_dhaka', '100', 'Product delivery charge inside Dhaka'),
  (gen_random_uuid()::text, 'delivery_charge_outside_dhaka', '150', 'Product delivery charge outside Dhaka')
ON CONFLICT (key) DO NOTHING;
