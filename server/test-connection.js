// Quick connection test
const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: './.env' });

async function test() {
  const directUrl = process.env.DIRECT_URL;
  console.log('Testing DIRECT_URL connection...\n');
  console.log('URL:', directUrl ? directUrl.replace(/:[^:@]+@/, ':****@') : 'Not set');
  
  if (!directUrl) {
    console.log('❌ DIRECT_URL not set');
    return;
  }
  
  // Check if SSL is in the URL
  if (!directUrl.includes('sslmode')) {
    console.log('⚠️  Warning: DIRECT_URL missing sslmode parameter');
    console.log('   Should be: ...postgres?sslmode=require');
  }
  
  const prisma = new PrismaClient({
    datasources: { db: { url: directUrl } }
  });
  
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Connection successful!');
    await prisma.$disconnect();
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
  }
}

test();
