import { apiFetch } from '@/lib/utils/api';
import { Product } from '@/types/product';
import { getApiBaseUrl } from '@/lib/config/env';
import { API_ENDPOINTS } from '@/lib/constants/api';

export const productService = {
  /**
   * Fetch all products with optional filters
   */
  async getAllProducts(params: string = ''): Promise<Product[]> {
    const data = await apiFetch(`${API_ENDPOINTS.PRODUCTS.BASE}${params}`);
    return data.data.data as Product[];
  },

  /**
   * Fetch best-selling products calculated from orders
   */
  async getBestSellers(): Promise<Product[]> {
    const data = await apiFetch(API_ENDPOINTS.PRODUCTS.BEST_SELLERS);
    return data.data.data as Product[];
  },

  /**
   * Fetch a single product by ID
   */
  async getProduct(id: number | string): Promise<Product> {
    const data = await apiFetch(API_ENDPOINTS.PRODUCTS.BY_ID(id));
    return data.data.data as Product;
  },

  /**
   * Admin: Create a new product (handles multipart image)
   */
  async createProduct(formData: FormData): Promise<Product> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const baseUrl = getApiBaseUrl();

    const response = await fetch(`${baseUrl}${API_ENDPOINTS.PRODUCTS.BASE}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to create product');
    }
    return data.data.data;
  },
};

