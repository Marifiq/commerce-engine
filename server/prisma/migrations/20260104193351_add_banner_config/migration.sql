-- AlterTable: Make image nullable (banners can use gradients/solid colors)
ALTER TABLE "Banner" ALTER COLUMN "image" DROP NOT NULL;

-- AlterTable: Add config JSON field for banner customization
ALTER TABLE "Banner" ADD COLUMN IF NOT EXISTS "config" JSONB;




