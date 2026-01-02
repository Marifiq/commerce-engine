import { PrismaClient } from '@prisma/client';

export async function seedProducts(prisma: PrismaClient) {
    console.log('Seeding products...');

    const products = [
        {
            name: 'Classic White T-Shirt',
            description: 'A timeless classic white t-shirt made from 100% organic cotton.',
            price: 25.99,
            category: 'Men',
            image: '/img/products/download.jpeg',
            section: 'Best Sellers',
            stock: 50,
            discountPercent: 0,
        },
        {
            name: 'Navy Blue Polo',
            description: 'Comfortable navy blue polo shirt, perfect for casual outings.',
            price: 35.50,
            category: 'Men',
            image: '/img/products/download (1).jpeg',
            section: 'New Arrivals',
            stock: 30,
            discountPercent: 10,
        },
        {
            name: 'Casual Grey Hoodie',
            description: 'Soft grey hoodie for those chilly evenings.',
            price: 45.00,
            category: 'Men',
            image: '/img/products/download (2).jpeg',
            section: 'Featured',
            stock: 20,
            discountPercent: 5,
        },
        {
            name: 'Summer Floral Dress',
            description: 'Elegant floral dress for a bright summer day.',
            price: 55.00,
            category: 'Women',
            image: '/img/products/download (3).jpeg',
            section: 'Trending',
            stock: 15,
            discountPercent: 15,
        },
        {
            name: 'Denim Jacket',
            description: 'Classic denim jacket that never goes out of style.',
            price: 65.00,
            category: 'Women',
            image: '/img/products/download (4).jpeg',
            section: 'Best Sellers',
            stock: 25,
            discountPercent: 0,
        },
        {
            name: 'Leather Belt',
            description: 'Premium leather belt for a sophisticated look.',
            price: 20.00,
            category: 'Accessories',
            image: '/img/products/download (5).jpeg',
            section: 'New Arrivals',
            stock: 100,
            discountPercent: 0,
        }
    ];

    const createdProducts = [];
    for (const product of products) {
        const p = await prisma.product.create({
            data: product,
        });
        createdProducts.push(p);
    }

    return createdProducts;
}
