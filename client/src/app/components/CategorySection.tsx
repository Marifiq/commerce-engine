'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../utils/api';
import Link from 'next/link';
import { ChevronRight, Shirt, Footprints, Watch, Briefcase, Zap } from 'lucide-react';

const categoryIcons: Record<string, any> = {
    'Shirts': Shirt,
    'Shoes': Footprints,
    'Watches': Watch,
    'Accessories': Briefcase,
    'Electronics': Zap,
};

export default function CategorySection() {
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await apiFetch('/categories');
                setCategories(res.data.data);
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    if (loading || categories.length === 0) return null;

    return (
        <section className="py-16 bg-zinc-50 dark:bg-zinc-900/50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter text-black dark:text-white">
                            Shop by Category
                        </h2>
                        <p className="text-zinc-500 font-medium">Explore our curated collections</p>
                    </div>
                    <Link
                        href="/shop"
                        className="hidden sm:flex items-center gap-2 text-sm font-black uppercase tracking-widest text-black dark:text-white hover:translate-x-1 transition-transform"
                    >
                        View All <ChevronRight size={16} />
                    </Link>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {categories.map((category) => {
                        const Icon = categoryIcons[category] || Shirt;
                        return (
                            <Link
                                key={category}
                                href={`/shop?category=${encodeURIComponent(category)}`}
                                className="group relative p-8 bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white transition-all overflow-hidden"
                            >
                                <div className="relative z-10 flex flex-col items-center gap-4">
                                    <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors">
                                        <Icon size={32} />
                                    </div>
                                    <span className="font-black uppercase tracking-tighter text-lg text-black dark:text-white">
                                        {category}
                                    </span>
                                </div>
                                <div className="absolute -bottom-4 -right-4 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-125 transition-all duration-500">
                                    <Icon size={120} />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
