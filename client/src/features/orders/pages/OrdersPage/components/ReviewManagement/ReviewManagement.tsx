'use client';

import { Star, Edit2, Trash2, Film, ExternalLink } from 'lucide-react';
import { Review } from '@/types/review';

interface ReviewManagementProps {
  review: Review;
  productId: number;
  productName: string;
  productImage: string;
  onEdit: () => void;
  onDelete: () => void;
  onMediaClick: (media: string) => void;
}

export function ReviewManagement({
  review,
  onEdit,
  onDelete,
  onMediaClick,
}: ReviewManagementProps) {
  return (
    <div className="mt-4 ml-20 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="flex">
            {[0, 1, 2, 3, 4].map((star) => (
              <Star
                key={star}
                className={`h-3 w-3 ${
                  review.rating > star ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-300'
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">
            Your Review
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-all cursor-pointer"
            title="Edit review"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all cursor-pointer"
            title="Delete review"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 italic mb-4">
        &quot;{review.text}&quot;
      </p>

      {/* Media Display */}
      {((review.images?.length || 0) + (review.videos?.length || 0) > 0) && (
        <div className="flex flex-wrap gap-2">
          {review.images?.map((img, idx) => (
            <button
              key={`img-${idx}`}
              onClick={() => onMediaClick(img)}
              className="relative h-12 w-12 rounded-lg border border-zinc-100 dark:border-zinc-800 overflow-hidden group cursor-pointer hover:border-black dark:hover:border-white transition-all shadow-sm focus:outline-none"
            >
              <img src={img} alt="review" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
                <ExternalLink size={12} className="text-white opacity-0 group-hover:opacity-100" />
              </div>
            </button>
          ))}
          {review.videos?.map((vid, idx) => (
            <button
              key={`vid-${idx}`}
              onClick={() => onMediaClick(vid)}
              className="relative h-12 w-12 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center group cursor-pointer hover:border-black dark:hover:border-white transition-all shadow-sm focus:outline-none"
            >
              <Film size={16} className="text-zinc-400 group-hover:text-black dark:group-hover:text-white" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
                <ExternalLink size={12} className="text-white opacity-0 group-hover:opacity-100" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

