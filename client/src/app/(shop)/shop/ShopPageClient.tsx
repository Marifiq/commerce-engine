'use client';

import { useEffect, useRef, lazy, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Category } from '@/types/category';
import { Product } from '@/types/product';
import { gsap } from 'gsap';
import { ShopHeader } from '@/features/products/pages/ShopPage/components/ShopHeader';
import { ShopFilters } from '@/features/products/pages/ShopPage/components/ShopFilters';
import { ShopProductGrid } from '@/features/products/pages/ShopPage/components/ShopProductGrid';
import { useShopFilters } from '@/features/products/pages/ShopPage/hooks/useShopFilters';
import { useShopProducts } from '@/features/products/pages/ShopPage/hooks/useShopProducts';
import { LoadingSpinner } from '@/components/ui';

interface ShopPageClientProps {
  initialCategories: Category[];
  initialProducts?: Product[];
  section?: string;
}

export function ShopPageClient({ 
  initialCategories, 
  initialProducts,
  section: initialSection 
}: ShopPageClientProps) {
  const searchParams = useSearchParams();
  const section = searchParams.get('section') || initialSection || '';
  const headerRef = useRef<HTMLDivElement>(null);

  const {
    activeCategory,
    searchTerm,
    sortBy,
    showOffOnly,
    isFilterOpen,
    setActiveCategory,
    setSearchTerm,
    setSortBy,
    setShowOffOnly,
    setIsFilterOpen,
    updateUrlParams,
  } = useShopFilters();

  const { products, loading } = useShopProducts(
    activeCategory,
    sortBy,
    showOffOnly,
    section,
    initialProducts
  );

  // Register GSAP plugins
  useEffect(() => {
    if (typeof window !== 'undefined') {
      gsap.registerPlugin(require('gsap/ScrollTrigger').ScrollTrigger);
    }
  }, []);

  // Header animation
  useEffect(() => {
    if (!headerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current,
        {
          opacity: 0,
          y: -30,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
        }
      );
    }, headerRef);

    return () => ctx.revert();
  }, []);

  const handleCategorySelect = (category: string) => {
    setActiveCategory(category);
    updateUrlParams(category, showOffOnly);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
  };

  const handleOffersToggle = (value: boolean) => {
    setShowOffOnly(value);
    updateUrlParams(activeCategory, value);
  };

  const handleClearFilters = () => {
    setActiveCategory('');
    setSearchTerm('');
    setShowOffOnly(false);
    updateUrlParams('', false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black pt-24 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div ref={headerRef}>
          <ShopHeader
            section={section}
            activeCategory={activeCategory}
            showOffOnly={showOffOnly}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onFilterToggle={() => setIsFilterOpen(!isFilterOpen)}
            isFilterOpen={isFilterOpen}
          />
        </div>

        <div className="flex gap-8 relative">
          <ShopFilters
            categories={initialCategories}
            activeCategory={activeCategory}
            sortBy={sortBy}
            showOffOnly={showOffOnly}
            section={section}
            isFilterOpen={isFilterOpen}
            onCategorySelect={handleCategorySelect}
            onSortChange={handleSortChange}
            onOffersToggle={handleOffersToggle}
            onClose={() => setIsFilterOpen(false)}
          />

          <main className="flex-1">
            <ShopProductGrid
              products={products}
              loading={loading}
              searchTerm={searchTerm}
              section={section}
              onClearFilters={handleClearFilters}
            />
          </main>
        </div>
      </div>
    </div>
  );
}

