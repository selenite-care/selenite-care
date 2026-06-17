DO $$ BEGIN
    CREATE TYPE "DoctorSpecialization" AS ENUM ('AESTHETICIAN', 'NUTRITIONIST', 'PSYCHIATRIST');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Doctor" ADD COLUMN IF NOT EXISTS "specialization" "DoctorSpecialization" NOT NULL DEFAULT 'AESTHETICIAN';