ALTER TABLE "SkinAnalysis"
ALTER COLUMN "imageUrl" TYPE TEXT[]
USING ARRAY["imageUrl"];
