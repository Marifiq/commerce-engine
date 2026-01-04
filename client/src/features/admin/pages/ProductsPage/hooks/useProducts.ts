/**
 * Hook for fetching and managing products
 */

import { useState, useEffect } from 'react';
import { Product } from '@/types/product';
import { apiFetch } from '@/lib/utils/api';
import { useToast } from '@/contexts';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchProducts = async () => {
    try {
      const res = await apiFetch('/products');
      setProducts(res.data.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      showToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    refetch: fetchProducts,
  };
}

