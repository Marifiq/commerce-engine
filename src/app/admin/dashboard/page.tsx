'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../../utils/api';
import {
    DollarSign,
    ShoppingBag,
    Users,
    TrendingUp,
    Clock,
    ChevronRight
} from 'lucide-react';
import Link from 'next/link';

interface Stats {
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    totalUsers: number;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [recentUsers, setRecentUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsRes, ordersRes, usersRes] = await Promise.all([
                    apiFetch('/admin/stats'),
                    apiFetch('/admin/orders'),
                    apiFetch('/admin/users')
                ]);

                setStats(statsRes.data);
                // Get last 5 orders and users
                setRecentOrders(ordersRes.data.orders.slice(-5).reverse());
                setRecentUsers(usersRes.data.users.slice(-5).reverse());
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);


    const statCards = [
        { title: 'Total Revenue', value: `$${stats?.totalRevenue.toLocaleString()}`, icon: DollarSign },
        { title: 'Total Orders', value: stats?.totalOrders, icon: ShoppingBag, href: '/admin/orders' },
        { title: 'Total Products', value: stats?.totalProducts, icon: TrendingUp, href: '/admin/products' },
        { title: 'Total Users', value: stats?.totalUsers, icon: Users, href: '/admin/users' },
    ];

    return (
        <div className="space-y-6 sm:space-y-10">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white">Dashboard</h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">Welcome back, Administrator.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {statCards.map((card, index) => {
                    const CardContent = (
                        <>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-zinc-500 transition-colors">{card.title}</p>
                                <h3 className="text-2xl font-black text-black dark:text-white mt-1">
                                    {loading ? <div className="h-8 w-16 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded" /> : card.value}
                                </h3>
                            </div>
                            <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white group-hover:scale-110 transition-transform">
                                <card.icon size={22} />
                            </div>
                        </>
                    );

                    const commonClasses = "bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between group hover:border-black dark:hover:border-white transition-all";

                    return card.href ? (
                        <Link
                            key={index}
                            href={card.href}
                            className={`${commonClasses} cursor-pointer`}
                        >
                            {CardContent}
                        </Link>
                    ) : (
                        <div
                            key={index}
                            className={`${commonClasses} cursor-default`}
                        >
                            {CardContent}
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Orders */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock size={20} className="text-zinc-400" />
                            <h2 className="font-bold text-zinc-900 dark:text-white">Recent Orders</h2>
                        </div>
                        <Link href="/admin/orders" className="text-sm text-zinc-500 hover:text-black dark:hover:text-white font-bold flex items-center gap-1 cursor-pointer transition-colors">
                            View All <ChevronRight size={16} />
                        </Link>
                    </div>
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {recentOrders.length > 0 ? recentOrders.map((order) => (
                            <Link key={order.id} href={`/admin/orders?id=${order.id}`} className="block p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium text-zinc-900 dark:text-white">Order #{order.id.toString().slice(-6)}</div>
                                        <div className="text-sm text-zinc-500">{order.status} • {new Date(order.createdAt).toLocaleDateString()}</div>
                                    </div>
                                    <div className="font-bold text-zinc-900 dark:text-white">${order.total}</div>
                                </div>
                            </Link>
                        )) : (
                            <div className="p-8 text-center text-zinc-500">No orders yet.</div>
                        )}
                    </div>
                </div>

                {/* New Users */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Users size={20} className="text-zinc-400" />
                            <h2 className="font-bold text-zinc-900 dark:text-white">New Users</h2>
                        </div>
                        <Link href="/admin/users" className="text-sm text-zinc-500 hover:text-black dark:hover:text-white font-bold flex items-center gap-1 cursor-pointer transition-colors">
                            View All <ChevronRight size={16} />
                        </Link>
                    </div>
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {recentUsers.length > 0 ? recentUsers.map((user) => (
                            <Link key={user.id} href={`/admin/users?id=${user.id}`} className="flex items-center gap-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer">
                                <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-400">
                                    {user.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-zinc-900 dark:text-white truncate">{user.name}</div>
                                    <div className="text-sm text-zinc-500 truncate">{user.email}</div>
                                </div>
                                <div className="text-xs font-medium px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                    {user.role}
                                </div>
                            </Link>
                        )) : (
                            <div className="p-8 text-center text-zinc-500">No users yet.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
