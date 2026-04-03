'use client';

import { useRef, useEffect, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { Product } from '@/types/product';
import { Category } from '@/types/category';
import { resolveImageUrl } from '@/lib/utils/imageUtils';
import { ProductSearch } from './ProductSearch';
import { ProductList } from './ProductList';

type SortOption = 'name-asc' | 'name-desc' | 'category-asc' | 'category-desc' | 'none';

interface OfferProductSelectorProps {
  products: Product[];
  categories: Category[];
  selectedProductIds: number[];
  onProductToggle: (productId: number) => void;
  onRemoveProduct: (productId: number) => void;
}

export function OfferProductSelector({
  products,
  categories,
  selectedProductIds,
  onProductToggle,
  onRemoveProduct,
}: OfferProductSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortOption, setSortOption] = useState<SortOption>('none');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const getFilteredProducts = () => {
    let filtered = [...products];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((product) => product.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(search) ||
          product.category?.toLowerCase().includes(search)
      );
    }

    // Sort
    if (sortOption !== 'none') {
      filtered = [...filtered].sort((a, b) => {
        switch (sortOption) {
          case 'name-asc':
            return a.name.localeCompare(b.name);
          case 'name-desc':
            return b.name.localeCompare(a.name);
          case 'category-asc':
            return (a.category || '').localeCompare(b.category || '');
          case 'category-desc':
            return (b.category || '').localeCompare(a.category || '');
          default:
            return 0;
        }
      });
    }

    return filtered;
  };

  const filteredProducts = getFilteredProducts();
  const selectedProducts = products.filter((p) => selectedProductIds.includes(p.id));

  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
        Select Products *
      </label>

      {/* Selected Products Display */}
      {selectedProducts.length > 0 && (
        <div className="mb-3 space-y-2">
          {selectedProducts.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800"
            >
              <div className="h-12 w-12 rounded-lg bg-white dark:bg-zinc-800 overflow-hidden flex items-center justify-center shrink-0">
                <img
                  src={resolveImageUrl(product.image)}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-zinc-900 dark:text-white truncate text-sm">
                  {product.name}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                  {product.category || 'N/A'}
                </div>
                <div className="text-xs text-zinc-600 dark:text-zinc-300 mt-0.5">
                  ${product.price.toFixed(2)} • Stock: {product.stock || 0}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemoveProduct(product.id)}
                className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Product Selection Dropdown */}
      <div ref={dropdownRef} className="relative w-full">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none cursor-pointer text-sm font-medium flex items-center gap-3 min-h-[42px]"
        >
          <span className="text-zinc-500">Select products...</span>
          <ChevronDown
            size={16}
            className={`text-zinc-400 shrink-0 transition-transform ml-auto ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl max-h-[500px] overflow-hidden flex flex-col">
            <ProductSearch
              searchTerm={searchTerm}
              selectedCategory={selectedCategory}
              sortOption={sortOption}
              categories={categories}
              onSearchChange={setSearchTerm}
              onCategoryChange={setSelectedCategory}
              onSortChange={setSortOption}
            />

            <ProductList
              products={filteredProducts}
              selectedProductIds={selectedProductIds}
              onToggle={onProductToggle}
            />
          </div>
        )}
      </div>
    </div>
  );
}

