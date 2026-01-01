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

    const checkScroll = () => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setShowLeftArrow(scrollLeft > 0);
        setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 1);
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [children]);

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollRef.current) return;
        const { clientWidth } = scrollRef.current;
        const scrollAmount = direction === 'left' ? -clientWidth : clientWidth;
        scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    };

    return (
        <div className="relative group">
            {/* Navigation Buttons */}
            {showLeftArrow && (
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-30 p-4 bg-white dark:bg-zinc-900 rounded-full shadow-xl border border-zinc-200 dark:border-zinc-800 hover:scale-110 active:scale-95 transition-all text-black dark:text-white cursor-pointer opacity-0 group-hover:opacity-100 hidden md:flex"
                >
                    <ChevronLeft size={24} strokeWidth={3} />
                </button>
            )}

            {showRightArrow && (
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-30 p-4 bg-white dark:bg-zinc-900 rounded-full shadow-xl border border-zinc-200 dark:border-zinc-800 hover:scale-110 active:scale-95 transition-all text-black dark:text-white cursor-pointer opacity-0 group-hover:opacity-100 hidden md:flex"
                >
                    <ChevronRight size={24} strokeWidth={3} />
                </button>
            )}

            {/* Scroll Container */}
            <div
                ref={scrollRef}
                onScroll={checkScroll}
                className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-8 pt-4 px-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {children.map((child, index) => (
                    <div
                        key={index}
                        className="flex-shrink-0 w-[85%] sm:w-[45%] lg:w-[calc(25%-18px)] snap-start"
                    >
                        {child}
                    </div>
                ))}
            </div>

            {/* Pagination Line / Progress */}
            <div className="mt-4 h-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                    className="h-full bg-black dark:bg-white transition-all duration-300"
                    style={{
                        width: `${scrollRef.current ? (scrollRef.current.clientWidth / scrollRef.current.scrollWidth) * 100 : 25}%`,
                        transform: `translateX(${scrollRef.current ? (scrollRef.current.scrollLeft / scrollRef.current.scrollWidth) * 100 : 0}%)`
                    }}
                />
            </div>
        </div>
    );
}
