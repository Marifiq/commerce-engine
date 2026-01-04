/**
 * Server-side review service for SSR
 */

import { serverApiFetch } from "@/lib/utils/api-server";
import { Review } from "@/types";

export const reviewServiceServer = {
  /**
   * Get reviews for a specific product (server-side)
   */
  async getProductReviews(productId: number | string): Promise<Review[]> {
    const data = await serverApiFetch(`/products/${productId}/reviews`, {
      cache: 'force-cache',
      next: { revalidate: 60 }, // Revalidate every minute
    });
    return data.data.data;
  },

  /**
   * Get homepage reviews (server-side)
   */
  async getHomepageReviews(): Promise<Review[]> {
    const data = await serverApiFetch("/reviews/homepage", {
      cache: 'force-cache',
      next: { revalidate: 300 }, // Revalidate every 5 minutes
    });
    return data.data.data;
  },
};

