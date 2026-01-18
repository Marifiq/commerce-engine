-- AlterTable: Add profileImage column to User if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'profileImage'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "profileImage" TEXT;
    END IF;
END $$;




