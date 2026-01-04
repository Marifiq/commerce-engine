/**
 * React Query hooks for category data fetching
 */

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/utils/api';
import { Category } from '@/types/category';
import { API_ENDPOINTS } from '@/lib/constants/api';

// Query keys for consistent cache management
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: () => [...categoryKeys.lists()] as const,
};

/**
 * Hook to fetch all categories
 */
export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: async () => {
      const res = await apiFetch(API_ENDPOINTS.CATEGORIES.BASE);
      return res.data.data as Category[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (categories change infrequently)
  });
}

