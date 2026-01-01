import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌟 Seeding best sellers data...\n');
  
  // Get all users and products
  const allUsers = await prisma.user.findMany({ where: { role: 'user' } });
  const allProducts = await prisma.product.findMany({ where: { stock: { gt: 0 } } });
  
  if (allUsers.length === 0) {
    console.log('❌ No users found. Please seed users first.');
    return;
  }
  
  if (allProducts.length === 0) {
    console.log('❌ No products found. Please seed products first.');
    return;
  }
  
  // Select 5-6 products to make them best sellers
  const numBestSellers = Math.min(6, allProducts.length);
  const bestSellerProducts = allProducts.slice(0, numBestSellers);
  
  console.log(`📦 Selected ${bestSellerProducts.length} products to make best sellers:\n`);
  bestSellerProducts.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name} (ID: ${p.id})`);
  });
  console.log('');
  
  // For each best seller product, create:
  // 1. Multiple orders with order items (sales count)
  // 2. Multiple reviews with ratings > 4 and text comments
  
  for (let i = 0; i < bestSellerProducts.length; i++) {
    const product = bestSellerProducts[i];
    
    console.log(`\n🛍️  Processing: ${product.name}`);
    
    // Calculate how many orders and reviews to create
    // More popular products should have more sales and reviews
    const baseOrders = 3 + i; // 3-8 orders
    const baseReviews = 2 + i; // 2-7 reviews
    
    // Create orders with order items
    const ordersToCreate = Math.min(baseOrders, allUsers.length);
    const selectedUsers = allUsers
      .sort(() => Math.random() - 0.5)
      .slice(0, ordersToCreate);
    
    let totalQuantitySold = 0;
    
    for (const user of selectedUsers) {
      // Create order with this product
      const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 items per order
      totalQuantitySold += quantity;
      
      const order = await prisma.order.create({
        data: {
          userId: user.id,
          totalAmount: product.price * quantity,
          status: ['completed', 'delivered', 'shipped'][Math.floor(Math.random() * 3)],
          shippingAddress: '123 Main St, City, State 12345',
          paymentMethod: ['card', 'cod'][Math.floor(Math.random() * 2)],
          items: {
            create: [{
              productId: product.id,
              quantity: quantity,
              price: product.price,
            }]
          }
        }
      });
    }
    
    console.log(`  ✓ Created ${ordersToCreate} orders (${totalQuantitySold} items sold)`);
    
    // Create reviews with ratings > 4 and text comments
    const reviewTexts = [
      'Absolutely love this product! Quality is amazing and it looks great.',
      'Best purchase I\'ve made in a while. Highly recommend!',
      'Excellent quality and fast shipping. Will definitely buy again!',
      'Perfect fit and great design. Very satisfied with my purchase.',
      'Outstanding product! Exceeded my expectations in every way.',
      'Top quality item. Worth every penny!',
      'Amazing quality and design. I\'m very happy with this purchase.',
      'Great product! Fast delivery and excellent customer service.',
    ];
    
    const reviewsToCreate = Math.min(baseReviews, allUsers.length);
    const reviewUsers = allUsers
      .sort(() => Math.random() - 0.5)
      .slice(0, reviewsToCreate);
    
    for (const user of reviewUsers) {
      // Rating between 4 and 5 (4 or 5)
      const rating = Math.random() > 0.3 ? 5 : 4;
      const reviewText = reviewTexts[Math.floor(Math.random() * reviewTexts.length)];
      
      await prisma.review.create({
        data: {
          productId: product.id,
          userId: user.id,
          rating: rating,
          text: reviewText,
          isApproved: true,
          images: [],
          videos: [],
        }
      });
    }
    
    // Calculate the popularity score for this product
    const salesCount = totalQuantitySold;
    const reviewCount = reviewsToCreate;
    const avgRating = reviewsToCreate > 0 
      ? (reviewsToCreate * 4.5) / reviewsToCreate // Average will be around 4.5-5
      : 0;
    const popularityScore = salesCount * 2 + reviewCount * 5 + avgRating * 3;
    
    console.log(`  ✓ Created ${reviewsToCreate} reviews (avg rating: ${avgRating.toFixed(1)})`);
    console.log(`  📊 Popularity Score: ${popularityScore.toFixed(1)} (sales: ${salesCount}, reviews: ${reviewCount}, rating: ${avgRating.toFixed(1)})`);
  }
  
  console.log('\n✅ Best sellers data seeded successfully!');
  console.log('\n📈 Summary:');
  console.log(`   - Products processed: ${bestSellerProducts.length}`);
  console.log(`   - All products have ratings > 4 and reviews with comments`);
  console.log(`   - Products are now eligible for best sellers section\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding best sellers:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

