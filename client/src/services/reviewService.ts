import { apiFetch } from "../utils/api";
import { Review } from "../types";

export const reviewService = {
  /**
   * Get all reviews with user and product details
   */
  async getAllReviews(): Promise<Review[]> {
    const data = await apiFetch("/reviews");
    return data.data.data;
  },

  /**
   * Get homepage reviews (approved, rating > 4, max 5)
   */
  async getHomepageReviews(): Promise<Review[]> {
    const data = await apiFetch("/reviews/homepage");
    return data.data.data;
  },

  /**
   * Get reviews for a specific product
   */
  async getProductReviews(productId: number | string): Promise<Review[]> {
    const data = await apiFetch(`/products/${productId}/reviews`);
    return data.data.data;
  },

  /**
   * Get current user's reviews
   */
  async getMyReviews(): Promise<Review[]> {
    const data = await apiFetch("/reviews/my-reviews");
    return data.data.data;
  },

  /**
   * Submit a new review
   */
  async createReview(data: { productId: number; rating: number; text: string; images?: string[]; videos?: string[] }) {
    const response = await apiFetch("/reviews", {
      method: "POST",
      body: data,
    });
    return response.data.data;
  },

  /**
   * Update an existing review
   */
  async updateReview(reviewId: number, data: { rating: number; text: string; images?: string[]; videos?: string[] }) {
    const response = await apiFetch(`/reviews/${reviewId}`, {
      method: "PATCH",
      body: data,
    });
    return response.data.data;
  },

  /**
   * Delete a review
   */
  async deleteReview(reviewId: number) {
    await apiFetch(`/reviews/${reviewId}`, {
      method: "DELETE",
    });
  },
};
