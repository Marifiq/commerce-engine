import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  const dbPath = path.join(__dirname, '../../client/mock-server/db.json');
  if (!fs.existsSync(dbPath)) {
    console.error('db.json not found at', dbPath);
    return;
  }

  const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

  console.log('Cleaning existing data...');
  await prisma.review.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding users...');
  const userMap = new Map(); // originalId -> newId
  const emailMap = new Map(); // email -> newId
  
  for (const u of data.users) {
    const hashedPassword = await bcrypt.hash(u.password || 'password123', 12);
    const user = await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        password: hashedPassword,
        role: u.role || 'user',
      }
    });
    userMap.set(u.id, user.id);
    emailMap.set(u.email, user.id);
  }

  console.log('Seeding products...');
  const productMap = new Map(); // originalId -> newId
  for (const p of data.products) {
    const product = await prisma.product.create({
      data: {
        name: p.name,
        description: p.description || '',
        price: Number(p.price) || 0,
        category: p.category || 'Uncategorized',
        image: p.image || '/images/placeholder.jpg',
        stock: 100,
        section: p.section || null,
      }
    });
    productMap.set(p.id, product.id);
  }

  console.log('Seeding reviews...');
  for (const r of data.reviews) {
    let userEmail = typeof r.user === 'string' ? r.user : r.user?.email;
    let userId = userEmail ? emailMap.get(userEmail) : null;
    
    if (!userId) {
        const firstUser = await prisma.user.findFirst();
        userId = firstUser?.id;
    }

    const productId = productMap.get(r.productId);

    if (userId && productId) {
      await prisma.review.create({
        data: {
          text: r.text || '',
          rating: Number(r.rating) || 5,
          isApproved: r.isApproved ?? true,
          images: r.images || [],
          videos: r.videos || [],
          productId,
          userId,
          createdAt: new Date(r.createdAt || Date.now()),
        }
      });
    }
  }

  console.log('Seeding orders...');
  for (const o of (data.orders || [])) {
    const userId = userMap.get(o.userId) || emailMap.get(o.userEmail);
    if (!userId) continue;

    const order = await prisma.order.create({
      data: {
        userId,
        totalAmount: Number(o.total) || 0,
        status: o.status || 'pending',
        createdAt: new Date(o.createdAt || Date.now()),
        items: {
          create: (o.items || []).map((item: any) => ({
            productId: productMap.get(item.productId),
            quantity: item.quantity || 1,
            price: Number(item.product?.price) || 0,
          })).filter((i: any) => i.productId)
        }
      }
    });
  }

  console.log('Seeding abandoned carts...');
  // Get all users and products for creating abandoned carts
  const allUsers = await prisma.user.findMany({ where: { role: 'user' } });
  const allProducts = await prisma.product.findMany();
  
  if (allUsers.length > 0 && allProducts.length > 0) {
    // Create abandoned carts for some users (not all, to make it realistic)
    const usersWithCarts = allUsers.slice(0, Math.min(8, allUsers.length));
    
    for (let i = 0; i < usersWithCarts.length; i++) {
      const user = usersWithCarts[i];
      
      // Skip if user already has an order (they might have checked out)
      const hasOrder = await prisma.order.findFirst({ where: { userId: user.id } });
      if (hasOrder && Math.random() > 0.3) continue; // 70% chance to skip users with orders
      
      // Create cart with 1-4 random products
      const numItems = Math.floor(Math.random() * 4) + 1;
      const selectedProducts = allProducts
        .sort(() => Math.random() - 0.5)
        .slice(0, numItems);
      
      if (selectedProducts.length > 0) {
        // Create cart with updatedAt in the past (1-7 days ago) to simulate abandoned carts
        const daysAgo = Math.floor(Math.random() * 7) + 1;
        const abandonedDate = new Date();
        abandonedDate.setDate(abandonedDate.getDate() - daysAgo);
        
        const cart = await prisma.cart.create({
          data: {
            userId: user.id,
            updatedAt: abandonedDate,
            items: {
              create: selectedProducts.map(product => ({
                productId: product.id,
                quantity: Math.floor(Math.random() * 3) + 1, // 1-3 quantity
              }))
            }
          }
        });
        
        console.log(`Created abandoned cart for ${user.name} with ${selectedProducts.length} items`);
      }
    }
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
