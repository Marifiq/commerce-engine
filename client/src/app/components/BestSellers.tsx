'use client';

import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import ProductCarousel from './ProductCarousel';
import { productService } from '../../services/productService';
import { Product } from '../../types';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

export default function BestSellers() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const data = await productService.getBestSellers();
                // Limit to 10 items
                setProducts(data.slice(0, 10));
            } catch (error) {
                console.error('Failed to fetch best sellers:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    if (loading) return (
        <div className="bg-zinc-50 py-16 dark:bg-zinc-900/50 text-center">
            <p className="text-zinc-500 font-black uppercase tracking-widest text-xs animate-pulse">Loading best sellers...</p>
        </div>
    );

    return (
        <div className="bg-zinc-50 py-16 sm:py-24 dark:bg-zinc-900/50 overflow-hidden">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12 space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-black dark:text-white">
                        <Sparkles size={12} />
                        Most Wanted
                    </div>
                    <h2 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase italic">
                        Best Sellers
                    </h2>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium max-w-xl mx-auto">
                        Our most popular designs, meticulously crafted and loved by our community worldwide.
                    </p>
                </div>

                <ProductCarousel>
                    {products.map((product) => (
                        <ProductCard key={product.id} {...product} />
                    ))}
                </ProductCarousel>

                <div className="mt-12 text-center">
                    <Link
                        href="/shop"
                        className="inline-flex items-center px-10 py-4 bg-black dark:bg-white text-white dark:text-black rounded-full font-black uppercase tracking-[0.2em] text-[10px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10"
                    >
                        Browse All Items
                    </Link>
                </div>
            </div>
        </div>
    );
}
