'use client';

import { Star } from 'lucide-react';
import { Product } from '@/types/product';
import { Review } from '@/types/review';
import { ReviewList } from './ReviewList';

interface ProductReviewsProps {
  product: Product;
  reviews: Review[];
  onMediaClick: (media: string) => void;
}

export function ProductReviews({ product, reviews, onMediaClick }: ProductReviewsProps) {
  return (
    <div className="mt-16 border-t border-zinc-100 dark:border-zinc-800 pt-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">
            Customer Reviews
          </h2>
          <div className="flex items-center mt-2 text-sm text-zinc-500">
            <div className="flex items-center mr-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${(product.averageRating || 0) > i
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-zinc-300'
                  }`}
                />
              ))}
            </div>
            <span>Based on {product.reviewCount || 0} reviews</span>
          </div>
        </div>
      </div>

      <ReviewList reviews={reviews} onMediaClick={onMediaClick} />
    </div>
  );
}

