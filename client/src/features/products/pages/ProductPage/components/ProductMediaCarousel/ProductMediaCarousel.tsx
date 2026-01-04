'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ImageIcon, Film } from 'lucide-react';
import { Product, ProductMedia } from '@/types/product';
import { resolveImageUrl } from '@/lib/utils/imageUtils';
import { MediaThumbnails } from './MediaThumbnails';

interface ProductMediaCarouselProps {
  product: Product;
  allMedia: ProductMedia[];
  currentMediaIndex: number;
  isTransitioning: boolean;
  imageErrors: Set<number>;
  thumbnailRef: React.RefObject<HTMLDivElement | null>;
  onNext: () => void;
  onPrev: () => void;
  onThumbnailClick: (index: number) => void;
  onMediaClick: (media: string) => void;
  onImageError: (index?: number) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

export function ProductMediaCarousel({
  product,
  allMedia,
  currentMediaIndex,
  isTransitioning,
  imageErrors,
  thumbnailRef,
  onNext,
  onPrev,
  onThumbnailClick,
  onMediaClick,
  onImageError,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}: ProductMediaCarouselProps) {
  const carouselRef = useRef<HTMLDivElement>(null);

  const isValidImageUrl = (url: string) => {
    return url && url.trim() !== '' && !url.includes('undefined') && !url.includes('null');
  };

  // Use primary image or first media or fallback to product.image
  const primaryImage = allMedia.length > 0
    ? (allMedia.find(m => m.isPrimary && m.type === 'image') || allMedia.find(m => m.type === 'image') || allMedia[0])
    : null;
  const imageUrl = primaryImage
    ? resolveImageUrl(primaryImage.url)
    : (product.image ? resolveImageUrl(product.image) : '');

  const hasValidMedia = allMedia.length > 0;
  const hasValidImage = imageUrl && imageUrl.trim() !== '';
  const showNoImageIcon = !hasValidMedia && !hasValidImage;

  const currentMedia = allMedia.length > 0 && currentMediaIndex < allMedia.length
    ? allMedia[currentMediaIndex]
    : (primaryImage || (product.image ? { url: product.image, type: 'image' as const } : null));
  const currentMediaUrl = currentMedia ? resolveImageUrl(currentMedia.url) : '';

  const renderMediaContent = () => {
    if (allMedia.length > 1) {
      return (
        <>
          <div className="relative h-full w-full">
            {allMedia.map((media, index) => {
              const mediaUrl = resolveImageUrl(media.url);
              const isActive = index === currentMediaIndex;
              const hasError = imageErrors.has(index);
              const isValidUrl = isValidImageUrl(mediaUrl);
              return (
                <div
                  key={media.id || index}
                  className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                    isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                >
                  {media.type === 'image' ? (
                    hasError || !isValidUrl ? (
                      <div className="h-full w-full flex items-center justify-center bg-zinc-200 dark:bg-zinc-700">
                        <div className="flex flex-col items-center gap-3 text-zinc-400 dark:text-zinc-500">
                          <ImageIcon size={64} className="opacity-60" />
                          <span className="text-sm font-medium uppercase tracking-wider">No Image</span>
                        </div>
                      </div>
                    ) : (
                      <div className="relative h-full w-full">
                        <Image
                          src={mediaUrl}
                          alt={`${product.name} ${index + 1}`}
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          className="object-cover object-center cursor-pointer select-none"
                          onClick={() => onMediaClick(mediaUrl)}
                          onError={() => onImageError(index)}
                          draggable={false}
                        />
                      </div>
                    )
                  ) : (
                    <video
                      src={mediaUrl}
                      controls
                      className="h-full w-full object-cover object-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
              );
            })}

            {/* Navigation arrows */}
            <button
              onClick={onPrev}
              disabled={isTransitioning}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/95 dark:bg-zinc-800/95 backdrop-blur-md rounded-full shadow-xl hover:bg-white dark:hover:bg-zinc-700 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
              aria-label="Previous media"
            >
              <ChevronLeft size={24} className="text-zinc-900 dark:text-white group-hover:text-black dark:group-hover:text-white" />
            </button>
            <button
              onClick={onNext}
              disabled={isTransitioning}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/95 dark:bg-zinc-800/95 backdrop-blur-md rounded-full shadow-xl hover:bg-white dark:hover:bg-zinc-700 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
              aria-label="Next media"
            >
              <ChevronRight size={24} className="text-zinc-900 dark:text-white group-hover:text-black dark:group-hover:text-white" />
            </button>

            {/* Image counter */}
            <div className="absolute top-4 right-4 z-20 px-3 py-1.5 bg-black/60 dark:bg-white/60 backdrop-blur-md rounded-full text-white dark:text-black text-xs font-medium">
              {currentMediaIndex + 1} / {allMedia.length}
            </div>
          </div>
        </>
      );
    }

    if (showNoImageIcon || !isValidImageUrl(currentMediaUrl)) {
      return (
        <div className="h-full w-full flex items-center justify-center bg-zinc-200 dark:bg-zinc-700">
          <div className="flex flex-col items-center gap-4 text-zinc-400 dark:text-zinc-500">
            <ImageIcon size={80} className="opacity-60" />
            <span className="text-base font-medium uppercase tracking-wider">No Image Available</span>
            <span className="text-sm text-zinc-500 dark:text-zinc-400">{product.name}</span>
          </div>
        </div>
      );
    }

    if (currentMedia && currentMedia.type === 'image') {
      return (
        <div className="relative h-full w-full">
          <Image
            src={currentMediaUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-center cursor-pointer"
            onClick={() => onMediaClick(currentMediaUrl)}
            onError={() => onImageError()}
          />
        </div>
      );
    }

    if (currentMedia && currentMedia.type === 'video') {
      return (
        <video
          src={currentMediaUrl}
          controls
          className="h-full w-full object-cover object-center"
        >
          Your browser does not support the video tag.
        </video>
      );
    }

    return (
      <div className="h-full w-full flex items-center justify-center bg-zinc-200 dark:bg-zinc-700">
        <div className="flex flex-col items-center gap-4 text-zinc-400 dark:text-zinc-500">
          <ImageIcon size={80} className="opacity-60" />
          <span className="text-base font-medium uppercase tracking-wider">No Image Available</span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">{product.name}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full">
      <div
        ref={carouselRef}
        className="relative aspect-square w-full overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900 shadow-lg"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {renderMediaContent()}
      </div>

      <MediaThumbnails
        allMedia={allMedia}
        currentIndex={currentMediaIndex}
        isTransitioning={isTransitioning}
        imageErrors={imageErrors}
        productName={product.name}
        thumbnailRef={thumbnailRef}
        onThumbnailClick={onThumbnailClick}
        onImageError={onImageError}
      />
    </div>
  );
}

