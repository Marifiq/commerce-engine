'use client';

import { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Star, CheckCircle2, Play, Image as ImageIcon } from 'lucide-react';
import { reviewService } from '../../services/reviewService';
import { Review } from '../../types';
import MediaViewer from './MediaViewer';
import { formatDate } from '../../utils/dateUtils';

const AVATAR_COLORS = [
    'from-zinc-800 to-zinc-900',
    'from-zinc-700 to-zinc-800',
    'from-zinc-600 to-zinc-700',
    'from-zinc-500 to-zinc-600',
    'from-zinc-900 to-black',
];

function getInitials(name: string) {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
                <Star
                    key={i}
                    size={14}
                    className={`${i < rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-200 dark:text-zinc-700'}`}
                />
            ))}
        </div>
    );
}

interface ReviewsCarouselModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ReviewsCarouselModal({ isOpen, onClose }: ReviewsCarouselModalProps) {
    const [allReviews, setAllReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);
    const [viewerState, setViewerState] = useState<{ isOpen: boolean; media: string; type: 'image' | 'video' }>({
        isOpen: false,
        media: '',
        type: 'image'
    });

    useEffect(() => {
        if (isOpen) {
            fetchAllReviews();
        }
    }, [isOpen]);

    const fetchAllReviews = async () => {
        setLoading(true);
        try {
            // Backend filters to only return approved reviews with rating > 4 for carousel
            const data = await reviewService.getAllReviews();
            // Client-side safety filter: Only show approved reviews with rating > 4 in carousel
            const approvedHighRatedReviews = data.filter(review => 
                review.isApproved === true && review.rating > 4
            );
            setAllReviews(approvedHighRatedReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } catch (error) {
            console.error("Failed to fetch all reviews:", error);
        } finally {
            setLoading(false);
        }
    };

    const checkScroll = () => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setShowLeftArrow(scrollLeft > 10);
        setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
    };

    useEffect(() => {
        if (isOpen && scrollRef.current) {
            checkScroll();
            const scrollElement = scrollRef.current;
            scrollElement.addEventListener('scroll', checkScroll);
            window.addEventListener('resize', checkScroll);
            return () => {
                scrollElement.removeEventListener('scroll', checkScroll);
                window.removeEventListener('resize', checkScroll);
            };
        }
    }, [isOpen, allReviews]);

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollRef.current) return;
        const { clientWidth } = scrollRef.current;
        const scrollAmount = direction === 'left' ? -clientWidth * 0.8 : clientWidth * 0.8;
        scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    };

    const handleMediaClick = (media: string) => {
        const type = (media.startsWith('data:video/') || media.toLowerCase().endsWith('.mp4')) ? 'video' : 'image';
        setViewerState({ isOpen: true, media, type: type as 'image' | 'video' });
    };

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <>
            <div 
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        onClose();
                    }
                }}
            >
                <div 
                    className="relative w-full max-w-7xl max-h-[90vh] bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
                        <div>
                            <h2 className="text-3xl font-black tracking-tighter text-black dark:text-white uppercase italic">
                                All Customer Stories
                            </h2>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                {allReviews.length} reviews from our community
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-zinc-400 hover:text-black dark:hover:text-white transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            aria-label="Close"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content Area - Scrollable */}
                    <div className="flex-1 overflow-y-auto px-6 py-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <p className="text-zinc-500 font-black uppercase tracking-widest text-xs animate-pulse">
                                    Loading all reviews...
                                </p>
                            </div>
                        ) : allReviews.length === 0 ? (
                            <div className="flex items-center justify-center py-20">
                                <p className="text-zinc-400 dark:text-zinc-600">No reviews available.</p>
                            </div>
                        ) : (
                            <div className="relative">
                                {/* Left Gradient Fade */}
                                {showLeftArrow && (
                                    <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-zinc-900 dark:via-zinc-900/80 z-20 pointer-events-none" />
                                )}

                                {/* Right Gradient Fade */}
                                {showRightArrow && (
                                    <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white via-white/80 to-transparent dark:from-zinc-900 dark:via-zinc-900/80 z-20 pointer-events-none" />
                                )}

                                {/* Navigation Buttons */}
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

                                {/* Carousel Container */}
                                <div
                                    ref={scrollRef}
                                    onScroll={checkScroll}
                                    className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-6"
                                    style={{
                                        scrollbarWidth: 'none',
                                        msOverflowStyle: 'none',
                                        WebkitOverflowScrolling: 'touch'
                                    }}
                                >
                                    {allReviews.map((review, idx) => {
                                        const userName = (typeof review.user === 'object' ? review.user?.name : review.user) || "Anonymous User";
                                        const userRole = (typeof review.user === 'object' ? review.user?.role : "Gentleman") || "Verified Buyer";
                                        const initials = getInitials(userName);
                                        const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];

                                        return (
                                            <div
                                                key={review.id}
                                                className="flex-shrink-0 w-[90vw] sm:w-[500px] md:w-[600px] lg:w-[700px] snap-start"
                                            >
                                                <div className="group relative flex flex-col justify-between h-full p-8 rounded-[32px] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-900 transition-all duration-500 hover:shadow-2xl hover:shadow-black/5">
                                                    <div>
                                                        <div className="flex items-center justify-between mb-8">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${avatarColor} flex items-center justify-center text-white font-black text-sm shadow-lg shadow-black/10 transition-transform group-hover:scale-110`}>
                                                                    {initials}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <p className="font-black text-black dark:text-white text-sm uppercase tracking-tight">
                                                                            {userName}
                                                                        </p>
                                                                        <CheckCircle2 size={14} className="text-black dark:text-white" fill="currentColor" fillOpacity={0.1} />
                                                                    </div>
                                                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                                                        {userRole}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <StarRating rating={review.rating} />
                                                        </div>

                                                        <div className="relative">
                                                            <p className="text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed mb-6 italic text-base">
                                                                "{review.text}"
                                                            </p>
                                                        </div>

                                                        {/* Media Gallery */}
                                                        {(review.images?.length || 0) + (review.videos?.length || 0) > 0 && (
                                                            <div className="flex flex-wrap gap-2 mb-6">
                                                                {review.images?.map((img, i) => (
                                                                    <button
                                                                        key={i}
                                                                        onClick={() => handleMediaClick(img)}
                                                                        className="relative h-20 w-20 rounded-xl overflow-hidden group/img transition-transform active:scale-95"
                                                                    >
                                                                        <img src={img} alt="review" className="h-full w-full object-cover transition-transform duration-500 group-hover/img:scale-110" />
                                                                        <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center">
                                                                            <ImageIcon size={16} className="text-white opacity-0 group-hover/img:opacity-100 transition-opacity" />
                                                                        </div>
                                                                    </button>
                                                                ))}
                                                                {review.videos?.map((vid, i) => (
                                                                    <button
                                                                        key={i}
                                                                        onClick={() => handleMediaClick(vid)}
                                                                        className="relative h-20 w-20 rounded-xl overflow-hidden bg-black group/vid transition-transform active:scale-95"
                                                                    >
                                                                        <video src={vid} className="h-full w-full object-cover opacity-60" />
                                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                                            <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 transition-transform group-hover/vid:scale-110">
                                                                                <Play size={12} fill="currentColor" />
                                                                            </div>
                                                                        </div>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {review.product && (
                                                            <div className="mb-6">
                                                                <p className="text-xs text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mb-1">
                                                                    Product
                                                                </p>
                                                                <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                                                                    {typeof review.product === 'object' ? review.product.name : 'Product'}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                                            {formatDate(review.createdAt)}
                                                        </span>
                                                        <div className="h-1 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-full group-hover:w-12 transition-all duration-500" />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <MediaViewer
                isOpen={viewerState.isOpen}
                onClose={() => setViewerState(prev => ({ ...prev, isOpen: false }))}
                media={viewerState.media}
                mediaType={viewerState.type}
            />
        </>
    );
}

