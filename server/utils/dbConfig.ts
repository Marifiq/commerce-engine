/**
 * Database Configuration Utility
 * Handles switching between local and remote databases
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './.env' });

export interface DatabaseConfig {
  url: string;
  type: 'local' | 'remote';
  isLocal: boolean;
}

/**
 * Get the active database configuration based on USE_LOCAL_DB flag
 */
export function getDatabaseConfig(): DatabaseConfig {
  const useLocalDb = process.env.USE_LOCAL_DB === 'true' || process.env.USE_LOCAL_DB === '1';
  
  if (useLocalDb) {
    const localUrl = process.env.DATABASE_URL_LOCAL || process.env.DATABASE_URL;
    if (!localUrl) {
      throw new Error(
        'USE_LOCAL_DB is true but DATABASE_URL_LOCAL is not set. ' +
        'Please set DATABASE_URL_LOCAL in your .env file.'
      );
    }
    return {
      url: localUrl,
      type: 'local',
      isLocal: true,
    };
  } else {
    const remoteUrl = process.env.DATABASE_URL_REMOTE || process.env.DATABASE_URL;
    if (!remoteUrl) {
      throw new Error(
        'USE_LOCAL_DB is false but DATABASE_URL_REMOTE is not set. ' +
        'Please set DATABASE_URL_REMOTE in your .env file.'
      );
    }
    return {
      url: remoteUrl,
      type: 'remote',
      isLocal: false,
    };
  }
}

/**
 * Get database URL for a specific type (local or remote)
 */
export function getDatabaseUrl(type: 'local' | 'remote'): string {
  if (type === 'local') {
    const url = process.env.DATABASE_URL_LOCAL;
    if (!url) {
      throw new Error('DATABASE_URL_LOCAL is not set in .env file');
    }
    return url;
  } else {
    const url = process.env.DATABASE_URL_REMOTE;
    if (!url) {
      throw new Error('DATABASE_URL_REMOTE is not set in .env file');
    }
    return url;
  }
}

/**
 * Get current database status
 */
export function getDatabaseStatus(): {
  active: 'local' | 'remote';
  localUrl?: string;
  remoteUrl?: string;
  useLocalDb: boolean;
} {
  const useLocalDb = process.env.USE_LOCAL_DB === 'true' || process.env.USE_LOCAL_DB === '1';
  const config = getDatabaseConfig();
  
  return {
    active: config.type,
    localUrl: process.env.DATABASE_URL_LOCAL ? maskUrl(process.env.DATABASE_URL_LOCAL) : undefined,
    remoteUrl: process.env.DATABASE_URL_REMOTE ? maskUrl(process.env.DATABASE_URL_REMOTE) : undefined,
    useLocalDb,
  };
}

/**
 * Mask sensitive information in database URL for logging
 */
function maskUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    if (urlObj.password) {
      urlObj.password = '***';
    }
    return urlObj.toString();
  } catch {
    // If URL parsing fails, just mask the password part
    return url.replace(/:([^:@]+)@/, ':***@');
  }
}

/**
 * Set the active database URL in process.env for Prisma
 */
export function setActiveDatabaseUrl(): void {
  const config = getDatabaseConfig();
  process.env.DATABASE_URL = config.url;
  
  console.log(`📊 Database: Using ${config.type} database`);
  console.log(`   URL: ${maskUrl(config.url)}`);
}

