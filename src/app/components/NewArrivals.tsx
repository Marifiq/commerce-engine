'use client';

import { useEffect, useState } from 'react';

import ProductCard from './ProductCard';
import { productService } from '../../services/productService';
import { Product } from '../../types';

export default function NewArrivals() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const data = await productService.getAllProducts('?section=New Arrivals');
                setProducts(data);
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
            <p className="text-zinc-500">Loading new arrivals...</p>
        </div>
    );

    return (
        <div id="new-arrivals" className="bg-white py-16 sm:py-24 dark:bg-black">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="md:flex md:items-center md:justify-between">
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">New Arrivals</h2>
                    <a href="#" className="hidden text-sm font-medium text-zinc-600 hover:text-black md:block dark:text-zinc-400 dark:hover:text-white cursor-pointer transition-colors">
                        Shop the collection
                        <span aria-hidden="true"> &rarr;</span>
                    </a>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
                    {products.map((product) => (
                        <ProductCard key={product.id} {...product} />
                    ))}
                </div>


                <div className="mt-8 md:hidden">
                    <a href="#" className="text-sm font-medium text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-white">
                        Shop the collection
                        <span aria-hidden="true"> &rarr;</span>
                    </a>
                </div>
            </div>
        </div>
    );
}
