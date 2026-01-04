/**
 * React Query (TanStack Query) configuration
 * Provides caching and data synchronization for API calls
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes (good for development)
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Cache data for 10 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      // Retry failed requests once
      retry: 1,
      // Refetch on window focus in development only
      refetchOnWindowFocus: process.env.NODE_ENV === 'development',
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
      // Don't refetch on reconnect if data is fresh
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});

