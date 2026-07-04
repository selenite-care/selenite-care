ALTER TABLE "SurveyProfile" 
ADD COLUMN IF NOT EXISTS "currentProductsImage" TEXT;

ALTER TABLE "SurveyProfile" 
ADD COLUMN IF NOT EXISTS "previousConsultation" BOOLEAN;

ALTER TABLE "SurveyResponse"
ADD COLUMN IF NOT EXISTS "currentProductsImage" TEXT;

ALTER TABLE "SurveyResponse"
ADD COLUMN IF NOT EXISTS "previousConsultation" BOOLEAN;
