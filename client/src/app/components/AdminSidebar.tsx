'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ShoppingBag,
    Users,
    ClipboardList,
    MessageSquare,
    LogOut,
    Home,
    X,
    Menu,
    ShoppingCart
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logout } from '../../redux/features/userSlice';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const menuItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Products', href: '/admin/products', icon: ShoppingBag },
    { name: 'Orders', href: '/admin/orders', icon: ClipboardList },
    { name: 'Abandoned Carts', href: '/admin/abandoned-carts', icon: ShoppingCart },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Reviews', href: '/admin/reviews', icon: MessageSquare },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const dispatch = useDispatch();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    const handleLogout = () => {
        dispatch(logout());
        router.push('/login');
    };

    return (
        <>
            {/* Mobile Header/Toggle */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 z-40">
                <h1 className="text-xl font-black uppercase tracking-tighter text-black dark:text-white">
                    Admin
                </h1>
                <button
                    onClick={() => setIsOpen(true)}
                    className="p-2 text-zinc-500 hover:text-black dark:hover:text-white cursor-pointer"
                >
                    <Menu size={24} />
                </button>
            </div>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed left-0 top-0 h-screen w-72 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <h1 className="text-xl font-black uppercase tracking-tighter text-black dark:text-white">
                        Admin Panel
                    </h1>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="lg:hidden p-2 text-zinc-500 hover:text-black dark:hover:text-white cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer ${isActive
                                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-lg shadow-black/10'
                                    : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-black dark:hover:text-white font-medium'
                                    }`}
                            >
                                <item.icon size={20} />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
                    <div className="px-4 py-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                        <p className="text-xs font-semibold text-zinc-500 mb-3 uppercase tracking-wider">Switch View</p>
                        <Link
                            href="/"
                            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-bold shadow-sm hover:shadow-md transition-all text-zinc-900 dark:text-white"
                        >
                            <Home size={16} />
                            <span>Back to Shop</span>
                        </Link>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all cursor-pointer font-bold"
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
