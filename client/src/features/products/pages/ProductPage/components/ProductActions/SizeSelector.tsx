'use client';

import { Product } from '@/types/product';

interface SizeSelectorProps {
  product: Product;
  selectedSize: string | null;
  onSizeSelect: (size: string) => void;
}

export function SizeSelector({ product, selectedSize, onSizeSelect }: SizeSelectorProps) {
  if (!product.sizeEnabled || !product.sizes || product.sizes.length === 0) {
    return null;
  }

  // Filter out sizes with stock <= 0 - only show available sizes
  // Double-check stock is a valid number and greater than 0
  const availableSizes = product.sizes.filter(size => {
    const stock = typeof size.stock === 'number' ? size.stock : 0;
    return stock > 0;
  });

  return (
    <div className="mt-6">
      <label className="text-sm font-medium text-zinc-900 dark:text-white mb-3 block">
        Size
      </label>
      {availableSizes.length === 0 ? (
        <p className="text-sm text-red-600 dark:text-red-400 font-medium">
          All sizes are currently out of stock
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            {availableSizes.map((size) => {
              const isSelected = selectedSize === size.size;
              const stock = typeof size.stock === 'number' ? size.stock : 0;
              return (
                <button
                  key={size.id}
                  onClick={() => {
                    // Double-check stock before allowing selection
                    if (stock > 0) {
                      onSizeSelect(size.size);
                    }
                  }}
                  disabled={stock <= 0}
                  className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    isSelected
                      ? 'border-black dark:border-white bg-black dark:bg-white text-white dark:text-black'
                      : stock > 0
                      ? 'border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white hover:border-black dark:hover:border-white'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed opacity-50'
                  }`}
                >
                  {size.size}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

