'use client';

import { ShoppingBag } from 'lucide-react';
import { Product } from '@/types/product';
import { SizeSelector } from './SizeSelector';

interface ProductActionsProps {
  product: Product;
  selectedSize: string | null;
  onSizeSelect: (size: string) => void;
  onAddToCart: () => void;
  isAddingToCart?: boolean;
}

export function ProductActions({
  product,
  selectedSize,
  onSizeSelect,
  onAddToCart,
  isAddingToCart = false,
}: ProductActionsProps) {
  const isOutOfStock = product.sizeEnabled
    ? (selectedSize
        ? (product.sizes?.find(s => s.size === selectedSize)?.stock || 0) <= 0
        : !product.sizes?.some(s => s.stock > 0))
    : (!product.stock || product.stock <= 0);

  const isDisabled = isOutOfStock || (product.sizeEnabled && !selectedSize) || isAddingToCart;

  const getButtonText = () => {
    if (product.sizeEnabled && !selectedSize) {
      return 'Select a Size';
    }
    if (isOutOfStock) {
      return 'Out of Stock';
    }
    return 'Add to Cart';
  };

  return (
    <>
      <SizeSelector
        product={product}
        selectedSize={selectedSize}
        onSizeSelect={onSizeSelect}
      />

      {/* Stock Status */}
      <div className="mt-6">
        {product.sizeEnabled ? (
          selectedSize ? (
            (() => {
              const selectedSizeData = product.sizes?.find(s => s.size === selectedSize);
              const stock = typeof selectedSizeData?.stock === 'number' ? selectedSizeData.stock : 0;
              return stock > 0 ? (
                <p className="text-sm text-black dark:text-white font-medium">
                  {stock} in stock for size {selectedSize}
                </p>
              ) : (
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                  Size {selectedSize} is out of stock
                </p>
              );
            })()
          ) : (() => {
            const hasAvailableSizes = product.sizes?.some(s => {
              const stock = typeof s.stock === 'number' ? s.stock : 0;
              return stock > 0;
            });
            return hasAvailableSizes ? (
              <p className="text-sm text-black dark:text-white font-medium">
                Select a size to see availability
              </p>
            ) : (
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                This product is out of stock
              </p>
            );
          })()
        ) : (() => {
          const stock = typeof product.stock === 'number' ? product.stock : 0;
          return stock > 0 ? (
            <p className="text-sm text-black dark:text-white font-medium">
              {stock} in stock
            </p>
          ) : (
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">
              This product is out of stock
            </p>
          );
        })()}
      </div>

      <div className="mt-10">
        <button
          onClick={onAddToCart}
          disabled={isDisabled}
          className="flex w-full items-center justify-center rounded-xl bg-black px-8 py-4 text-base font-medium text-white hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-all transform active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <ShoppingBag className="mr-3 h-5 w-5" />
          {getButtonText()}
        </button>
      </div>
    </>
  );
}

