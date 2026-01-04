-- Manual Migration Script: Add config field to Banner table
-- Migration: 20260104193351_add_banner_config
-- Description: Adds JSON config field for banner customization and makes image nullable

-- Step 1: Make image column nullable (banners can use gradients/solid colors)
ALTER TABLE "Banner" ALTER COLUMN "image" DROP NOT NULL;

-- Step 2: Add config JSONB column for banner customization
ALTER TABLE "Banner" ADD COLUMN IF NOT EXISTS "config" JSONB;

-- Verification queries (optional - run these to verify the migration)
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'Banner' AND column_name IN ('image', 'config');

