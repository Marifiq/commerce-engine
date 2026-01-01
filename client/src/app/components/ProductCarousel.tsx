'use client';

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductCarouselProps {
    children: React.ReactNode[];
}

export default function ProductCarousel({ children }: ProductCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);
    const [progressWidth, setProgressWidth] = useState(0);
    const [progressOffset, setProgressOffset] = useState(0);

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
    }, [children]);

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollRef.current) return;
        const { clientWidth } = scrollRef.current;
        const scrollAmount = direction === 'left' ? -clientWidth * 0.8 : clientWidth * 0.8;
        scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    };

    return (
        <div className="relative group">
            {/* Left Gradient Fade */}
            {showLeftArrow && (
                <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-black dark:via-black/80 z-20 pointer-events-none" />
            )}

            {/* Right Gradient Fade */}
            {showRightArrow && (
                <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white via-white/80 to-transparent dark:from-black dark:via-black/80 z-20 pointer-events-none" />
            )}

            {/* Navigation Buttons - Always visible on desktop, hidden on mobile */}
            {showLeftArrow && (
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm rounded-full shadow-2xl border border-zinc-200/50 dark:border-zinc-700/50 hover:scale-110 hover:bg-white dark:hover:bg-zinc-800 active:scale-95 transition-all duration-200 text-black dark:text-white cursor-pointer hidden md:flex items-center justify-center group/btn"
                    aria-label="Scroll left"
                >
                    <ChevronLeft size={20} strokeWidth={2.5} className="group-hover/btn:-translate-x-0.5 transition-transform" />
                </button>
            )}

            {showRightArrow && (
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm rounded-full shadow-2xl border border-zinc-200/50 dark:border-zinc-700/50 hover:scale-110 hover:bg-white dark:hover:bg-zinc-800 active:scale-95 transition-all duration-200 text-black dark:text-white cursor-pointer hidden md:flex items-center justify-center group/btn"
                    aria-label="Scroll right"
                >
                    <ChevronRight size={20} strokeWidth={2.5} className="group-hover/btn:translate-x-0.5 transition-transform" />
                </button>
            )}

            {/* Scroll Container */}
            <div
                ref={scrollRef}
                onScroll={checkScroll}
                className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-6 pt-2 px-2 sm:px-4"
                style={{ 
                    scrollbarWidth: 'none', 
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch'
                }}
            >
                {children.map((child, index) => (
                    <div
                        key={index}
                        className="flex-shrink-0 w-[280px] sm:w-[320px] md:w-[calc(33.333%-16px)] lg:w-[calc(25%-18px)] snap-start transition-transform duration-300 hover:scale-[1.02] h-full"
                    >
                        {child}
                    </div>
                ))}
            </div>

            {/* Modern Progress Indicator */}
            {children.length > 0 && (
                <div className="mt-6 flex items-center justify-center gap-2">
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
    );
}
