/**
 * Hook for fetching and managing categories
 */

import { useState, useEffect } from 'react';
import { Category } from '@/types/category';
import { apiFetch } from '@/lib/utils/api';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryDiscounts, setCategoryDiscounts] = useState<Record<string, number>>({});

  const fetchCategories = async () => {
    try {
      const res = await apiFetch('/categories');
      const cats = res.data.data || [];
      setCategories(cats);
      // Initialize category discounts from fetched data
      const discountMap: Record<string, number> = {};
      cats.forEach((cat: Category) => {
        if (cat.discountPercent) {
          discountMap[cat.name] = cat.discountPercent;
        }
      });
      setCategoryDiscounts(discountMap);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    categoryDiscounts,
    setCategoryDiscounts,
    refetch: fetchCategories,
  };
}

