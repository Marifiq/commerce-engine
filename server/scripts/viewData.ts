import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- DATABASE INSPECTION ---');

    const tables = [
        { name: 'Users', model: prisma.user },
        { name: 'Products', model: prisma.product },
        { name: 'Carts', model: prisma.cart },
        { name: 'CartItems', model: prisma.cartItem },
        { name: 'Orders', model: prisma.order },
        { name: 'OrderItems', model: prisma.orderItem },
        { name: 'Reviews', model: prisma.review },
    ];

    for (const table of tables) {
        console.log(`\n[ ${table.name.toUpperCase()} ]`);
        try {
            const data = await (table.model as any).findMany();
            if (data.length === 0) {
                console.log('No data found.');
            } else {
                console.table(data);
            }
        } catch (error: any) {
            console.error(`Error fetching ${table.name}:`, error.message);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
