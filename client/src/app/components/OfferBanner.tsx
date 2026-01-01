'use client';

import { useEffect, useState } from 'react';
import { X, Tag, ArrowRight, Clock } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { Offer } from '../../types';
import Link from 'next/link';

// Countdown timer component
function CountdownTimer({ endDate }: { endDate: string }) {
    const [timeLeft, setTimeLeft] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
    } | null>(null);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const end = new Date(endDate).getTime();
            const difference = end - now;

            if (difference <= 0) {
                setTimeLeft(null);
                return;
            }

            setTimeLeft({
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((difference % (1000 * 60)) / 1000),
            });
        };

        calculateTimeLeft();
        const interval = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(interval);
    }, [endDate]);

    if (!timeLeft) return null;

    return (
        <div className="flex items-center gap-1.5 text-xs font-black text-white">
            <span className="font-mono tabular-nums">
                {timeLeft.days > 0 && (
                    <span className="px-1.5 py-0.5 bg-white/20 rounded">{timeLeft.days}d</span>
                )}
                <span className="px-1.5 py-0.5 bg-white/20 rounded mx-0.5">
                    {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-white/60">:</span>
                <span className="px-1.5 py-0.5 bg-white/20 rounded mx-0.5">
                    {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-white/60">:</span>
                <span className="px-1.5 py-0.5 bg-white/20 rounded mx-0.5">
                    {String(timeLeft.seconds).padStart(2, '0')}
                </span>
            </span>
        </div>
    );
}

export default function OfferBanner() {
    const [offer, setOffer] = useState<Offer | null>(null);
    const [isVisible, setIsVisible] = useState(true);
    const [isDismissed, setIsDismissed] = useState(false);
    const [loading, setLoading] = useState(true);

    // Load dismissed banner from localStorage on mount
    useEffect(() => {
        const dismissedBannerId = localStorage.getItem('dismissedBannerId');
        if (dismissedBannerId) {
            setIsDismissed(true);
        }
    }, []);

    useEffect(() => {
        const fetchBanner = async () => {
            try {
                const res = await apiFetch('/offers/active');
                const fetchedOffers = res.data.data || [];
                // Only show the first (and only) banner
                const activeBanner = fetchedOffers[0] || null;
                
                // Check if this banner was dismissed
                const dismissedBannerId = localStorage.getItem('dismissedBannerId');
                if (dismissedBannerId && activeBanner && String(activeBanner.id) === dismissedBannerId) {
                    setIsDismissed(true);
                } else {
                    setIsDismissed(false);
                }
                
                setOffer(activeBanner);
            } catch (error: any) {
                console.error('Failed to fetch active banner:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBanner();

        // Refresh banner every 30 seconds
        const interval = setInterval(fetchBanner, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleDismiss = () => {
        if (offer) {
            localStorage.setItem('dismissedBannerId', String(offer.id));
            setIsDismissed(true);
            setIsVisible(false);
        }
    };

    // Update header position when banner visibility changes
    useEffect(() => {
        const header = document.getElementById('main-header');
        if (header) {
            if (isVisible && offer && !isDismissed && !loading) {
                header.style.top = '56px';
                header.style.transition = 'top 0.3s ease';
            } else {
                header.style.top = '0';
                header.style.transition = 'top 0.3s ease';
            }
        }
    }, [isVisible, offer, isDismissed, loading]);

    // Clear dismissed banner if offer changes
    useEffect(() => {
        if (offer) {
            const dismissedBannerId = localStorage.getItem('dismissedBannerId');
            // If a new banner is set, clear old dismissals
            if (dismissedBannerId && String(offer.id) !== dismissedBannerId) {
                localStorage.removeItem('dismissedBannerId');
                setIsDismissed(false);
            }
        }
    }, [offer]);

    // Don't render if loading, dismissed, or no offer
    if (loading || !isVisible || !offer || isDismissed) {
        return null;
    }

    return (
        <div className="fixed top-0 left-0 right-0 z-[60] overflow-hidden">
            {/* Modern gradient background with animation */}
            <div className="relative bg-gradient-to-r from-red-600 via-orange-500 to-red-600 dark:from-red-700 dark:via-orange-600 dark:to-red-700 h-14">
                {/* Animated background pattern */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.1)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-slide"></div>
                </div>
                
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                
                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-full">
                    <div className="flex items-center justify-between h-full gap-4">
                        {/* Left side - Offer info */}
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            {/* Icon badge */}
                            <div className="flex-shrink-0 relative">
                                <div className="absolute inset-0 bg-white/30 rounded-full blur-md animate-pulse"></div>
                                <div className="relative bg-white/20 backdrop-blur-sm rounded-full p-2 border border-white/30">
                                    <Tag size={20} className="text-white" />
                                </div>
                            </div>
                            
                            {/* Offer text */}
                            <div className="flex items-center gap-3 flex-1 min-w-0 flex-wrap">
                                <span className="font-black uppercase tracking-wider text-base sm:text-lg text-white drop-shadow-lg">
                                    {offer.title}
                                </span>
                                
                                {/* Discount badge */}
                                <span className="px-3 py-1 bg-white/25 backdrop-blur-sm rounded-full text-xs sm:text-sm font-black text-white border border-white/30 shadow-lg">
                                    {offer.discountPercent}% OFF
                                </span>
                                
                                {/* Countdown timer */}
                                {offer.endDate && (
                                    <div className="flex items-center gap-2 px-3 py-1 bg-black/20 backdrop-blur-sm rounded-full border border-white/20">
                                        <Clock size={14} className="text-white" />
                                        <CountdownTimer endDate={offer.endDate} />
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Right side - Actions */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <Link
                                href="/shop?off=true"
                                className="group flex items-center gap-2 px-5 py-2 bg-white text-red-600 rounded-full text-xs font-black uppercase tracking-wider transition-all hover:scale-105 hover:shadow-xl cursor-pointer whitespace-nowrap"
                            >
                                <span>Shop Now</span>
                                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <button
                                onClick={handleDismiss}
                                className="p-2 hover:bg-white/20 rounded-full transition-all cursor-pointer group"
                                aria-label="Dismiss banner"
                                title="Dismiss banner"
                            >
                                <X size={18} className="text-white group-hover:rotate-90 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

