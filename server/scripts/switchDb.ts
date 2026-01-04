/**
 * Database Switching Utility
 * Interactive script to switch between local and remote databases
 */

import { getDatabaseStatus, getDatabaseUrl } from '../utils/dbConfig.js';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import fs from 'fs';
import readline from 'readline';

dotenv.config({ path: './.env' });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function switchDatabase() {
  console.log('🔄 Database Switching Utility\n');

  try {
    const status = getDatabaseStatus();
    
    console.log('Current Configuration:');
    console.log(`  Active Database: ${status.active.toUpperCase()}`);
    console.log(`  USE_LOCAL_DB: ${status.useLocalDb}`);
    if (status.localUrl) {
      console.log(`  Local URL: ${status.localUrl}`);
    }
    if (status.remoteUrl) {
      console.log(`  Remote URL: ${status.remoteUrl}`);
    }
    console.log('');

    // Test connections
    console.log('Testing database connections...\n');
    
    let localConnected = false;
    let remoteConnected = false;

    try {
      const localUrl = getDatabaseUrl('local');
      const localPrisma = new PrismaClient({
        datasources: { db: { url: localUrl } },
      });
      await localPrisma.$connect();
      await localPrisma.$disconnect();
      localConnected = true;
      console.log('✅ Local database: Connected');
    } catch (error: any) {
      console.log(`❌ Local database: Connection failed - ${error.message}`);
    }

    try {
      const remoteUrl = getDatabaseUrl('remote');
      const remotePrisma = new PrismaClient({
        datasources: { db: { url: remoteUrl } },
      });
      await remotePrisma.$connect();
      await remotePrisma.$disconnect();
      remoteConnected = true;
      console.log('✅ Remote database: Connected');
    } catch (error: any) {
      console.log(`❌ Remote database: Connection failed - ${error.message}`);
    }

    console.log('');

    // Interactive selection
    const target = await question(
      `Switch to which database? (local/remote) [current: ${status.active}]: `
    );

    const targetDb = target.trim().toLowerCase() || status.active;

    if (!['local', 'remote'].includes(targetDb)) {
      console.log('❌ Invalid selection. Use "local" or "remote"');
      rl.close();
      process.exit(1);
    }

    if (targetDb === status.active) {
      console.log(`✅ Already using ${targetDb} database. No change needed.`);
      rl.close();
      return;
    }

    // Check if target database is available
    if (targetDb === 'local' && !localConnected) {
      console.log('❌ Cannot switch to local database: Connection failed');
      rl.close();
      process.exit(1);
    }

    if (targetDb === 'remote' && !remoteConnected) {
      console.log('❌ Cannot switch to remote database: Connection failed');
      rl.close();
      process.exit(1);
    }

    // Update .env file
    const envPath = './.env';
    let envContent = '';

    try {
      envContent = fs.readFileSync(envPath, 'utf-8');
    } catch (error: any) {
      console.log('❌ Could not read .env file:', error.message);
      rl.close();
      process.exit(1);
    }

    // Update USE_LOCAL_DB
    const newValue = targetDb === 'local' ? 'true' : 'false';
    
    // Replace existing USE_LOCAL_DB or add it
    if (envContent.includes('USE_LOCAL_DB=')) {
      envContent = envContent.replace(
        /USE_LOCAL_DB=.*/,
        `USE_LOCAL_DB=${newValue}`
      );
    } else {
      // Add at the beginning
      envContent = `USE_LOCAL_DB=${newValue}\n${envContent}`;
    }

    // Write back to file
    try {
      fs.writeFileSync(envPath, envContent, 'utf-8');
      console.log(`✅ Updated .env file: USE_LOCAL_DB=${newValue}\n`);
    } catch (error: any) {
      console.log('❌ Could not write .env file:', error.message);
      rl.close();
      process.exit(1);
    }

    console.log(`🎉 Successfully switched to ${targetDb} database!`);
    console.log('\n📝 Note: You may need to restart your server for changes to take effect.');

    rl.close();
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    rl.close();
    process.exit(1);
  }
}

// Run the script
switchDatabase().catch((error) => {
  console.error('Fatal error:', error);
  rl.close();
  process.exit(1);
});

