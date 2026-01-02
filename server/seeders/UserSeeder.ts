import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function seedUsers(prisma: PrismaClient) {
    console.log('Seeding users...');

    const adminPassword = await bcrypt.hash('adminpassword', 12);
    const userPassword = await bcrypt.hash('user123', 12);

    const users = [
        {
            name: 'Admin User',
            email: 'admin@example.com',
            password: adminPassword,
            role: 'admin',
        },
        {
            name: 'John Doe',
            email: 'john@example.com',
            password: userPassword,
            role: 'user',
        },
        {
            name: 'Jane Smith',
            email: 'jane@example.com',
            password: userPassword,
            role: 'user',
        },
        {
            name: 'Alice Johnson',
            email: 'alice@example.com',
            password: userPassword,
            role: 'user',
        },
        {
            name: 'Bob Wilson',
            email: 'bob@example.com',
            password: userPassword,
            role: 'user',
        }
    ];

    const createdUsers = [];
    for (const user of users) {
        const u = await prisma.user.upsert({
            where: { email: user.email },
            update: {},
            create: user,
        });
        createdUsers.push(u);
    }

    return createdUsers;
}
