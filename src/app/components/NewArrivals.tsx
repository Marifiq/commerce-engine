'use client';

import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import ProductCarousel from './ProductCarousel';
import { productService } from '../../services/productService';
import { Product } from '../../types';
import Link from 'next/link';

export default function NewArrivals() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const data = await productService.getAllProducts('?section=New Arrivals');
                // Limit to 10 items
                setProducts(data.slice(0, 10));
            } catch (error) {
                console.error('Failed to fetch new arrivals:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    if (loading) return (
        <div className="bg-white py-16 dark:bg-black text-center">
            <p className="text-zinc-500 font-black uppercase tracking-widest text-xs animate-pulse">Loading new arrivals...</p>
        </div>
    );

    return (
        <div id="new-arrivals" className="bg-white py-16 sm:py-24 dark:bg-black overflow-hidden">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h2 className="text-3xl font-black tracking-tighter text-black dark:text-white uppercase italic">
                            New Arrivals
                        </h2>
                        <p className="text-zinc-500 font-medium">Fresh drops from our latest collection</p>
                    </div>
                    <Link
                        href="/shop"
                        className="hidden sm:flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-black dark:text-white hover:translate-x-1 transition-transform border-b-2 border-transparent hover:border-black dark:hover:border-white pb-1"
                    >
                        Shop Full Drop <span aria-hidden="true">&rarr;</span>
                    </Link>
                </div>

                <ProductCarousel>
                    {products.map((product) => (
                        <ProductCard key={product.id} {...product} />
                    ))}
                </ProductCarousel>

                <div className="mt-8 sm:hidden">
                    <Link href="/shop" className="text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-black dark:hover:text-white transition-colors">
                        View all products &rarr;
                    </Link>
                </div>
            </div>
        </div>
    );
}
