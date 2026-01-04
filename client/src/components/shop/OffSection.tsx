'use client';

import { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ProductCard from './ProductCard';
import ProductCarousel from './ProductCarousel';
import { Product } from '@/types/product';
import Link from 'next/link';
import { apiFetch } from '@/lib/utils/api';
import { Tag } from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function OffSection() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const sectionRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const carouselRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await apiFetch('/products/off');
                const data = res.data.data || [];
                // Limit to 6 items
                setProducts(data.slice(0, 6));
            } catch (error) {
                console.error('Failed to fetch discounted products:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    useEffect(() => {
        if (!loading && products.length > 0 && sectionRef.current) {
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

                // Animate button
                if (buttonRef.current) {
                    gsap.fromTo(
                        buttonRef.current,
                        {
                            y: 30,
                            opacity: 0
                        },
                        {
                            y: 0,
                            opacity: 1,
                            duration: 0.8,
                            ease: 'power3.out',
                            delay: 0.4,
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
    }, [loading, products.length]);

    if (loading) return (
        <div className="bg-white py-16 dark:bg-black text-center">
            <p className="text-zinc-500 font-black uppercase tracking-widest text-xs animate-pulse">Loading special offers...</p>
        </div>
    );

    // Don't show section if no discounted products
    if (products.length === 0) {
        return null;
    }

    return (
        <div ref={sectionRef} id="off" className="bg-white py-16 sm:py-24 dark:bg-black overflow-hidden relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-50/30 via-transparent to-orange-50/20 dark:from-red-950/20 dark:via-transparent dark:to-orange-950/10 pointer-events-none" />
            
            {/* Decorative Elements */}
            <div className="absolute top-20 left-10 w-32 h-32 bg-red-200/20 dark:bg-red-900/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-20 right-10 w-40 h-40 bg-orange-200/20 dark:bg-orange-900/20 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div ref={headerRef} className="text-center mb-12 space-y-6">
                    <div className="inline-flex items-center gap-2.5 px-5 py-2 bg-gradient-to-r from-red-100 to-orange-50 dark:from-red-950 dark:to-orange-950 rounded-full border-2 border-red-200 dark:border-red-900 mb-4 shadow-lg backdrop-blur-sm">
                        <Tag size={14} className="text-red-600 dark:text-red-400 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.35em] text-red-600 dark:text-red-400">
                            Limited Time
                        </span>
                    </div>
                    <h2 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase italic leading-[0.85]">
                        Special <br />
                        <span className="relative inline-block">
                            <span className="bg-gradient-to-r from-red-500 to-orange-500 dark:from-red-400 dark:to-orange-400 bg-clip-text text-transparent">
                                Offers
                            </span>
                            {/* Decorative underline */}
                            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-red-500 to-orange-500 dark:from-red-400 dark:to-orange-400 rounded-full opacity-60" />
                        </span>
                    </h2>
                    <p className="text-zinc-600 dark:text-zinc-300 font-medium text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
                        Exclusive discounts on selected items. Don't miss out on these amazing deals!
                    </p>
                </div>

                <div ref={carouselRef}>
                    <ProductCarousel>
                        {products.map((product) => (
                            <ProductCard key={product.id} {...product} />
                        ))}
                    </ProductCarousel>
                </div>

                <div ref={buttonRef} className="mt-12 text-center">
                    <Link
                        href="/shop?off=true"
                        className="inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 dark:from-red-500 dark:via-orange-400 dark:to-red-500 text-white rounded-full font-black uppercase tracking-[0.2em] text-[10px] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-red-500/20 dark:shadow-red-400/10 cursor-pointer group"
                    >
                        View All Offers
                        <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}

