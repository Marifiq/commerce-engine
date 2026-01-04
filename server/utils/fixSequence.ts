/**
 * Utility to fix PostgreSQL sequence issues
 * When sequences get out of sync (e.g., after manual inserts), this fixes them
 */

import prisma from '../db.js';

/**
 * Fix the sequence for a given table's id column
 * Sets the sequence to max(id) + 1
 */
export async function fixSequence(tableName: string): Promise<void> {
  try {
    // Get the max ID from the table using raw SQL
    const maxResult = await prisma.$queryRawUnsafe<Array<{ max: number | null }>>(
      `SELECT MAX(id) as max FROM "${tableName}"`
    );
    
    const maxId = maxResult[0]?.max || 0;
    const nextId = maxId + 1;
    
    // PostgreSQL sequence names use exact case from model names (e.g., "CartItem_id_seq")
    // We need to quote the sequence name to preserve case in setval()
    const sequenceName = `"${tableName}_id_seq"`;
    
    // Reset the sequence to the next available ID
    // setval(sequence_name, value, is_called)
    // is_called = false means the next nextval() will return this value
    // Use double quotes inside single quotes to preserve case: '"SequenceName_id_seq"'
    await prisma.$executeRawUnsafe(
      `SELECT setval('${sequenceName}', ${nextId}, false)`
    );
    
    console.log(`✅ Fixed sequence for ${tableName}: set to ${nextId}`);
  } catch (error: any) {
    console.error(`❌ Error fixing sequence for ${tableName}:`, error.message);
    throw error;
  }
}

/**
 * Fix sequence for Offer table specifically
 */
export async function fixOfferSequence(): Promise<void> {
  return fixSequence('Offer');
}

