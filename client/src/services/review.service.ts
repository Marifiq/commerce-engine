import { apiFetch } from '@/lib/utils/api';
import { Review } from '@/types/review';
import { API_ENDPOINTS } from '@/lib/constants/api';

export interface CreateReviewData {
  productId: number;
  rating: number;
  text: string;
  images?: string[];
  videos?: string[];
}

export interface UpdateReviewData {
  rating: number;
  text: string;
  images?: string[];
  videos?: string[];
}

export const reviewService = {
  /**
   * Get all reviews with user and product details
   */
  async getAllReviews(): Promise<Review[]> {
    const data = await apiFetch(API_ENDPOINTS.REVIEWS.BASE);
    return data.data.data;
  },

  /**
   * Get homepage reviews (approved, rating > 4, max 5)
   */
  async getHomepageReviews(): Promise<Review[]> {
    const data = await apiFetch(API_ENDPOINTS.REVIEWS.HOMEPAGE);
    return data.data.data;
  },

  /**
   * Get reviews for a specific product
   */
  async getProductReviews(productId: number | string): Promise<Review[]> {
    const data = await apiFetch(API_ENDPOINTS.PRODUCTS.REVIEWS(productId));
    return data.data.data;
  },

  /**
   * Get current user's reviews
   */
  async getMyReviews(): Promise<Review[]> {
    const data = await apiFetch(API_ENDPOINTS.REVIEWS.MY_REVIEWS);
    return data.data.data;
  },

  /**
   * Submit a new review
   */
  async createReview(data: CreateReviewData): Promise<Review> {
    const response = await apiFetch(API_ENDPOINTS.REVIEWS.BASE, {
      method: 'POST',
      body: data,
    });
    return response.data.data;
  },

  /**
   * Update an existing review
   */
  async updateReview(reviewId: number, data: UpdateReviewData): Promise<Review> {
    const response = await apiFetch(API_ENDPOINTS.REVIEWS.BY_ID(reviewId), {
      method: 'PATCH',
      body: data,
    });
    return response.data.data;
  },

  /**
   * Delete a review
   */
  async deleteReview(reviewId: number): Promise<void> {
    await apiFetch(API_ENDPOINTS.REVIEWS.BY_ID(reviewId), {
      method: 'DELETE',
    });
  },
};

