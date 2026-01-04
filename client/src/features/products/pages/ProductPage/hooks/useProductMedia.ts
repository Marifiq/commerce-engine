/**
 * Hook for managing product media carousel
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ProductMedia } from '@/types/product';

export function useProductMedia(media: ProductMedia[] | undefined) {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const thumbnailRef = useRef<HTMLDivElement | null>(null);

  // Get all media sorted by order, with primary first
  const allMedia = useMemo(() => {
    if (!media || media.length === 0) return [];
    return [...media].sort((a, b) => {
      if (a.isPrimary) return -1;
      if (b.isPrimary) return 1;
      return a.order - b.order;
    });
  }, [media]);

  // Initialize currentMediaIndex when product changes
  useEffect(() => {
    if (allMedia.length > 0) {
      const primaryIndex = allMedia.findIndex(m => m.isPrimary);
      setCurrentMediaIndex(primaryIndex >= 0 ? primaryIndex : 0);
    } else {
      setCurrentMediaIndex(0);
    }
    setImageErrors(new Set());
  }, [allMedia]);

  // Carousel navigation handlers
  const handleNextMedia = useCallback(() => {
    if (allMedia.length > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentMediaIndex((prev) => (prev + 1) % allMedia.length);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  }, [allMedia.length, isTransitioning]);

  const handlePrevMedia = useCallback(() => {
    if (allMedia.length > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentMediaIndex((prev) => (prev - 1 + allMedia.length) % allMedia.length);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  }, [allMedia.length, isTransitioning]);

  const handleSetMediaIndex = useCallback((index: number) => {
    if (!isTransitioning && index >= 0 && index < allMedia.length) {
      setIsTransitioning(true);
      setCurrentMediaIndex(index);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  }, [allMedia.length, isTransitioning]);

  // Touch handlers for swipe gestures
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNextMedia();
    }
    if (isRightSwipe) {
      handlePrevMedia();
    }
  }, [touchStart, touchEnd, handleNextMedia, handlePrevMedia]);

  // Scroll thumbnail into view when current index changes
  useEffect(() => {
    if (thumbnailRef.current && allMedia.length > 0) {
      const thumbnail = thumbnailRef.current.children[currentMediaIndex] as HTMLElement;
      if (thumbnail) {
        thumbnail.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [currentMediaIndex, allMedia.length]);

  // Handle image error
  const handleImageError = useCallback((index?: number) => {
    if (index !== undefined) {
      setImageErrors((prev) => new Set(prev).add(index));
    }
  }, []);

  return {
    allMedia,
    currentMediaIndex,
    isTransitioning,
    imageErrors,
    thumbnailRef,
    handleNextMedia,
    handlePrevMedia,
    handleSetMediaIndex,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleImageError,
  };
}

