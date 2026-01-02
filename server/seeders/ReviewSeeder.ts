import { PrismaClient, User, Product } from '@prisma/client';

export async function seedReviews(prisma: PrismaClient, users: User[], products: Product[]) {
    console.log('Seeding reviews...');

    const reviewsData = [
        { text: 'Amazing quality! Highly recommended.', rating: 5 },
        { text: 'Good product, but the delivery was a bit slow.', rating: 4 },
        { text: 'Fits perfectly and feels very comfortable.', rating: 5 },
        { text: 'Great value for money.', rating: 4 },
        { text: 'The color is slightly different from the photos.', rating: 3 },
        { text: 'Exceptional customer service and great product.', rating: 5 }
    ];

    for (const product of products) {
        // Each product gets 1-3 random reviews
        const numReviews = Math.floor(Math.random() * 3) + 1;
        const shuffledUsers = [...users].sort(() => 0.5 - Math.random());

        for (let i = 0; i < numReviews; i++) {
            const user = shuffledUsers[i % shuffledUsers.length];
            const reviewInfo = reviewsData[Math.floor(Math.random() * reviewsData.length)];

            await prisma.review.create({
                data: {
                    text: reviewInfo.text,
                    rating: reviewInfo.rating,
                    isApproved: true,
                    productId: product.id,
                    userId: user.id,
                }
            });
        }
    }
}
