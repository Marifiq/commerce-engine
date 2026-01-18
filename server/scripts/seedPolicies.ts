import { PrismaClient } from '@prisma/client';
import { seedPolicies } from '../seeders/PolicySeeder.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting policy seeding...\n');
  
  try {
    await seedPolicies(prisma);
    console.log('✅ All policies seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding policies:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });




