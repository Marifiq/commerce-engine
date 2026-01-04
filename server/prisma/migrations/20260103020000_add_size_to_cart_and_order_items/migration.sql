-- AlterTable: Add size column to CartItem if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'CartItem' AND column_name = 'size'
    ) THEN
        ALTER TABLE "CartItem" ADD COLUMN "size" TEXT;
    END IF;
END $$;

-- AlterTable: Add size column to OrderItem if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'OrderItem' AND column_name = 'size'
    ) THEN
        ALTER TABLE "OrderItem" ADD COLUMN "size" TEXT;
    END IF;
END $$;






