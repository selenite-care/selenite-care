ALTER TYPE "MembershipTier" ADD VALUE IF NOT EXISTS 'CLASSIC';

INSERT INTO "AppSetting" ("id", "key", "value", "description")
VALUES (
  gen_random_uuid()::text,
  'membership_classic_price',
  '490',
  'Classic membership price in BDT'
)
ON CONFLICT ("key") DO NOTHING;
