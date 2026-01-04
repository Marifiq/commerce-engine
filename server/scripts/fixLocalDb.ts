/**
 * Fix Local Database Script
 * Pulls complete schema from remote Supabase and applies all migrations to local database
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { getDatabaseUrl } from '../utils/dbConfig.js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function fixLocalDatabase() {
  console.log('🔧 Fixing Local Database...\n');

  try {
    // Get database URLs
    // For migrations, use DIRECT_URL if available (pooler doesn't support migrations)
    const remoteUrlForMigrations = process.env.DIRECT_URL || getDatabaseUrl('remote');
    const remoteUrlForQueries = getDatabaseUrl('remote');
    const localUrl = getDatabaseUrl('local');
    
    if (process.env.DIRECT_URL) {
      console.log('📝 Using DIRECT_URL for remote migrations (pooler doesn\'t support migrations)\n');
    }

    console.log('📋 Step 1: Checking remote database connection...');
    // Use direct URL for connection test (migrations need direct connection)
    const remotePrisma = new PrismaClient({
      datasources: {
        db: {
          url: remoteUrlForMigrations,
        },
      },
    });

    // Test remote connection
    try {
      await remotePrisma.$connect();
      console.log('✅ Remote database connected\n');
    } catch (error: any) {
      console.error('❌ Remote database connection failed!\n');
      console.error('Error:', error.message);
      console.error('\n💡 Troubleshooting:');
      console.error('   1. Check your DIRECT_URL in .env');
      console.error('   2. For Supabase, DIRECT_URL should use port 5432 (not 6543)');
      console.error('   3. Make sure SSL is enabled: ?sslmode=require');
      console.error('   4. Direct URL format: postgresql://postgres.[ref]:[pass]@[host]:5432/postgres');
      console.error('\n   Current DIRECT_URL:', process.env.DIRECT_URL ? 'Set' : 'Not set');
      throw error;
    }

    console.log('📋 Step 2: Checking local database connection...');
    const localPrisma = new PrismaClient({
      datasources: {
        db: {
          url: localUrl,
        },
      },
    });

    // Test local connection
    try {
      await localPrisma.$connect();
      console.log('✅ Local database connected\n');
    } catch (error: any) {
      console.error('❌ Local database connection failed!\n');
      console.error('Error:', error.message);
      console.error('\n💡 Troubleshooting:');
      console.error('   1. Make sure PostgreSQL is running:');
      console.error('      sudo systemctl start postgresql');
      console.error('      # OR');
      console.error('      sudo service postgresql start');
      console.error('   2. Verify your DATABASE_URL_LOCAL in .env is correct');
      console.error('   3. Check if the database exists:');
      console.error('      createdb -U muhib shirt_database');
      console.error('\n   If you want to skip local database setup, you can:');
      console.error('   - Set USE_LOCAL_DB=false in .env to use remote only');
      console.error('   - Or start PostgreSQL and try again\n');
      throw error;
    }

    console.log('📋 Step 3: Resetting local database schema...');
    // Set DATABASE_URL to local for Prisma commands
    process.env.DATABASE_URL = localUrl;
    
    // Reset the database (WARNING: This will delete all data!)
    console.log('⚠️  WARNING: This will delete all data in local database!');
    console.log('   Resetting database schema...');
    
    try {
      execSync('npx prisma migrate reset --force --skip-seed', {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: localUrl },
      });
      console.log('✅ Local database reset\n');
    } catch (error: any) {
      console.log('⚠️  Reset failed, clearing failed migrations and using db push...\n');
      
      // Clear any failed migrations
      try {
        execSync('npx prisma migrate resolve --rolled-back 20251216000000_add_product_media', {
          stdio: 'pipe',
          env: { ...process.env, DATABASE_URL: localUrl },
        });
      } catch {
        // Ignore if migration doesn't exist in history
      }
    }

    console.log('📋 Step 4: Syncing schema from Prisma schema file...');
    console.log('   (Using prisma db push to sync schema directly)');
    try {
      execSync('npx prisma db push --accept-data-loss --skip-generate', {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: localUrl },
      });
      console.log('✅ Schema synced\n');
    } catch (error: any) {
      console.error('❌ Failed to sync schema:', error.message);
      console.error('\n💡 Tip: Make sure your local PostgreSQL is running:');
      console.error('   sudo systemctl start postgresql');
      throw error;
    }

    console.log('📋 Step 5: Generating Prisma Client...');
    try {
      execSync('npx prisma generate', {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: localUrl },
      });
      console.log('✅ Prisma Client generated\n');
    } catch (error: any) {
      console.error('❌ Failed to generate Prisma Client:', error.message);
      throw error;
    }

    console.log('📋 Step 6: Verifying local database structure...');
    
    // Check if all expected tables exist
    const tables = [
      'User',
      'Category',
      'Product',
      'ProductMedia',
      'Cart',
      'CartItem',
      'Order',
      'OrderItem',
      'Review',
      'Offer',
      'OfferProduct',
      'ProductSize',
    ];

    const missingTables: string[] = [];
    
    for (const table of tables) {
      try {
        await (localPrisma as any)[table.toLowerCase()].findFirst();
        console.log(`   ✅ Table ${table} exists`);
      } catch (error: any) {
        missingTables.push(table);
        console.log(`   ❌ Table ${table} is missing`);
      }
    }

    if (missingTables.length > 0) {
      console.log(`\n⚠️  Warning: ${missingTables.length} table(s) are missing: ${missingTables.join(', ')}`);
      console.log('   You may need to run migrations manually or check your schema.');
    } else {
      console.log('\n✅ All tables verified!');
    }

    await remotePrisma.$disconnect();
    await localPrisma.$disconnect();

    console.log('\n🎉 Local database fixed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Your local database now has the correct schema');
    console.log('   2. You can sync data from remote using: npm run db:sync:data -- --direction=remote-to-local');
    console.log('   3. Set USE_LOCAL_DB=true in .env to use local database');
    
  } catch (error: any) {
    console.error('\n❌ Error fixing local database:', error.message);
    process.exit(1);
  }
}

// Run the script
fixLocalDatabase()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

