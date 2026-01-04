'use client';

import { Shield, Truck, RefreshCcw } from 'lucide-react';

export function ProductSpecs() {
  return (
    <div className="mt-12 grid grid-cols-1 gap-6 border-t border-zinc-100 dark:border-zinc-800 pt-8 sm:grid-cols-3">
      <div className="flex flex-col items-center text-center">
        <Truck className="h-6 w-6 mb-2 text-zinc-900 dark:text-white" />
        <span className="text-xs font-medium">Free Shipping</span>
      </div>
      <div className="flex flex-col items-center text-center">
        <Shield className="h-6 w-6 mb-2 text-zinc-900 dark:text-white" />
        <span className="text-xs font-medium">Secure Checkout</span>
      </div>
      <div className="flex flex-col items-center text-center">
        <RefreshCcw className="h-6 w-6 mb-2 text-zinc-900 dark:text-white" />
        <span className="text-xs font-medium">30-Day Returns</span>
      </div>
    </div>
  );
}

