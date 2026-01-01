import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning database...');

  // 1. Clean data (Order is important because of relationships)
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding new data...');

  // 2. Create Users
  const hashedPassword = await bcrypt.hash('1234', 12);

  const admin = await prisma.user.create({
    data: {
      name: 'Muhib Arshad',
      email: 'muhib@example.com',
      password: hashedPassword,
      role: 'admin',
      cart: { create: {} }
    },
  });

  const user1 = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      password: hashedPassword,
      role: 'user',
      cart: { create: {} }
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: hashedPassword,
      role: 'user',
      cart: { create: {} }
    },
  });

  const user3 = await prisma.user.create({
    data: {
      name: 'Ali Abdullah',
      email: 'ali@example.com',
      password: hashedPassword,
      role: 'user',
      cart: { create: {} }
    },
  });

  console.log('Users seeded.');

  // 3. Create Products with real images from /img/products
  const productsData = [
    { 
      name: 'Classic White Oxford', 
      price: 85.00, 
      category: 'Formal', 
      image: '/img/products/white-shirt.png', 
      section: 'New Arrivals', 
      stock: 50,
      description: 'A timeless classic for any formal occasion. Made from 100% premium cotton.'
    },
    { 
      name: 'Midnight Blue Silk', 
      price: 150.00, 
      category: 'Luxury', 
      image: '/img/products/midnight-blue-shirt.png', 
      section: 'Best Sellers', 
      stock: 20,
      description: 'Experience pure luxury with our signature midnight blue silk shirt.'
    },
    { 
      name: 'Slate Grey Linen', 
      price: 65.00, 
      category: 'Casual', 
      image: '/img/products/grey-linen-shirt.png', 
      section: 'Summer Collection', 
      stock: 40,
      description: 'Breathable and stylish, perfect for those warm summer evenings.'
    },
    { 
      name: 'Charcoal Slim Fit', 
      price: 95.00, 
      category: 'Business', 
      image: '/img/products/charcoal-slim-fit.png', 
      section: 'Best Sellers', 
      stock: 35,
      description: 'A modern cut for the modern professional. Sharpen your look.'
    },
    { 
      name: 'Monaco Blue Linen', 
      price: 70.00, 
      category: 'Casual', 
      image: '/img/products/monaco-blue-linen.png', 
      section: 'Summer Collection', 
      stock: 25,
      description: 'Vibrant and comfortable. Bring the Riviera style to your wardrobe.'
    },
    { 
      name: 'Jet Black Silk', 
      price: 155.00, 
      category: 'Luxury', 
      image: '/img/products/black-silk-shirt.png', 
      section: 'New Arrivals', 
      stock: 15,
      description: 'Deep black, high luster. The ultimate statement shirt.'
    },
  ];

  const createdProducts = [];
  for (const p of productsData) {
    const product = await prisma.product.create({ data: p });
    createdProducts.push(product);
  }

  console.log('Products seeded.');

  // 4. Create Reviews
  await prisma.review.createMany({
    data: [
      { text: "Best shirt I've ever owned!", rating: 5, productId: createdProducts[0].id, userId: user1.id },
      { text: "Amazing quality and fits perfectly.", rating: 5, productId: createdProducts[1].id, userId: user2.id },
      { text: "Great fabric, very breathable.", rating: 4, productId: createdProducts[2].id, userId: user1.id },
      { text: "Looks very professional.", rating: 5, productId: createdProducts[3].id, userId: user3.id },
    ]
  });

  console.log('Reviews seeded.');

  // 5. Create Cart Items
  const user1Cart = await prisma.cart.findUnique({ where: { userId: user1.id } });
  if (user1Cart) {
    await prisma.cartItem.createMany({
      data: [
        { cartId: user1Cart.id, productId: createdProducts[4].id, quantity: 1 },
        { cartId: user1Cart.id, productId: createdProducts[5].id, quantity: 2 },
      ]
    });
  }

  console.log('Cart items seeded.');

  // 6. Create Orders
  await prisma.order.create({
    data: {
      userId: user1.id,
      totalAmount: (createdProducts[0].price * 2),
      status: 'delivered',
      items: {
        create: [
          { productId: createdProducts[0].id, quantity: 2, price: createdProducts[0].price }
        ]
      }
    }
  });

  await prisma.order.create({
    data: {
      userId: user2.id,
      totalAmount: createdProducts[1].price + createdProducts[2].price,
      status: 'pending',
      items: {
        create: [
          { productId: createdProducts[1].id, quantity: 1, price: createdProducts[1].price },
          { productId: createdProducts[2].id, quantity: 1, price: createdProducts[2].price }
        ]
      }
    }
  });

  console.log('Orders seeded.');
  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
