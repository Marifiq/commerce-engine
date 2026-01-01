import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding abandoned carts...');
  
  // Get all users and products for creating abandoned carts
  const allUsers = await prisma.user.findMany({ where: { role: 'user' } });
  const allProducts = await prisma.product.findMany();
  
  if (allUsers.length === 0) {
    console.log('No users found. Please seed users first.');
    return;
  }
  
  if (allProducts.length === 0) {
    console.log('No products found. Please seed products first.');
    return;
  }
  
  // Delete existing carts to start fresh
  console.log('Cleaning existing carts...');
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  
  // Create abandoned carts for some users (not all, to make it realistic)
  // Users can have both orders and abandoned carts
  // Try to create carts for up to 10 users
  const maxCarts = Math.min(10, allUsers.length);
  const selectedUsers = allUsers.slice(0, maxCarts);
  
  let cartsCreated = 0;
  
  for (let i = 0; i < selectedUsers.length; i++) {
    const user = selectedUsers[i];
    
    // Check if user already has a cart
    const existingCart = await prisma.cart.findUnique({ where: { userId: user.id } });
    if (existingCart) {
      console.log(`Skipping ${user.name} - already has a cart`);
      continue;
    }
    
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
      
      // Generate quantities for each product
      const cartItems = selectedProducts.map(product => ({
        productId: product.id,
        quantity: Math.floor(Math.random() * 3) + 1, // 1-3 quantity
      }));
      
      // Calculate total before creating cart
      const total = selectedProducts.reduce((sum, product, idx) => {
        const qty = cartItems[idx].quantity;
        return sum + (product.price * qty);
      }, 0);
      
      const cart = await prisma.cart.create({
        data: {
          userId: user.id,
          updatedAt: abandonedDate,
          items: {
            create: cartItems
          }
        }
      });
      
      console.log(`✓ Created abandoned cart for ${user.name} (${selectedProducts.length} items, $${total.toFixed(2)}, ${daysAgo} day(s) ago)`);
      cartsCreated++;
    }
  }
  
  console.log(`\n✅ Successfully created ${cartsCreated} abandoned carts!`);
}

main()
  .catch((e) => {
    console.error('Error seeding abandoned carts:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

