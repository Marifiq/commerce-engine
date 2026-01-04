# Manual Database Migration Instructions

## Migration: Add Banner Config Field

**Migration Name:** `20260104193351_add_banner_config`

**Changes:**
1. Makes the `image` column nullable in the `Banner` table (allows banners without images)
2. Adds a `config` JSONB column to the `Banner` table for storing banner customization settings

## Option 1: Using psql Command Line

If you have direct access to your PostgreSQL database:

```bash
# For local database
psql -U your_username -d your_database_name -f prisma/migrations/20260104193351_add_banner_config/manual_apply.sql

# Or for remote database
psql -h your_host -U your_username -d your_database_name -f prisma/migrations/20260104193351_add_banner_config/manual_apply.sql
```

## Option 2: Using psql Interactive Mode

1. Connect to your database:
```bash
psql -U your_username -d your_database_name
```

2. Run the SQL commands:
```sql
-- Make image column nullable
ALTER TABLE "Banner" ALTER COLUMN "image" DROP NOT NULL;

-- Add config JSONB column
ALTER TABLE "Banner" ADD COLUMN IF NOT EXISTS "config" JSONB;
```

3. Verify the changes:
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Banner' AND column_name IN ('image', 'config');
```

## Option 3: Using a Database GUI Tool

If you're using a database management tool (pgAdmin, DBeaver, TablePlus, etc.):

1. Open your database connection
2. Navigate to the `Banner` table
3. Run the SQL commands from `prisma/migrations/20260104193351_add_banner_config/manual_apply.sql`
4. Or manually:
   - Right-click on the `Banner` table → Modify Table
   - Change `image` column to allow NULL
   - Add a new column named `config` with type `JSONB` (or `JSON`)

## Option 4: Using Node.js/Prisma Script

You can also create a script to run the migration:

```javascript
// scripts/applyBannerConfigMigration.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Applying migration: Add banner config field...');
  
  // Make image nullable
  await prisma.$executeRaw`ALTER TABLE "Banner" ALTER COLUMN "image" DROP NOT NULL;`;
  console.log('✓ Made image column nullable');
  
  // Add config column
  await prisma.$executeRaw`ALTER TABLE "Banner" ADD COLUMN IF NOT EXISTS "config" JSONB;`;
  console.log('✓ Added config column');
  
  console.log('Migration completed successfully!');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Run it with:
```bash
node scripts/applyBannerConfigMigration.js
# or
tsx scripts/applyBannerConfigMigration.js
```

## Verification

After applying the migration, verify it worked:

```sql
-- Check the Banner table structure
\d "Banner"

-- Or using SQL
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'Banner'
ORDER BY ordinal_position;
```

You should see:
- `image` column with `is_nullable = YES`
- `config` column with `data_type = jsonb` and `is_nullable = YES`

## Notes

- This migration is safe to run on existing databases
- Existing banners will have `config = NULL` (which is fine)
- The `image` column can now be NULL for banners using gradients/solid colors
- Make sure to backup your database before running migrations in production

