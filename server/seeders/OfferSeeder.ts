import { PrismaClient } from '@prisma/client';

export async function seedOffers(prisma: PrismaClient) {
    console.log('Seeding offers...');

    const offers = [
        {
            title: 'Summer Sale!',
            description: 'Get up to 50% off on all summer collections.',
            discountPercent: 50,
            targetType: 'category',
            targetName: 'Women',
            showBanner: true,
            isActive: true,
        },
        {
            title: 'Accessories Blowout',
            description: 'Flat 20% off on all accessories.',
            discountPercent: 20,
            targetType: 'category',
            targetName: 'Accessories',
            showBanner: false,
            isActive: true,
        },
        {
            title: 'Featured Product Deal',
            description: 'Special discount on our best-selling Classic White T-Shirt.',
            discountPercent: 15,
            targetType: 'product',
            targetName: 'Classic White T-Shirt',
            showBanner: true,
            isActive: true,
        }
    ];

    for (const offer of offers) {
        await prisma.offer.create({
            data: offer,
        });
    }
}
