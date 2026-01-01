'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { reviewService } from '../../services/reviewService';
import { Review } from '../../types';

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
                <Star
                    key={i}
                    className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-300'
                        }`}
                />
            ))}
        </div>
    );
}

export default function Reviews() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const data = await reviewService.getAllReviews();
                setReviews(data);
            } catch (error) {
                console.error("Failed to fetch reviews:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReviews();
    }, []);

    if (loading) return null;
    if (reviews.length === 0) return null;

    return (
        <div className="bg-white py-24 sm:py-32 dark:bg-black">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-white">
                        What Our Customers Say
                    </h2>
                    <p className="mt-2 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
                        Trusted by gentlemen of style worldwide.
                    </p>
                </div>
                <div className="mx-auto mt-16 flow-root max-w-2xl sm:mt-20 lg:mx-0 lg:max-w-none">
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {reviews.map((review) => (
                            <div key={review.id} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-8 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
                                <div className="flex items-center gap-x-4">
                                    <div className="text-sm leading-6">
                                        <p className="font-semibold text-zinc-900 dark:text-white">
                                            {review.user?.name || "Verified Customer"}
                                        </p>
                                        <p className="text-zinc-600 dark:text-zinc-400">{review.user?.role || "Gentleman"}</p>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <StarRating rating={review.rating} />
                                </div>
                                <p className="mt-4 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                                    "{review.text}"
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
