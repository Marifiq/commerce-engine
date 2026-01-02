import { PrismaClient } from '@prisma/client';
import { seedUsers } from '../seeders/UserSeeder.js';
import { seedCategories } from '../seeders/CategorySeeder.js';
import { seedProducts } from '../seeders/ProductSeeder.js';
import { seedReviews } from '../seeders/ReviewSeeder.js';
import { seedOffers } from '../seeders/OfferSeeder.js';
import { seedOrders } from '../seeders/OrderSeeder.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning existing data...');
  // Delete in order to respect foreign key constraints
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log('Starting seeding process...');

  const users = await seedUsers(prisma);
  await seedCategories(prisma);
  const products = await seedProducts(prisma);
  await seedReviews(prisma, users, products);
  await seedOffers(prisma);
  await seedOrders(prisma, users, products);

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

