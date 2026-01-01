import { apiFetch } from "../utils/api";

import { Product } from "../types";


export const productService = {
  /**
   * Fetch all products with optional filters
   */
  async getAllProducts(params: string = "") {
    const data = await apiFetch(`/products${params}`);
    return data.data.data as Product[];
  },

  /**
   * Fetch best-selling products calculated from orders
   */
  async getBestSellers() {
    const data = await apiFetch(`/products/best-sellers`);
    return data.data.data as Product[];
  },

  /**
   * Fetch a single product by ID
   */
  async getProduct(id: number | string) {
    const data = await apiFetch(`/products/${id}`);
    return data.data.data as Product;
  },

  /**
   * Admin: Create a new product (handles multipart image)
   */
  async createProduct(formData: FormData) {
    const token = localStorage.getItem("token");

    // Use the same logic as apiFetch to ensure versioned path
    let baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";
    if (!baseUrl.includes('/api/v1')) baseUrl = `${baseUrl}/api/v1`;
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

    const response = await fetch(`${baseUrl}/products`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to create product");
    return data.data.data;
  },
};
