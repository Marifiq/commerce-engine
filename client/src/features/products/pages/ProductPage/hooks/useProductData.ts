/**
 * Hook for fetching product data
 */

import { useState, useEffect } from 'react';
import { Product, Review } from '@/types';
import { productService } from '@/services/product.service';
import { reviewService } from '@/services/review.service';

export function useProductData(productId: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchProductData = async () => {
    try {
      const [productData, reviewsData] = await Promise.all([
        productService.getProduct(productId),
        reviewService.getProductReviews(productId),
      ]);
      setProduct(productData);
      setReviews(reviewsData);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Product not found';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const refetchReviews = async () => {
    try {
      const reviewsData = await reviewService.getProductReviews(productId);
      setReviews(reviewsData);
    } catch (err) {
      console.error('Failed to refetch reviews', err);
    }
  };

  useEffect(() => {
    fetchProductData();
  }, [productId]);

  return {
    product,
    reviews,
    loading,
    error,
    refetchReviews,
  };
}

