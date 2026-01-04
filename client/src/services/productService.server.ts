/**
 * Server-side product service for SSR
 */

import { serverApiFetch } from "@/lib/utils/api-server";
import { Product } from "@/types";

export const productServiceServer = {
  /**
   * Fetch all products with optional filters (server-side)
   */
  async getAllProducts(params: string = "") {
    const data = await serverApiFetch(`/products${params}`, {
      cache: 'force-cache', // Cache for 60 seconds
      next: { revalidate: 60 },
    });
    return data.data.data as Product[];
  },

  /**
   * Fetch best-selling products (server-side)
   */
  async getBestSellers() {
    const data = await serverApiFetch(`/products/best-sellers`, {
      cache: 'force-cache',
      next: { revalidate: 300 }, // Revalidate every 5 minutes
    });
    return data.data.data as Product[];
  },

  /**
   * Fetch a single product by ID (server-side)
   */
  async getProduct(id: number | string) {
    const data = await serverApiFetch(`/products/${id}`, {
      cache: 'force-cache',
      next: { revalidate: 300 }, // Revalidate every 5 minutes
    });
    return data.data.data as Product;
  },
};

