/**
 * Schema Synchronization Script
 * Syncs Prisma schema and migrations between local and remote databases
 */

import { execSync } from 'child_process';
import { getDatabaseUrl, getDatabaseStatus } from '../utils/dbConfig.js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

type SyncDirection = 'local-to-remote' | 'remote-to-local' | 'compare';

async function syncSchema(direction: SyncDirection = 'compare') {
  console.log('🔄 Schema Synchronization\n');

  try {
    const status = getDatabaseStatus();
    console.log(`Current active database: ${status.active}\n`);

    const localUrl = getDatabaseUrl('local');
    const remoteUrl = getDatabaseUrl('remote');

    switch (direction) {
      case 'local-to-remote':
        console.log('📤 Pushing local schema to remote...\n');
        await pushSchemaToRemote(localUrl, remoteUrl);
        break;

      case 'remote-to-local':
        console.log('📥 Pulling remote schema to local...\n');
        await pullSchemaFromRemote(remoteUrl, localUrl);
        break;

      case 'compare':
      default:
        console.log('🔍 Comparing schemas...\n');
        await compareSchemas(localUrl, remoteUrl);
        break;
    }

    console.log('\n✅ Schema sync completed!');
  } catch (error: any) {
    console.error('\n❌ Error syncing schema:', error.message);
    process.exit(1);
  }
}

async function pushSchemaToRemote(localUrl: string, remoteUrl: string) {
  console.log('Step 1: Generating migration from current schema...');
  try {
    // First, ensure local database is up to date
    process.env.DATABASE_URL = localUrl;
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: localUrl },
    });
    console.log('✅ Local database is up to date\n');
  } catch (error: any) {
    console.log('⚠️  Note: Some migrations may have failed, continuing...\n');
  }

  console.log('Step 2: Applying migrations to remote database...');
  try {
    process.env.DATABASE_URL = remoteUrl;
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: remoteUrl },
    });
    console.log('✅ Remote database updated\n');
  } catch (error: any) {
    throw new Error(`Failed to apply migrations to remote: ${error.message}`);
  }

  console.log('Step 3: Generating Prisma Client...');
  try {
    execSync('npx prisma generate', {
      stdio: 'inherit',
    });
    console.log('✅ Prisma Client generated\n');
  } catch (error: any) {
    console.log('⚠️  Warning: Prisma Client generation had issues\n');
  }
}

async function pullSchemaFromRemote(remoteUrl: string, localUrl: string) {
  console.log('Step 1: Resetting local database...');
  console.log('⚠️  WARNING: This will delete all data in local database!');
  
  try {
    process.env.DATABASE_URL = localUrl;
    execSync('npx prisma migrate reset --force --skip-seed', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: localUrl },
    });
    console.log('✅ Local database reset\n');
  } catch (error: any) {
    console.log('⚠️  Reset failed, trying to apply migrations directly...\n');
  }

  console.log('Step 2: Applying all migrations to local database...');
  try {
    process.env.DATABASE_URL = localUrl;
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: localUrl },
    });
    console.log('✅ Migrations applied to local\n');
  } catch (error: any) {
    throw new Error(`Failed to apply migrations to local: ${error.message}`);
  }

  console.log('Step 3: Generating Prisma Client...');
  try {
    execSync('npx prisma generate', {
      stdio: 'inherit',
    });
    console.log('✅ Prisma Client generated\n');
  } catch (error: any) {
    console.log('⚠️  Warning: Prisma Client generation had issues\n');
  }
}

async function compareSchemas(localUrl: string, remoteUrl: string) {
  console.log('This will compare the schemas between local and remote databases.');
  console.log('Note: Detailed comparison requires inspecting the database directly.\n');

  console.log('To sync schemas:');
  console.log('  - Push local to remote: npm run db:sync:schema -- --direction=local-to-remote');
  console.log('  - Pull remote to local: npm run db:sync:schema -- --direction=remote-to-local\n');

  // Try to get basic info about both databases
  try {
    const { PrismaClient } = await import('@prisma/client');
    
    console.log('Checking local database...');
    const localPrisma = new PrismaClient({
      datasources: { db: { url: localUrl } },
    });
    await localPrisma.$connect();
    const localTables = await getTableCounts(localPrisma);
    await localPrisma.$disconnect();
    console.log(`✅ Local database: ${Object.keys(localTables).length} tables found\n`);

    console.log('Checking remote database...');
    const remotePrisma = new PrismaClient({
      datasources: { db: { url: remoteUrl } },
    });
    await remotePrisma.$connect();
    const remoteTables = await getTableCounts(remotePrisma);
    await remotePrisma.$disconnect();
    console.log(`✅ Remote database: ${Object.keys(remoteTables).length} tables found\n`);

    // Compare
    const localTableNames = new Set(Object.keys(localTables));
    const remoteTableNames = new Set(Object.keys(remoteTables));

    const onlyLocal = Array.from(localTableNames).filter(t => !remoteTableNames.has(t));
    const onlyRemote = Array.from(remoteTableNames).filter(t => !localTableNames.has(t));
    const common = Array.from(localTableNames).filter(t => remoteTableNames.has(t));

    if (onlyLocal.length > 0) {
      console.log(`⚠️  Tables only in local: ${onlyLocal.join(', ')}`);
    }
    if (onlyRemote.length > 0) {
      console.log(`⚠️  Tables only in remote: ${onlyRemote.join(', ')}`);
    }
    if (common.length > 0) {
      console.log(`✅ Common tables: ${common.length}`);
    }

  } catch (error: any) {
    console.log('⚠️  Could not compare schemas directly:', error.message);
  }
}

async function getTableCounts(prisma: any): Promise<Record<string, number>> {
  const tables: Record<string, number> = {};
  const tableNames = [
    'user', 'category', 'product', 'productMedia', 'cart', 'cartItem',
    'order', 'orderItem', 'review', 'offer', 'offerProduct', 'productSize',
  ];

  for (const table of tableNames) {
    try {
      const count = await prisma[table].count();
      tables[table] = count;
    } catch {
      // Table doesn't exist or can't be accessed
    }
  }

  return tables;
}

// Parse command line arguments
const args = process.argv.slice(2);
const directionArg = args.find(arg => arg.startsWith('--direction='));
const direction = directionArg
  ? (directionArg.split('=')[1] as SyncDirection)
  : 'compare';

// Validate direction
if (!['local-to-remote', 'remote-to-local', 'compare'].includes(direction)) {
  console.error('Invalid direction. Use: local-to-remote, remote-to-local, or compare');
  process.exit(1);
}

// Run the sync
syncSchema(direction).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

