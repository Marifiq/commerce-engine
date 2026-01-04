'use client';

import { Star, Film, ExternalLink } from 'lucide-react';
import { Review } from '@/types/review';

interface ReviewListProps {
  reviews: Review[];
  onMediaClick: (media: string) => void;
}

export function ReviewList({ reviews, onMediaClick }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <p className="text-zinc-500">
        No reviews yet for this product. Be the first to share your thoughts!
      </p>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="border-b border-zinc-50 dark:border-zinc-900 pb-8 last:border-0"
        >
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center">
              {[0, 1, 2, 3, 4].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${review.rating > star
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-zinc-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-zinc-900 dark:text-white">
              {(typeof review.user === 'object' && review.user?.name) ||
                'Verified Buyer'}
            </span>
            <span className="text-xs text-zinc-500">
              {new Date(review.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed italic mb-4">
            &quot;{review.text}&quot;
          </p>

          {/* Media Display */}
          {((review.images?.length || 0) + (review.videos?.length || 0) > 0) && (
            <div className="flex flex-wrap gap-3">
              {review.images?.map((img, idx) => (
                <button
                  key={`img-${idx}`}
                  onClick={() => onMediaClick(img)}
                  className="relative h-16 w-16 rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden group cursor-pointer hover:border-black dark:hover:border-white transition-all shadow-sm focus:outline-none"
                >
                  <img
                    src={img}
                    alt="review"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
                    <ExternalLink
                      size={14}
                      className="text-white opacity-0 group-hover:opacity-100"
                    />
                  </div>
                </button>
              ))}
              {review.videos?.map((vid, idx) => (
                <button
                  key={`vid-${idx}`}
                  onClick={() => onMediaClick(vid)}
                  className="relative h-16 w-16 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center group cursor-pointer hover:border-black dark:hover:border-white transition-all shadow-sm focus:outline-none"
                >
                  <Film
                    size={20}
                    className="text-zinc-400 group-hover:text-black dark:group-hover:text-white"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
                    <ExternalLink
                      size={14}
                      className="text-white opacity-0 group-hover:opacity-100"
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

