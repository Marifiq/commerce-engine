/**
 * Hook for managing shop filter state
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Category } from '@/types/category';

export function useShopFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const initialCategory = searchParams.get('category') || '';
  const section = searchParams.get('section') || '';
  const initialShowOffOnly = searchParams.get('off') === 'true' || section === 'off';

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState(
    section === 'new-arrivals' ? 'newest' : 'newest'
  );
  const [showOffOnly, setShowOffOnly] = useState(initialShowOffOnly);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Update activeCategory and showOffOnly when URL changes
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category') || '';
    const sectionFromUrl = searchParams.get('section') || '';
    const offFromUrl = searchParams.get('off') === 'true' || sectionFromUrl === 'off';
    setActiveCategory(categoryFromUrl);
    setShowOffOnly(offFromUrl);
  }, [searchParams]);

  // Update URL params when filters change
  const updateUrlParams = useCallback(
    (category: string, off: boolean) => {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (off) {
        params.set('off', 'true');
        params.delete('section');
      } else {
        params.delete('off');
      }
      const query = params.toString();
      const newUrl = query ? `${pathname}?${query}` : pathname;
      router.push(newUrl, { scroll: false });
    },
    [router, pathname]
  );

  return {
    activeCategory,
    searchTerm,
    sortBy,
    showOffOnly,
    isFilterOpen,
    section,
    setActiveCategory,
    setSearchTerm,
    setSortBy,
    setShowOffOnly,
    setIsFilterOpen,
    updateUrlParams,
  };
}

