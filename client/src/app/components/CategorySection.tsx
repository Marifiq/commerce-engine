'use client';

import { useEffect, useState, useRef } from 'react';
import { apiFetch } from '../../utils/api';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, Shirt, ArrowRight } from 'lucide-react';
import { Category } from '../../types';
import { resolveImageUrl } from '../../utils/imageUtils';

export default function CategorySection() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);
    const [progressWidth, setProgressWidth] = useState(0);
    const [progressOffset, setProgressOffset] = useState(0);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await apiFetch('/categories');
                setCategories(res.data.data || []);
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    const checkScroll = () => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setShowLeftArrow(scrollLeft > 10);
        setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
        
        // Calculate progress indicator
        if (scrollWidth > clientWidth) {
            const visibleRatio = clientWidth / scrollWidth;
            const maxScroll = scrollWidth - clientWidth;
            const scrollRatio = maxScroll > 0 ? scrollLeft / maxScroll : 0;
            
            setProgressWidth(visibleRatio * 100);
            setProgressOffset(scrollRatio * (100 - visibleRatio * 100));
        } else {
            setProgressWidth(100);
            setProgressOffset(0);
        }
    };

    useEffect(() => {
        checkScroll();
        const scrollElement = scrollRef.current;
        if (scrollElement) {
            scrollElement.addEventListener('scroll', checkScroll);
            window.addEventListener('resize', checkScroll);
            return () => {
                scrollElement.removeEventListener('scroll', checkScroll);
                window.removeEventListener('resize', checkScroll);
            };
        }
    }, [categories]);

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollRef.current) return;
        const { clientWidth } = scrollRef.current;
        const scrollAmount = direction === 'left' ? -clientWidth * 0.8 : clientWidth * 0.8;
        scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    };

    if (loading || categories.length === 0) return null;

    return (
        <section className="relative py-20 sm:py-24 bg-white dark:bg-black overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-50/50 via-transparent to-transparent dark:from-zinc-900/30 pointer-events-none" />
            
            <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-800 mb-4">
                            <span className="flex h-2 w-2 rounded-full bg-black dark:bg-white animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-black dark:text-white">
                                Collections
                            </span>
                        </div>
                        <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter text-black dark:text-white uppercase italic leading-[0.9] mb-4">
                            Shop by <br className="hidden sm:block" />
                            <span className="text-zinc-400 dark:text-zinc-600">Category</span>
                        </h2>
                        <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg">
                            Explore our curated collections crafted for every style and occasion
                        </p>
                    </div>
                    <Link
                        href="/shop"
                        className="group flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10 cursor-pointer self-start md:self-auto"
                    >
                        View All
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {/* Modern Carousel Container */}
                <div className="relative group">
                    {/* Gradient Fade Effects */}
                    {showLeftArrow && (
                        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white via-white/90 to-transparent dark:from-black dark:via-black/90 z-20 pointer-events-none" />
                    )}

                    {showRightArrow && (
                        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white via-white/90 to-transparent dark:from-black dark:via-black/90 z-20 pointer-events-none" />
                    )}

                    {/* Navigation Buttons */}
                    {showLeftArrow && (
                        <button
                            onClick={() => scroll('left')}
                            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-4 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-full shadow-2xl border border-zinc-200/50 dark:border-zinc-700/50 hover:scale-110 hover:bg-white dark:hover:bg-zinc-800 active:scale-95 transition-all duration-200 text-black dark:text-white cursor-pointer hidden md:flex items-center justify-center group/btn"
                            aria-label="Scroll left"
                        >
                            <ChevronLeft size={22} strokeWidth={2.5} className="group-hover/btn:-translate-x-1 transition-transform" />
                        </button>
                    )}

                    {showRightArrow && (
                        <button
                            onClick={() => scroll('right')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-4 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-full shadow-2xl border border-zinc-200/50 dark:border-zinc-700/50 hover:scale-110 hover:bg-white dark:hover:bg-zinc-800 active:scale-95 transition-all duration-200 text-black dark:text-white cursor-pointer hidden md:flex items-center justify-center group/btn"
                            aria-label="Scroll right"
                        >
                            <ChevronRight size={22} strokeWidth={2.5} className="group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    )}

                    {/* Scroll Container */}
                    <div
                        ref={scrollRef}
                        onScroll={checkScroll}
                        className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-8 pt-2 -mx-4 px-4"
                        style={{ 
                            scrollbarWidth: 'none', 
                            msOverflowStyle: 'none',
                            WebkitOverflowScrolling: 'touch'
                        }}
                    >
                        {categories.map((category) => {
                            const imageUrl = category.image ? resolveImageUrl(category.image) : null;
                            return (
                                <Link
                                    key={category.id}
                                    href={`/shop?category=${encodeURIComponent(category.name)}`}
                                    className="group relative flex-shrink-0 w-[280px] sm:w-[320px] md:w-[360px] snap-start"
                                >
                                    <div className="relative h-full bg-white dark:bg-zinc-900 rounded-3xl border-2 border-zinc-200 dark:border-zinc-800 overflow-hidden transition-all duration-500 hover:border-black dark:hover:border-white hover:shadow-2xl hover:shadow-black/20 dark:hover:shadow-white/10 hover:scale-[1.02]">
                                        {/* Image Container */}
                                        <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                                            {imageUrl ? (
                                                <>
                                                    <img
                                                        src={imageUrl}
                                                        alt={category.name}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                    />
                                                    {/* Gradient Overlay */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900">
                                                    <Shirt size={64} className="text-zinc-400 dark:text-zinc-600 group-hover:text-black dark:group-hover:text-white transition-colors duration-500" />
                                                </div>
                                            )}
                                            
                                            {/* Hover Effect Overlay */}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 dark:group-hover:bg-white/10 transition-all duration-500" />
                                        </div>

                                        {/* Content */}
                                        <div className="relative p-6 bg-white dark:bg-zinc-900">
                                            <div className="flex items-center justify-between gap-4">
                                                <h3 className="text-xl font-black uppercase tracking-tighter text-black dark:text-white group-hover:translate-x-1 transition-transform duration-300">
                                                    {category.name}
                                                </h3>
                                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-black dark:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                                                    <ArrowRight size={18} className="text-white dark:text-black" />
                                                </div>
                                            </div>
                                            <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 delay-75">
                                                <span className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                                                    Explore
                                                </span>
                                                <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                                            </div>
                                        </div>

                                        {/* Decorative Corner */}
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-transparent via-transparent to-black/5 dark:to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Modern Progress Indicator */}
                    {categories.length > 0 && (
                        <div className="mt-8 flex items-center justify-center">
                            <div className="h-1.5 w-full max-w-md bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden relative">
                                <div
                                    className="h-full bg-gradient-to-r from-black to-zinc-700 dark:from-white dark:to-zinc-300 rounded-full transition-all duration-300 ease-out shadow-sm"
                                    style={{
                                        width: `${progressWidth}%`,
                                        transform: `translateX(${progressOffset}%)`
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
