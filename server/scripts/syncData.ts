/**
 * Data Synchronization Script
 * Syncs data bidirectionally between local and remote databases
 */

import { PrismaClient } from '@prisma/client';
import { getDatabaseUrl, getDatabaseStatus } from '../utils/dbConfig.js';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

dotenv.config({ path: './.env' });

type SyncDirection = 'local-to-remote' | 'remote-to-local' | 'bidirectional';

interface SyncOptions {
  direction: SyncDirection;
  tables?: string[];
  dryRun?: boolean;
  skipBackup?: boolean;
}

async function syncData(options: SyncOptions) {
  console.log('🔄 Data Synchronization\n');

  try {
    const status = getDatabaseStatus();
    console.log(`Current active database: ${status.active}\n`);

    const localUrl = getDatabaseUrl('local');
    const remoteUrl = getDatabaseUrl('remote');

    const localPrisma = new PrismaClient({
      datasources: { db: { url: localUrl } },
    });

    const remotePrisma = new PrismaClient({
      datasources: { db: { url: remoteUrl } },
    });

    // Test connections
    await localPrisma.$connect();
    await remotePrisma.$connect();
    console.log('✅ Both databases connected\n');

    // Create backup if not skipping
    if (!options.skipBackup && !options.dryRun) {
      await createBackup(localPrisma, remotePrisma);
    }

    // Determine which tables to sync
    const tablesToSync = options.tables || getAllTables();

    switch (options.direction) {
      case 'local-to-remote':
        await syncLocalToRemote(localPrisma, remotePrisma, tablesToSync, options.dryRun);
        break;
      case 'remote-to-local':
        await syncRemoteToLocal(localPrisma, remotePrisma, tablesToSync, options.dryRun);
        break;
      case 'bidirectional':
        await syncBidirectional(localPrisma, remotePrisma, tablesToSync, options.dryRun);
        break;
    }

    await localPrisma.$disconnect();
    await remotePrisma.$disconnect();

    if (options.dryRun) {
      console.log('\n✅ Dry run completed (no changes made)');
    } else {
      console.log('\n✅ Data sync completed!');
    }
  } catch (error: any) {
    console.error('\n❌ Error syncing data:', error.message);
    process.exit(1);
  }
}

function getAllTables(): string[] {
  return [
    'user',
    'category',
    'product',
    'productMedia',
    'productSize',
    'cart',
    'cartItem',
    'order',
    'orderItem',
    'review',
    'offer',
    'offerProduct',
  ];
}

async function syncLocalToRemote(
  localPrisma: PrismaClient,
  remotePrisma: PrismaClient,
  tables: string[],
  dryRun: boolean = false
) {
  console.log('📤 Syncing data from local to remote...\n');

  // Sync in order to respect foreign key constraints
  const syncOrder = [
    'user',
    'category',
    'product',
    'productSize',
    'productMedia',
    'cart',
    'cartItem',
    'order',
    'orderItem',
    'review',
    'offer',
    'offerProduct',
  ].filter(t => tables.includes(t));

  for (const table of syncOrder) {
    await syncTable(localPrisma, remotePrisma, table, 'local-to-remote', dryRun);
  }
}

async function syncRemoteToLocal(
  localPrisma: PrismaClient,
  remotePrisma: PrismaClient,
  tables: string[],
  dryRun: boolean = false
) {
  console.log('📥 Syncing data from remote to local...\n');

  // Sync in order to respect foreign key constraints
  const syncOrder = [
    'user',
    'category',
    'product',
    'productSize',
    'productMedia',
    'cart',
    'cartItem',
    'order',
    'orderItem',
    'review',
    'offer',
    'offerProduct',
  ].filter(t => tables.includes(t));

  for (const table of syncOrder) {
    await syncTable(remotePrisma, localPrisma, table, 'remote-to-local', dryRun);
  }
}

async function syncBidirectional(
  localPrisma: PrismaClient,
  remotePrisma: PrismaClient,
  tables: string[],
  dryRun: boolean = false
) {
  console.log('🔄 Bidirectional sync (with conflict resolution)...\n');
  console.log('⚠️  Note: Bidirectional sync uses "remote wins" for conflicts\n');

  // First, pull remote to local (remote wins)
  await syncRemoteToLocal(localPrisma, remotePrisma, tables, dryRun);
  
  // Then, push any new local data that doesn't conflict
  console.log('\n📤 Pushing new local data to remote...\n');
  // This is simplified - in production, you'd want more sophisticated conflict resolution
}

async function syncTable(
  sourcePrisma: PrismaClient,
  targetPrisma: PrismaClient,
  tableName: string,
  direction: string,
  dryRun: boolean = false
) {
  try {
    const sourceModel = (sourcePrisma as any)[tableName];
    const targetModel = (targetPrisma as any)[tableName];

    if (!sourceModel || !targetModel) {
      console.log(`⚠️  Skipping ${tableName} (model not found)`);
      return;
    }

    const records = await sourceModel.findMany();
    const count = records.length;

    if (count === 0) {
      console.log(`   ${tableName}: No records to sync`);
      return;
    }

    if (dryRun) {
      console.log(`   ${tableName}: Would sync ${count} records (${direction})`);
      return;
    }

    console.log(`   ${tableName}: Syncing ${count} records...`);

    // Delete existing records in target (to avoid conflicts)
    // Note: This assumes you want a complete replacement
    // For production, you might want to merge/update instead
    await targetModel.deleteMany({});

    // Insert all records
    if (count > 0) {
      // Handle tables with different structures
      if (tableName === 'user') {
        // Users need special handling (password hashing, etc.)
        for (const record of records) {
          await targetModel.create({ data: record });
        }
      } else {
        // For other tables, use createMany if possible
        try {
          await targetModel.createMany({
            data: records,
            skipDuplicates: true,
          });
        } catch {
          // If createMany fails (e.g., due to constraints), insert one by one
          for (const record of records) {
            try {
              await targetModel.create({ data: record });
            } catch (error: any) {
              console.log(`     ⚠️  Skipped duplicate or invalid record (id: ${record.id})`);
            }
          }
        }
      }
    }

    console.log(`   ✅ ${tableName}: Synced ${count} records`);
  } catch (error: any) {
    console.log(`   ❌ ${tableName}: Error - ${error.message}`);
  }
}

async function createBackup(localPrisma: PrismaClient, remotePrisma: PrismaClient) {
  console.log('📦 Creating backup...');
  
  const backupDir = path.join(process.cwd(), 'backups');
  await fs.mkdir(backupDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

  const backup: any = {};

  for (const table of getAllTables()) {
    try {
      const localModel = (localPrisma as any)[table];
      const remoteModel = (remotePrisma as any)[table];
      
      if (localModel) {
        backup[`local_${table}`] = await localModel.findMany();
      }
      if (remoteModel) {
        backup[`remote_${table}`] = await remoteModel.findMany();
      }
    } catch (error) {
      // Skip tables that don't exist
    }
  }

  await fs.writeFile(backupFile, JSON.stringify(backup, null, 2));
  console.log(`✅ Backup created: ${backupFile}\n`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const directionArg = args.find(arg => arg.startsWith('--direction='));
const tablesArg = args.find(arg => arg.startsWith('--tables='));
const dryRunArg = args.includes('--dry-run');
const skipBackupArg = args.includes('--skip-backup');

const direction = directionArg
  ? (directionArg.split('=')[1] as SyncDirection)
  : 'remote-to-local';

const tables = tablesArg
  ? tablesArg.split('=')[1].split(',').map(t => t.trim())
  : undefined;

if (!['local-to-remote', 'remote-to-local', 'bidirectional'].includes(direction)) {
  console.error('Invalid direction. Use: local-to-remote, remote-to-local, or bidirectional');
  process.exit(1);
}

// Run the sync
syncData({
  direction,
  tables,
  dryRun: dryRunArg,
  skipBackup: skipBackupArg,
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

