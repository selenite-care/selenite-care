INSERT INTO "AppSetting" (id, key, value, description)
VALUES (
  gen_random_uuid()::text,
  'cod_inside_dhaka_only',
  'false',
  'Optionally restrict cash on delivery to Inside Dhaka'
)
ON CONFLICT (key) DO UPDATE
SET
  value = 'false',
  description = EXCLUDED.description;
