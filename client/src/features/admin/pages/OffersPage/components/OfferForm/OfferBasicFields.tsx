'use client';

import { OfferFormData } from '../../hooks/useOfferForm';

interface OfferBasicFieldsProps {
  formData: OfferFormData;
  onFieldChange: (field: keyof OfferFormData, value: any) => void;
}

export function OfferBasicFields({ formData, onFieldChange }: OfferBasicFieldsProps) {
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Title *
        </label>
        <input
          type="text"
          required
          className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none"
          value={formData.title}
          onChange={(e) => onFieldChange('title', e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Description
        </label>
        <textarea
          rows={2}
          className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none"
          value={formData.description}
          onChange={(e) => onFieldChange('description', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Discount % *
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            required
            className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none"
            value={formData.discountPercent}
            onChange={(e) =>
              onFieldChange('discountPercent', parseFloat(e.target.value) || 0)
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Target Type *
          </label>
          <select
            required
            className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white cursor-pointer outline-none"
            value={formData.targetType}
            onChange={(e) => onFieldChange('targetType', e.target.value)}
          >
            <option value="all">All Products</option>
            <option value="product">Specific Product</option>
            <option value="category">Category</option>
          </select>
        </div>
      </div>
    </>
  );
}

