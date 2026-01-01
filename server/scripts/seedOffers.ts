import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🎯 Seeding offers data...\n');
  
  // Get existing products and categories
  const allProducts = await prisma.product.findMany({ where: { stock: { gt: 0 } } });
  const allCategories = await prisma.category.findMany();
  
  if (allProducts.length === 0 && allCategories.length === 0) {
    console.log('⚠️  No products or categories found. Creating offers without specific targets...\n');
  }
  
  // Define offers to create (5-7 offers)
  const offersToCreate = [
    {
      title: 'Summer Sale - 30% Off All Items',
      description: 'Get 30% off on all products. Limited time offer!',
      discountPercent: 30,
      targetType: 'all' as const,
      targetId: null,
      targetName: null,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isActive: true,
      showBanner: true,
    },
    {
      title: 'Flash Sale - 50% Off Selected Items',
      description: 'Limited time flash sale! Don\'t miss out on these amazing deals.',
      discountPercent: 50,
      targetType: allProducts.length > 0 ? ('product' as const) : ('all' as const),
      targetId: allProducts.length > 0 ? allProducts[0].id : null,
      targetName: allProducts.length > 0 ? allProducts[0].name : null,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      isActive: true,
      showBanner: true,
    },
    {
      title: 'Category Discount - 25% Off',
      description: 'Special discount on our premium category. Shop now!',
      discountPercent: 25,
      targetType: allCategories.length > 0 ? ('category' as const) : ('all' as const),
      targetId: allCategories.length > 0 ? allCategories[0].id : null,
      targetName: allCategories.length > 0 ? allCategories[0].name : null,
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      isActive: true,
      showBanner: false,
    },
    {
      title: 'Weekend Special - 15% Off',
      description: 'Weekend special discount. Perfect time to shop!',
      discountPercent: 15,
      targetType: allProducts.length > 1 ? ('product' as const) : ('all' as const),
      targetId: allProducts.length > 1 ? allProducts[1].id : null,
      targetName: allProducts.length > 1 ? allProducts[1].name : null,
      startDate: null,
      endDate: null,
      isActive: true,
      showBanner: false,
    },
    {
      title: 'New Customer Offer - 20% Off',
      description: 'Welcome offer for new customers. Start shopping today!',
      discountPercent: 20,
      targetType: 'all' as const,
      targetId: null,
      targetName: null,
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Started 7 days ago
      endDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000), // 23 days from now (30 days total)
      isActive: true,
      showBanner: true,
    },
    {
      title: 'Premium Category Sale - 40% Off',
      description: 'Exclusive discount on premium items. Limited stock available!',
      discountPercent: 40,
      targetType: allCategories.length > 1 ? ('category' as const) : (allCategories.length > 0 ? ('category' as const) : ('all' as const)),
      targetId: allCategories.length > 1 ? allCategories[1].id : (allCategories.length > 0 ? allCategories[0].id : null),
      targetName: allCategories.length > 1 ? allCategories[1].name : (allCategories.length > 0 ? allCategories[0].name : null),
      startDate: new Date(),
      endDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
      isActive: true,
      showBanner: true,
    },
    {
      title: 'Clearance Sale - 35% Off',
      description: 'Clearance sale on selected items. Great deals while stocks last!',
      discountPercent: 35,
      targetType: allProducts.length > 2 ? ('product' as const) : ('all' as const),
      targetId: allProducts.length > 2 ? allProducts[2].id : null,
      targetName: allProducts.length > 2 ? allProducts[2].name : null,
      startDate: null,
      endDate: null,
      isActive: false, // Inactive offer
      showBanner: false,
    },
  ];

  console.log(`📋 Creating ${offersToCreate.length} offers...\n`);

  for (let i = 0; i < offersToCreate.length; i++) {
    const offerData = offersToCreate[i];
    
    try {
      // If targetType is product, verify product exists and update its discount
      if (offerData.targetType === 'product' && offerData.targetId) {
        const product = await prisma.product.findUnique({
          where: { id: offerData.targetId },
        });
        if (product) {
          await prisma.product.update({
            where: { id: offerData.targetId },
            data: { discountPercent: offerData.discountPercent },
          });
        }
      }

      // If targetType is category, verify category exists and update its discount
      if (offerData.targetType === 'category' && offerData.targetId) {
        const category = await prisma.category.findUnique({
          where: { id: offerData.targetId },
        });
        if (category) {
          await prisma.category.update({
            where: { id: offerData.targetId },
            data: { discountPercent: offerData.discountPercent },
          });
        }
      }

      const offer = await prisma.offer.create({
        data: {
          title: offerData.title,
          description: offerData.description,
          discountPercent: offerData.discountPercent,
          targetType: offerData.targetType,
          targetId: offerData.targetId,
          targetName: offerData.targetName,
          startDate: offerData.startDate,
          endDate: offerData.endDate,
          isActive: offerData.isActive,
          showBanner: offerData.showBanner,
        },
      });

      const targetInfo = offerData.targetType === 'all' 
        ? 'All Products'
        : `${offerData.targetType}: ${offerData.targetName || offerData.targetId}`;
      
      const statusEmoji = offerData.isActive ? '✅' : '⏸️';
      const bannerEmoji = offerData.showBanner ? '📢' : '';
      
      console.log(`  ${i + 1}. ${statusEmoji} ${bannerEmoji} ${offer.title}`);
      console.log(`     Discount: ${offer.discountPercent}% | Target: ${targetInfo}`);
      if (offerData.startDate || offerData.endDate) {
        const start = offerData.startDate ? offerData.startDate.toLocaleDateString() : 'No start date';
        const end = offerData.endDate ? offerData.endDate.toLocaleDateString() : 'No end date';
        console.log(`     Period: ${start} - ${end}`);
      }
      console.log('');
    } catch (error: any) {
      console.error(`  ❌ Error creating offer "${offerData.title}":`, error.message);
    }
  }

  console.log('✅ Offers seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Total offers created: ${offersToCreate.length}`);
  console.log(`   - Active offers: ${offersToCreate.filter(o => o.isActive).length}`);
  console.log(`   - Offers with banners: ${offersToCreate.filter(o => o.showBanner).length}`);
  console.log(`   - All products offers: ${offersToCreate.filter(o => o.targetType === 'all').length}`);
  console.log(`   - Product-specific offers: ${offersToCreate.filter(o => o.targetType === 'product').length}`);
  console.log(`   - Category-specific offers: ${offersToCreate.filter(o => o.targetType === 'category').length}\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding offers:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

