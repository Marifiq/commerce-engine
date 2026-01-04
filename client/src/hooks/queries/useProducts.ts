/**
 * React Query hooks for product data fetching
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/services/product.service';
import { Product } from '@/types/product';
import { API_ENDPOINTS } from '@/lib/constants/api';
import { apiFetch } from '@/lib/utils/api';

// Query keys for consistent cache management
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: string) => [...productKeys.lists(), { filters }] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...productKeys.details(), id] as const,
  bestSellers: () => [...productKeys.all, 'best-sellers'] as const,
  off: () => [...productKeys.all, 'off'] as const,
};

/**
 * Hook to fetch all products with optional filters
 */
export function useProducts(params: string = '') {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => productService.getAllProducts(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single product by ID
 */
export function useProduct(id: string | number) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productService.getProduct(id),
    enabled: !!id, // Only fetch if id is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch best-selling products
 */
export function useBestSellers() {
  return useQuery({
    queryKey: productKeys.bestSellers(),
    queryFn: () => productService.getBestSellers(),
    staleTime: 10 * 60 * 1000, // 10 minutes (best sellers change less frequently)
  });
}

/**
 * Hook to fetch discounted products (off section)
 */
export function useOffProducts() {
  return useQuery({
    queryKey: productKeys.off(),
    queryFn: async () => {
      const res = await apiFetch(API_ENDPOINTS.PRODUCTS.BASE + '/off');
      return res.data.data as Product[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to prefetch a product (useful for hover/focus events)
 */
export function usePrefetchProduct() {
  const queryClient = useQueryClient();
  
  return (id: string | number) => {
    queryClient.prefetchQuery({
      queryKey: productKeys.detail(id),
      queryFn: () => productService.getProduct(id),
      staleTime: 5 * 60 * 1000,
    });
  };
}

