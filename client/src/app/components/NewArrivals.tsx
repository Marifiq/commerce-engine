'use client';

import { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ProductCard from './ProductCard';
import ProductCarousel from './ProductCarousel';
import { productService } from '../../services/productService';
import { Product } from '../../types';
import Link from 'next/link';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function NewArrivals() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const sectionRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const carouselRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Fetch newest products sorted by ID (descending) - newest first
                const data = await productService.getAllProducts('?sort=-id&limit=10');
                // Ensure we have at least 3 products, but show up to 10
                if (data.length > 0) {
                    setProducts(data.slice(0, 10));
                } else {
                    // Fallback: if no products, try getting any products
                    const allData = await productService.getAllProducts('?sort=-id');
                    setProducts(allData.slice(0, 10));
                }
            } catch (error) {
                console.error('Failed to fetch new arrivals:', error);
                // Try fallback fetch without sort
                try {
                    const fallbackData = await productService.getAllProducts('?limit=10');
                    setProducts(fallbackData.slice(0, 10));
                } catch (fallbackError) {
                    console.error('Fallback fetch also failed:', fallbackError);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    useEffect(() => {
        if (!loading && sectionRef.current) {
            const ctx = gsap.context(() => {
                // Animate header
                if (headerRef.current) {
                    gsap.fromTo(
                        headerRef.current,
                        {
                            y: 60,
                            opacity: 0
                        },
                        {
                            y: 0,
                            opacity: 1,
                            duration: 1,
                            ease: 'power3.out',
                            scrollTrigger: {
                                trigger: sectionRef.current,
                                start: 'top 85%',
                                toggleActions: 'play none none reverse'
                            }
                        }
                    );
                }

                // Animate carousel
                if (carouselRef.current) {
                    gsap.fromTo(
                        carouselRef.current,
                        {
                            y: 40,
                            opacity: 0
                        },
                        {
                            y: 0,
                            opacity: 1,
                            duration: 1,
                            ease: 'power3.out',
                            delay: 0.2,
                            scrollTrigger: {
                                trigger: sectionRef.current,
                                start: 'top 85%',
                                toggleActions: 'play none none reverse'
                            }
                        }
                    );
                }
            });

            return () => {
                ctx.revert();
            };
        }
    }, [loading]);

    if (loading) return (
        <div className="bg-white py-16 dark:bg-black text-center">
            <p className="text-zinc-500 font-black uppercase tracking-widest text-xs animate-pulse">Loading new arrivals...</p>
        </div>
    );

    return (
        <div ref={sectionRef} id="new-arrivals" className="bg-white py-16 sm:py-24 dark:bg-black overflow-hidden relative">
            {/* Unique Background Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--tw-gradient-stops))] from-zinc-100/40 via-transparent to-transparent dark:from-zinc-900/40 pointer-events-none" />
            
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Centered Header */}
                <div ref={headerRef} className="text-center mb-12 space-y-6">
                    <div className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-800 rounded-full border-2 border-zinc-200 dark:border-zinc-700 mb-4 shadow-sm">
                        <span className="flex h-2.5 w-2.5 rounded-full bg-gradient-to-r from-black to-zinc-700 dark:from-white dark:to-zinc-300 animate-pulse shadow-sm" />
                        <span className="text-[10px] font-black uppercase tracking-[0.35em] text-black dark:text-white">
                            Latest Collection
                        </span>
                    </div>
                    <h2 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter text-black dark:text-white uppercase italic leading-[0.85]">
                        New <br />
                        <span className="bg-gradient-to-r from-zinc-400 to-zinc-600 dark:from-zinc-500 dark:to-zinc-300 bg-clip-text text-transparent">
                            Arrivals
                        </span>
                    </h2>
                    <p className="text-zinc-600 dark:text-zinc-300 font-medium text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
                        Fresh drops from our latest collection. Discover what's new and trending.
                    </p>
                    <Link
                        href="/shop?section=new-arrivals"
                        className="inline-flex items-center gap-3 px-8 py-3.5 bg-gradient-to-r from-black to-zinc-800 dark:from-white dark:to-zinc-200 text-white dark:text-black rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-black/20 dark:shadow-white/10 cursor-pointer group"
                    >
                        Shop Full Drop
                        <span className="group-hover:translate-x-1 transition-transform inline-block text-base">→</span>
                    </Link>
                </div>

                {products.length > 0 ? (
                    <div ref={carouselRef}>
                        <ProductCarousel>
                            {products.map((product) => (
                                <ProductCard key={product.id} {...product} />
                            ))}
                        </ProductCarousel>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-zinc-400 dark:text-zinc-600">No new arrivals at the moment.</p>
                    </div>
                )}

                <div className="mt-8 sm:hidden text-center">
                    <Link 
                        href="/shop?section=new-arrivals" 
                        className="text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-black dark:hover:text-white transition-colors inline-flex items-center gap-1"
                    >
                        View all products <span>&rarr;</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
