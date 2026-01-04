"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAppDispatch } from "@/hooks/useRedux";
import { addItemToCart } from "@/store/features/cart";
import { useToast } from "@/contexts";
import { LoadingSpinner } from "@/components/ui";
import {
  useProductMedia,
} from "@/features/products/pages/ProductPage/hooks";
import { ProductMediaCarousel } from "@/features/products/pages/ProductPage/components/ProductMediaCarousel";
import { ProductInfo } from "@/features/products/pages/ProductPage/components/ProductInfo";
import { ProductActions } from "@/features/products/pages/ProductPage/components/ProductActions";
import { ProductSpecs } from "@/features/products/pages/ProductPage/components/ProductSpecs";
import { ProductReviews } from "@/features/products/pages/ProductPage/components/ProductReviews";
import { Product, Review } from "@/types";

// Lazy load heavy modal components
const MediaViewer = lazy(() => 
  import("@/components/modals").then(module => ({ default: module.MediaViewer }))
);

interface ProductPageClientProps {
  product: Product;
  reviews: Review[];
}

export function ProductPageClient({ product, reviews }: ProductPageClientProps) {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Clear selected size if it becomes unavailable
  const handleSizeSelect = (size: string) => {
    const sizeData = product.sizes?.find(s => s.size === size);
    if (sizeData && sizeData.stock > 0) {
      setSelectedSize(size);
    } else {
      setSelectedSize(null);
      showToast("This size is out of stock", "error");
    }
  };

  // Clear selected size if it becomes unavailable when product data updates
  useEffect(() => {
    if (selectedSize && product.sizeEnabled && product.sizes) {
      const selectedSizeData = product.sizes.find(s => s.size === selectedSize);
      if (!selectedSizeData || selectedSizeData.stock <= 0) {
        setSelectedSize(null);
      }
    }
  }, [product.sizes, selectedSize, product.sizeEnabled]);
  const [viewerState, setViewerState] = useState<{
    isOpen: boolean;
    media: string;
    type: "image" | "video";
  }>({
    isOpen: false,
    media: "",
    type: "image",
  });

  const {
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
  } = useProductMedia(product?.media);

  const handleAddToCart = async () => {
    if (!product) return;

    if (product.sizeEnabled && !selectedSize) {
      showToast("Please select a size", "error");
      return;
    }

    // Check stock before adding
    if (product.sizeEnabled && selectedSize) {
      const selectedSizeData = product.sizes?.find(s => s.size === selectedSize);
      if (!selectedSizeData || selectedSizeData.stock <= 0) {
        showToast("This size is out of stock", "error");
        setSelectedSize(null);
        return;
      }
    } else if (!product.sizeEnabled && (!product.stock || product.stock <= 0)) {
      showToast("This product is out of stock", "error");
      return;
    }

    setIsAddingToCart(true);
    try {
      await dispatch(
        addItemToCart({ product, quantity: 1, size: selectedSize || undefined })
      ).unwrap();
      showToast("Product added to cart", "success");
      setSelectedSize(null);
    } catch (error: unknown) {
      const errorMessage =
        typeof error === "string"
          ? error
          : error instanceof Error
          ? error.message
          : "Failed to add product to cart";
      showToast(errorMessage, "error");
      // If stock error, clear selected size
      if (errorMessage.includes("stock") || errorMessage.includes("Stock")) {
        setSelectedSize(null);
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleMediaClick = (media: string) => {
    const type =
      media.startsWith("data:video/") || media.toLowerCase().endsWith(".mp4")
        ? "video"
        : "image";
    setViewerState({
      isOpen: true,
      media,
      type: type as "image" | "video",
    });
  };

  // Check if product is completely out of stock
  const isCompletelyOutOfStock = product.sizeEnabled
    ? !product.sizes?.some(s => s.stock > 0)
    : (!product.stock || product.stock <= 0);

  return (
    <>
      <div className="bg-white dark:bg-black min-h-screen pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-zinc-500 hover:text-black mb-8 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to collection
          </Link>

          {/* Out of Stock Banner */}
          {isCompletelyOutOfStock && (
            <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 px-6 py-4">
              <p className="text-base font-bold text-red-800 dark:text-red-200">
                ⚠️ This product is currently out of stock
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                We're sorry, but this item is not available for purchase at this time.
              </p>
            </div>
          )}

          <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
            {/* Media gallery */}
            <ProductMediaCarousel
              product={product}
              allMedia={allMedia}
              currentMediaIndex={currentMediaIndex}
              isTransitioning={isTransitioning}
              imageErrors={imageErrors}
              thumbnailRef={thumbnailRef}
              onNext={handleNextMedia}
              onPrev={handlePrevMedia}
              onThumbnailClick={handleSetMediaIndex}
              onMediaClick={handleMediaClick}
              onImageError={handleImageError}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />

            {/* Product info */}
            <div>
              <ProductInfo product={product} />

              <ProductActions
                product={product}
                selectedSize={selectedSize}
                onSizeSelect={handleSizeSelect}
                onAddToCart={handleAddToCart}
                isAddingToCart={isAddingToCart}
              />

              <ProductSpecs />
            </div>
          </div>

          {/* Reviews Section */}
          <ProductReviews
            product={product}
            reviews={reviews}
            onMediaClick={handleMediaClick}
          />
        </div>

        <Suspense fallback={null}>
          <MediaViewer
            isOpen={viewerState.isOpen}
            onClose={() => setViewerState((prev) => ({ ...prev, isOpen: false }))}
            media={viewerState.media}
            mediaType={viewerState.type}
          />
        </Suspense>
      </div>
    </>
  );
}

