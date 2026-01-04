/**
 * Script to fix all PostgreSQL sequences
 * Run this if you're experiencing unique constraint errors on id fields
 * 
 * Usage: tsx scripts/fixSequences.ts
 */

import prisma from '../db.js';
import { fixSequence } from '../utils/fixSequence.js';

async function main() {
  console.log('🔧 Fixing all database sequences...\n');

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

  for (const table of tables) {
    try {
      await fixSequence(table);
    } catch (error: any) {
      console.error(`Failed to fix sequence for ${table}:`, error.message);
    }
  }

  console.log('\n✅ All sequences fixed!');
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

