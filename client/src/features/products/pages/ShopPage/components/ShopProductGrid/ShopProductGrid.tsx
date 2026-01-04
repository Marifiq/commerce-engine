'use client';

import { Product } from '@/types/product';
import { ProductGrid } from './ProductGrid';
import { EmptyState } from './EmptyState';
import { ShopLoadingState } from '../ShopLoadingState';

interface ShopProductGridProps {
  products: Product[];
  loading: boolean;
  searchTerm: string;
  section: string;
  onClearFilters?: () => void;
}

export function ShopProductGrid({
  products,
  loading,
  searchTerm,
  section,
  onClearFilters,
}: ShopProductGridProps) {
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <ShopLoadingState />;
  }

  if (filteredProducts.length === 0) {
    return <EmptyState section={section} onClearFilters={onClearFilters} />;
  }

  return <ProductGrid products={filteredProducts} searchTerm={searchTerm} />;
}

