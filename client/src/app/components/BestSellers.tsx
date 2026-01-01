'use client';

import { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ProductCard from './ProductCard';
import ProductCarousel from './ProductCarousel';
import { productService } from '../../services/productService';
import { Product } from '../../types';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function BestSellers() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const sectionRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const carouselRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const data = await productService.getBestSellers();
                // Limit to 6 items (will show 5-6 products)
                setProducts(data.slice(0, 6));
            } catch (error) {
                console.error('Failed to fetch best sellers:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    useEffect(() => {
        if (!loading && sectionRef.current) {
            const ctx = gsap.context(() => {
                // Create a timeline for coordinated animations
                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 85%',
                        toggleActions: 'play none none reverse',
                        markers: false
                    }
                });

                // Animate header with enhanced effects
                if (headerRef.current) {
                    tl.fromTo(
                        headerRef.current,
                        {
                            y: 70,
                            opacity: 0,
                            scale: 0.95
                        },
                        {
                            y: 0,
                            opacity: 1,
                            scale: 1,
                            duration: 1.2,
                            ease: 'power3.out'
                        },
                        0
                    );
                }

                // Animate carousel with smoother entrance
                if (carouselRef.current) {
                    tl.fromTo(
                        carouselRef.current,
                        {
                            y: 50,
                            opacity: 0,
                            scale: 0.98
                        },
                        {
                            y: 0,
                            opacity: 1,
                            scale: 1,
                            duration: 1.1,
                            ease: 'power3.out',
                        },
                        0.25
                    );
                }

                // Animate button
                if (buttonRef.current) {
                    tl.fromTo(
                        buttonRef.current,
                        {
                            y: 35,
                            opacity: 0,
                            scale: 0.9
                        },
                        {
                            y: 0,
                            opacity: 1,
                            scale: 1,
                            duration: 0.9,
                            ease: 'back.out(1.3)',
                        },
                        0.5
                    );
                }

                // Add a fade-out effect as we scroll towards Reviews section
                gsap.to(sectionRef.current, {
                    opacity: 0.95,
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'bottom 80%',
                        end: 'bottom 30%',
                        scrub: 1,
                    }
                });
            });

            return () => {
                ctx.revert();
            };
        }
    }, [loading]);

    if (loading) return (
        <div className="bg-black py-16 text-center">
            <p className="text-zinc-500 font-black uppercase tracking-widest text-xs animate-pulse">Loading best sellers...</p>
        </div>
    );

    return (
        <div ref={sectionRef} id="best-sellers" className="bg-black py-16 sm:py-24 overflow-hidden relative">
            
            <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Centered Header with Unique Styling */}
                <div ref={headerRef} className="text-center mb-12 space-y-6">
                    <div className="inline-flex items-center gap-2.5 px-5 py-2 bg-zinc-900 rounded-full border-2 border-zinc-800 mb-4 shadow-lg backdrop-blur-sm">
                        <Sparkles size={14} className="text-white animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.35em] text-white">
                            Most Wanted
                        </span>
                    </div>
                    <h2 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter text-white uppercase italic leading-[0.85]">
                        Best <br />
                        <span className="relative inline-block">
                            <span className="bg-gradient-to-r from-zinc-400 to-zinc-300 bg-clip-text text-transparent">
                                Sellers
                            </span>
                            {/* Decorative underline */}
                            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-zinc-400 to-zinc-300 rounded-full opacity-60" />
                        </span>
                    </h2>
                    <p className="text-zinc-300 font-medium text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
                        Our most popular designs, meticulously crafted and loved by our community worldwide.
                    </p>
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
                        <p className="text-zinc-400">No best sellers available at the moment.</p>
                    </div>
                )}

                <div ref={buttonRef} className="mt-12 text-center">
                    <Link
                        href="/shop"
                        className="inline-flex items-center gap-3 px-10 py-4 bg-white text-black rounded-full font-black uppercase tracking-[0.2em] text-[10px] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-white/10 cursor-pointer group"
                    >
                        Browse All Items
                        <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
