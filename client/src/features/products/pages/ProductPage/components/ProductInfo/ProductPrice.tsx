'use client';

import { Product } from '@/types/product';

interface ProductPriceProps {
  product: Product;
}

export function ProductPrice({ product }: ProductPriceProps) {
  const displayPrice = product.discountedPrice || product.price;
  const showDiscount = product.hasDiscount && product.discountPercent && product.discountPercent > 0;

  return (
    <div className="flex items-center gap-3">
      {showDiscount && product.originalPrice ? (
        <>
          <p className="text-3xl font-bold text-zinc-900 dark:text-white">
            ${displayPrice.toFixed(2)}
          </p>
          <p className="text-lg text-zinc-400 dark:text-zinc-600 line-through font-medium">
            ${product.originalPrice.toFixed(2)}
          </p>
        </>
      ) : (
        <p className="text-3xl font-bold text-zinc-900 dark:text-white">
          ${displayPrice.toFixed(2)}
        </p>
      )}
    </div>
  );
}

