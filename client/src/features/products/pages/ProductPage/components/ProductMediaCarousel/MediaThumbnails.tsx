'use client';

import Image from 'next/image';
import { Film, ImageIcon } from 'lucide-react';
import { ProductMedia } from '@/types/product';
import { resolveImageUrl } from '@/lib/utils/imageUtils';

interface MediaThumbnailsProps {
  allMedia: ProductMedia[];
  currentIndex: number;
  isTransitioning: boolean;
  imageErrors: Set<number>;
  productName: string;
  thumbnailRef: React.RefObject<HTMLDivElement | null>;
  onThumbnailClick: (index: number) => void;
  onImageError: (index: number) => void;
}

export function MediaThumbnails({
  allMedia,
  currentIndex,
  isTransitioning,
  imageErrors,
  productName,
  thumbnailRef,
  onThumbnailClick,
  onImageError,
}: MediaThumbnailsProps) {
  if (allMedia.length <= 1) return null;

  const isValidImageUrl = (url: string) => {
    return url && url.trim() !== '' && !url.includes('undefined') && !url.includes('null');
  };

  return (
    <div className="mt-4">
      <div
        ref={thumbnailRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 px-1"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {allMedia.map((media, index) => {
          const mediaUrl = resolveImageUrl(media.url);
          const isActive = index === currentIndex;
          return (
            <button
              key={media.id || index}
              onClick={() => onThumbnailClick(index)}
              disabled={isTransitioning}
              className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                isActive
                  ? 'border-black dark:border-white scale-105 shadow-lg ring-2 ring-black/20 dark:ring-white/20'
                  : 'border-zinc-300 dark:border-zinc-700 opacity-70 hover:opacity-100 hover:scale-105'
              }`}
              aria-label={`View image ${index + 1}`}
            >
              {media.type === 'image' ? (
                isValidImageUrl(mediaUrl) && !imageErrors.has(index) ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={mediaUrl}
                      alt={`${productName} thumbnail ${index + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                      draggable={false}
                      onError={() => onImageError(index)}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                    <ImageIcon size={20} className="text-zinc-400 dark:text-zinc-500" />
                  </div>
                )
              ) : (
                <div className="w-full h-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                  <Film size={18} className="text-zinc-600 dark:text-zinc-300" />
                </div>
              )}
              {isActive && (
                <div className="absolute inset-0 bg-black/10 dark:bg-white/10" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

