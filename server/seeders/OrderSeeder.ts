import { PrismaClient, User, Product } from '@prisma/client';

export async function seedOrders(prisma: PrismaClient, users: User[], products: Product[]) {
    console.log('Seeding orders...');

    // Only seed orders for regular users
    const regularUsers = users.filter(u => u.role === 'user');

    for (const user of regularUsers) {
        // Each user might have 0-2 orders
        const numOrders = Math.floor(Math.random() * 2);

        for (let i = 0; i < numOrders; i++) {
            const shuffledProducts = [...products].sort(() => 0.5 - Math.random());
            const numItems = Math.floor(Math.random() * 3) + 1;
            const orderItems = shuffledProducts.slice(0, numItems).map(p => ({
                productId: p.id,
                quantity: Math.floor(Math.random() * 2) + 1,
                price: p.price,
            }));

            const totalAmount = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            await prisma.order.create({
                data: {
                    userId: user.id,
                    totalAmount,
                    status: ['pending', 'delivered', 'shipped'][Math.floor(Math.random() * 3)],
                    shippingAddress: '123 Dummy Street, Test City',
                    paymentMethod: 'Credit Card',
                    items: {
                        create: orderItems,
                    }
                }
            });
        }
    }
}
