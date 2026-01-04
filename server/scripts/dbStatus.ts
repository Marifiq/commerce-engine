/**
 * Database Status Script
 * Shows current database configuration and connection status
 */

import { getDatabaseStatus, getDatabaseUrl } from '../utils/dbConfig.js';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function showDatabaseStatus() {
  console.log('📊 Database Status\n');

  try {
    const status = getDatabaseStatus();

    console.log('Configuration:');
    console.log(`  Active Database: ${status.active.toUpperCase()}`);
    console.log(`  USE_LOCAL_DB: ${status.useLocalDb}`);
    console.log('');

    // Test connections
    console.log('Connection Status:\n');

    // Test local
    let localStatus = '❌ Not configured';
    if (status.localUrl) {
      try {
        const localUrl = getDatabaseUrl('local');
        const localPrisma = new PrismaClient({
          datasources: { db: { url: localUrl } },
        });
        await localPrisma.$connect();
        
        // Try a simple query
        await localPrisma.$queryRaw`SELECT 1`;
        await localPrisma.$disconnect();
        localStatus = '✅ Connected';
      } catch (error: any) {
        localStatus = `❌ Connection failed: ${error.message}`;
      }
    }
    console.log(`  Local Database: ${localStatus}`);
    if (status.localUrl) {
      console.log(`    URL: ${status.localUrl}`);
    }

    // Test remote
    let remoteStatus = '❌ Not configured';
    if (status.remoteUrl) {
      try {
        const remoteUrl = getDatabaseUrl('remote');
        const remotePrisma = new PrismaClient({
          datasources: { db: { url: remoteUrl } },
        });
        await remotePrisma.$connect();
        
        // Try a simple query
        await remotePrisma.$queryRaw`SELECT 1`;
        await remotePrisma.$disconnect();
        remoteStatus = '✅ Connected';
      } catch (error: any) {
        remoteStatus = `❌ Connection failed: ${error.message}`;
      }
    }
    console.log(`  Remote Database: ${remoteStatus}`);
    if (status.remoteUrl) {
      console.log(`    URL: ${status.remoteUrl}`);
    }

    console.log('\n💡 Tips:');
    console.log('  - Switch databases: npm run db:switch');
    console.log('  - Sync schema: npm run db:sync:schema');
    console.log('  - Sync data: npm run db:sync:data');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
showDatabaseStatus().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

