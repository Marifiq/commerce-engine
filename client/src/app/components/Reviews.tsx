'use client';

import { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Star, CheckCircle2, Play, Image as ImageIcon, ChevronRight } from 'lucide-react';
import { reviewService } from '../../services/reviewService';
import { Review } from '../../types';
import MediaViewer from './MediaViewer';
import ReviewsCarouselModal from './ReviewsCarouselModal';
import { formatDate } from '../../utils/dateUtils';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

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

export default function Reviews() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCarouselModalOpen, setIsCarouselModalOpen] = useState(false);
    const [viewerState, setViewerState] = useState<{ isOpen: boolean; media: string; type: 'image' | 'video' }>({
        isOpen: false,
        media: '',
        type: 'image'
    });
    const sectionRef = useRef<HTMLElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLDivElement>(null);
    const transitionLineRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                // Use homepage endpoint which returns only approved reviews with rating > 4, max 5
                const data = await reviewService.getHomepageReviews();
                setReviews(data);
            } catch (error) {
                console.error("Failed to fetch reviews:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReviews();
    }, []);

    useEffect(() => {
        if (!loading && reviews.length > 0 && sectionRef.current) {
            const ctx = gsap.context(() => {
                // Create a smooth entrance animation sequence
                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 90%', // Trigger slightly earlier for smoother transition from BestSellers
                        end: 'top 40%',
                        toggleActions: 'play none none reverse',
                        markers: false
                    }
                });

                // Animate header with smooth fade and slide
                if (headerRef.current) {
                    tl.fromTo(
                        headerRef.current,
                        {
                            y: 80,
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
                        0 // Start immediately
                    );
                }

                // Animate reviews grid with enhanced stagger and scale
                if (gridRef.current) {
                    const reviewCards = Array.from(gridRef.current.children);
                    tl.fromTo(
                        reviewCards,
                        {
                            y: 60,
                            opacity: 0,
                            scale: 0.9,
                            rotationX: 15
                        },
                        {
                            y: 0,
                            opacity: 1,
                            scale: 1,
                            rotationX: 0,
                            duration: 0.9,
                            stagger: {
                                amount: 0.6, // Total stagger duration
                                from: 'start',
                                ease: 'power2.out'
                            },
                            ease: 'back.out(1.2)',
                        },
                        0.3 // Start after header begins
                    );

                    // Add subtle hover effect animation on cards
                    reviewCards.forEach((card, index) => {
                        gsap.set(card, { transformOrigin: 'center center' });
                        const cardElement = card as HTMLElement;
                        
                        cardElement.addEventListener('mouseenter', () => {
                            gsap.to(card, {
                                scale: 1.02,
                                y: -8,
                                duration: 0.4,
                                ease: 'power2.out'
                            });
                        });
                        
                        cardElement.addEventListener('mouseleave', () => {
                            gsap.to(card, {
                                scale: 1,
                                y: 0,
                                duration: 0.4,
                                ease: 'power2.out'
                            });
                        });
                    });
                }

                // Animate button with fade and slide
                if (buttonRef.current) {
                    tl.fromTo(
                        buttonRef.current,
                        {
                            y: 40,
                            opacity: 0,
                            scale: 0.9
                        },
                        {
                            y: 0,
                            opacity: 1,
                            scale: 1,
                            duration: 0.8,
                            ease: 'back.out(1.4)',
                        },
                        0.9 // Start after grid animation
                    );
                }

                // Animate the transition line from BestSellers section
                if (transitionLineRef.current) {
                    tl.fromTo(
                        transitionLineRef.current,
                        {
                            scaleX: 0,
                            opacity: 0,
                        },
                        {
                            scaleX: 1,
                            opacity: 1,
                            duration: 1.2,
                            ease: 'power2.out',
                            transformOrigin: 'left center',
                        },
                        0
                    );
                }

            });

            return () => {
                ctx.revert();
            };
        }
    }, [loading, reviews.length]);

    const handleMediaClick = (media: string) => {
        const type = (media.startsWith('data:video/') || media.toLowerCase().endsWith('.mp4')) ? 'video' : 'image';
        setViewerState({ isOpen: true, media, type: type as 'image' | 'video' });
    };

    if (loading || reviews.length === 0) return null;

    return (
        <section ref={sectionRef} className="bg-white py-24 sm:py-32 dark:bg-black overflow-hidden relative">
            {/* Decorative transition element from BestSellers */}
            <div 
                ref={transitionLineRef}
                className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-800 to-transparent"
            />
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                {/* Section Header */}
                <div ref={headerRef} className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 mb-6">
                            <span className="flex h-2 w-2 rounded-full bg-black dark:bg-white animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
                                Real customer feedback
                            </span>
                        </div>
                        <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-black dark:text-white uppercase italic leading-[0.9]">
                            What Our <br /> Customers Say
                        </h2>
                        <p className="mt-6 text-lg text-zinc-500 dark:text-zinc-400 font-medium max-w-lg">
                            Voices of style. Join over 10,000+ gentlemen who have upgraded their wardrobe with us.
                        </p>
                    </div>
                </div>

                {/* Reviews Grid */}
                <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reviews.map((review, idx) => {
                        const userName = (typeof review.user === 'object' ? review.user?.name : review.user) || "Anonymous User";
                        const userRole = (typeof review.user === 'object' ? review.user?.role : "Gentleman") || "Verified Buyer";
                        const initials = getInitials(userName);
                        const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];

                        return (
                            <div
                                key={review.id}
                                className="group relative flex flex-col justify-between p-8 rounded-[32px] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-900 transition-all duration-500 hover:shadow-2xl hover:shadow-black/5 hover:-translate-y-1"
                            >
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
                                        <p className="text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed mb-6 italic">
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
                                                    className="relative h-16 w-16 rounded-xl overflow-hidden group/img transition-transform active:scale-95"
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
                                                    className="relative h-16 w-16 rounded-xl overflow-hidden bg-black group/vid transition-transform active:scale-95"
                                                >
                                                    <video src={vid} className="h-full w-full object-cover opacity-60" />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 transition-transform group-hover/vid:scale-110">
                                                            <Play size={12} fill="currentColor" />
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
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
                        );
                    })}
                </div>

                <div ref={buttonRef} className="mt-20 text-center">
                    <button 
                        onClick={() => setIsCarouselModalOpen(true)}
                        className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-black dark:text-white border-b-2 border-black dark:border-white pb-2 hover:gap-4 transition-all cursor-pointer"
                    >
                        View All Stories <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            <ReviewsCarouselModal 
                isOpen={isCarouselModalOpen}
                onClose={() => setIsCarouselModalOpen(false)}
            />

            <MediaViewer
                isOpen={viewerState.isOpen}
                onClose={() => setViewerState(prev => ({ ...prev, isOpen: false }))}
                media={viewerState.media}
                mediaType={viewerState.type}
            />
        </section>
    );
}
