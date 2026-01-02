import { PrismaClient } from '@prisma/client';

export async function seedCategories(prisma: PrismaClient) {
    console.log('Seeding categories...');

    const categories = [
        {
            name: 'Men',
            image: '/img/categories/category-1767299500333.webp',
            discountPercent: 10,
        },
        {
            name: 'Women',
            image: '/img/categories/category-1767299797057.webp',
            discountPercent: 15,
        },
        {
            name: 'Accessories',
            image: '/img/categories/category-1767299807901.webp',
            discountPercent: 5,
        }
    ];

    const createdCategories = [];
    for (const category of categories) {
        const c = await prisma.category.upsert({
            where: { name: category.name },
            update: {},
            create: category,
        });
        createdCategories.push(c);
    }

    return createdCategories;
}
