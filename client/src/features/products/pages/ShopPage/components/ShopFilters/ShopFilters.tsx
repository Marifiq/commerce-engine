'use client';

import { X, Filter } from 'lucide-react';
import { Category } from '@/types/category';
import { CategoryFilter } from './CategoryFilter';
import { SortFilter } from './SortFilter';
import { OffersFilter } from './OffersFilter';

interface ShopFiltersProps {
  categories: Category[];
  activeCategory: string;
  sortBy: string;
  showOffOnly: boolean;
  section: string;
  isFilterOpen: boolean;
  onCategorySelect: (category: string) => void;
  onSortChange: (sort: string) => void;
  onOffersToggle: (value: boolean) => void;
  onClose: () => void;
}

export function ShopFilters({
  categories,
  activeCategory,
  sortBy,
  showOffOnly,
  section,
  isFilterOpen,
  onCategorySelect,
  onSortChange,
  onOffersToggle,
  onClose,
}: ShopFiltersProps) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 flex-shrink-0 space-y-12 sticky top-28 self-start">
        <CategoryFilter
          categories={categories}
          activeCategory={activeCategory}
          onCategorySelect={onCategorySelect}
        />

        {section !== 'new-arrivals' && section !== 'best-sellers' && (
          <OffersFilter
            showOffOnly={showOffOnly}
            onToggle={onOffersToggle}
          />
        )}

        {section !== 'best-sellers' && (
          <SortFilter
            sortBy={sortBy}
            onSortChange={onSortChange}
            disabled={section === 'new-arrivals'}
          />
        )}
      </aside>

      {/* Mobile Filter Drawer */}
      <div
        className={`fixed inset-0 z-[100] transition-all duration-500 md:hidden ${
          isFilterOpen ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <div
          className={`absolute bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 rounded-t-[40px] p-8 shadow-2xl transition-transform duration-500 ${
            isFilterOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-black dark:text-white">
              Filters
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-8">
            <CategoryFilter
              categories={categories}
              activeCategory={activeCategory}
              onCategorySelect={(cat) => {
                onCategorySelect(cat);
                onClose();
              }}
              variant="mobile"
            />

            {section !== 'new-arrivals' && section !== 'best-sellers' && (
              <OffersFilter
                showOffOnly={showOffOnly}
                onToggle={(value) => {
                  onOffersToggle(value);
                  onClose();
                }}
                variant="mobile"
              />
            )}

            {section !== 'best-sellers' && (
              <SortFilter
                sortBy={sortBy}
                onSortChange={(sort) => {
                  onSortChange(sort);
                  onClose();
                }}
                disabled={section === 'new-arrivals'}
                variant="mobile"
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

