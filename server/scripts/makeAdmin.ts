/**
 * Script to make a user an admin
 * Usage: npx tsx scripts/makeAdmin.ts
 */

import prisma from '../db.js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

async function makeAdmin() {
  const email = 'bsef21m540@pucit.edu.pk';

  try {
    console.log(`🔍 Looking for user with email: ${email}...`);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`❌ User with email ${email} not found.`);
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.name} (${user.email})`);
    console.log(`   Current role: ${user.role}`);

    if (user.role === 'admin') {
      console.log(`✅ User is already an admin. No changes needed.`);
      await prisma.$disconnect();
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        role: 'admin',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    console.log(`\n🎉 Successfully updated user to admin!`);
    console.log(`   Name: ${updatedUser.name}`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Role: ${updatedUser.role}`);

    await prisma.$disconnect();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Run the script
makeAdmin().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

