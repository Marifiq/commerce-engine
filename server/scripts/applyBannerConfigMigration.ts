/**
 * Manual Migration Script: Add Banner Config Field
 * 
 * This script applies the migration to add the config JSONB field
 * and make the image column nullable in the Banner table.
 * 
 * Run with: tsx scripts/applyBannerConfigMigration.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Applying Migration: Add Banner Config Field');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Step 1: Make image column nullable
    console.log('Step 1: Making image column nullable...');
    await prisma.$executeRaw`ALTER TABLE "Banner" ALTER COLUMN "image" DROP NOT NULL;`;
    console.log('✓ Image column is now nullable\n');

    // Step 2: Add config JSONB column
    console.log('Step 2: Adding config JSONB column...');
    await prisma.$executeRaw`ALTER TABLE "Banner" ADD COLUMN IF NOT EXISTS "config" JSONB;`;
    console.log('✓ Config column added\n');

    // Verify the changes
    console.log('Verifying migration...');
    const columns = await prisma.$queryRaw<Array<{
      column_name: string;
      data_type: string;
      is_nullable: string;
    }>>`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Banner' AND column_name IN ('image', 'config')
      ORDER BY column_name;
    `;

    console.log('\nBanner table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✓ Migration completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (error: any) {
    console.error('\n✗ Migration failed:');
    console.error(error.message);
    
    // Check if error is because column doesn't exist or is already modified
    if (error.message.includes('does not exist')) {
      console.error('\nNote: The Banner table might not exist yet.');
      console.error('Make sure you have run previous migrations first.');
    } else if (error.message.includes('already exists') || error.message.includes('duplicate')) {
      console.error('\nNote: The config column might already exist.');
      console.error('This is safe to ignore if you have already applied this migration.');
    }
    
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('Unexpected error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });




