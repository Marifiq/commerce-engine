/**
 * Hook for fetching and managing shop products with React Query caching
 */

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Product } from '@/types/product';
import { productService } from '@/services/product.service';
import { apiFetch } from '@/lib/utils/api';
import { productKeys } from '@/hooks/queries/useProducts';

export function useShopProducts(
  activeCategory: string,
  sortBy: string,
  showOffOnly: boolean,
  section: string,
  initialProducts?: Product[]
) {
  const searchParams = useSearchParams();
  const currentSection = searchParams.get('section') || section || '';

  // Build query key and function based on filters
  const { queryKey, queryFn } = useMemo(() => {
    // Handle off section (discounted products)
    if (currentSection === 'off' || showOffOnly) {
      return {
        queryKey: [...productKeys.off(), { category: activeCategory }],
        queryFn: async () => {
          const res = await apiFetch('/products/off');
          const data = res.data.data || [];
          return activeCategory
            ? data.filter((p: Product) => p.category === activeCategory)
            : data;
        },
      };
    }

    // Handle best sellers section
    if (currentSection === 'best-sellers') {
      return {
        queryKey: [...productKeys.bestSellers(), { category: activeCategory }],
        queryFn: async () => {
          const data = await productService.getBestSellers();
          return activeCategory
            ? data.filter((p) => p.category === activeCategory)
            : data;
        },
      };
    }

    // Handle new arrivals and regular shop
    const params = new URLSearchParams();
    if (activeCategory) {
      params.append('category', activeCategory);
    }
    if (currentSection === 'new-arrivals') {
      params.append('sort', '-id');
    } else {
      switch (sortBy) {
        case 'price-low':
          params.append('sort', 'price');
          break;
        case 'price-high':
          params.append('sort', '-price');
          break;
        case 'newest':
        default:
          params.append('sort', '-id');
          break;
      }
    }

    const query = params.toString() ? `?${params.toString()}` : '';
    return {
      queryKey: productKeys.list(query),
      queryFn: () => productService.getAllProducts(query),
    };
  }, [activeCategory, sortBy, currentSection, showOffOnly]);

  const { data: products = initialProducts || [], isLoading: loading, refetch } = useQuery({
    queryKey,
    queryFn,
    staleTime: 5 * 60 * 1000, // 5 minutes
    initialData: initialProducts, // Use initial data if provided (from SSR)
  });

  return {
    products: products || [],
    loading,
    refetch,
  };
}

