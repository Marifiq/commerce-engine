/**
 * Server-side category service for SSR
 */

import { serverApiFetch } from "@/lib/utils/api-server";
import { Category } from "@/types/category";

export const categoryServiceServer = {
  /**
   * Fetch all categories (server-side)
   */
  async getAllCategories(): Promise<Category[]> {
    const data = await serverApiFetch("/categories", {
      cache: 'force-cache',
      next: { revalidate: 3600 }, // Revalidate every hour (categories don't change often)
    });
    return data.data.data || [];
  },
};

