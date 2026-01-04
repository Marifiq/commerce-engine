'use client';

import { X } from 'lucide-react';
import { Category } from '@/types/category';
import { OfferFormData } from '../../hooks/useOfferForm';
import { OfferBasicFields } from './OfferBasicFields';
import { OfferDateFields } from './OfferDateFields';
import { OfferProductSelector } from '../OfferProductSelector';
import { LoadingSpinner } from '@/components/ui';

interface OfferFormProps {
  isOpen: boolean;
  editingOffer: any;
  formData: OfferFormData;
  products: any[];
  categories: Category[];
  selectedProductIds: number[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFieldChange: (field: keyof OfferFormData, value: any) => void;
  onTargetTypeChange: (targetType: string) => void;
  onTargetSelect: (targetId: number, targetName: string) => void;
  onProductToggle: (productId: number) => void;
  onRemoveProduct: (productId: number) => void;
}

export function OfferForm({
  isOpen,
  editingOffer,
  formData,
  products,
  categories,
  selectedProductIds,
  submitting,
  onClose,
  onSubmit,
  onFieldChange,
  onTargetTypeChange,
  onTargetSelect,
  onProductToggle,
  onRemoveProduct,
}: OfferFormProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-black uppercase tracking-tighter text-black dark:text-white">
            {editingOffer ? 'Edit Offer' : 'Create Offer'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <OfferBasicFields formData={formData} onFieldChange={onFieldChange} />

          {formData.targetType === 'product' && (
            <OfferProductSelector
              products={products}
              categories={categories}
              selectedProductIds={selectedProductIds}
              onProductToggle={onProductToggle}
              onRemoveProduct={onRemoveProduct}
            />
          )}

          {formData.targetType === 'category' && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Select Category *
              </label>
              <select
                required
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white cursor-pointer outline-none"
                value={formData.targetId || ''}
                onChange={(e) => {
                  const id = parseInt(e.target.value);
                  const category = categories.find((c) => c.id === id);
                  onTargetSelect(id, category?.name || '');
                }}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <OfferDateFields formData={formData} onFieldChange={onFieldChange} />

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white cursor-pointer"
                checked={formData.isActive}
                onChange={(e) => onFieldChange('isActive', e.target.checked)}
              />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Active
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-black dark:text-white focus:ring-2 focus:ring-black dark:focus:ring-white cursor-pointer"
                checked={formData.showBanner}
                onChange={(e) => onFieldChange('showBanner', e.target.checked)}
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Show Banner
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Only one banner can be active globally
                </span>
              </div>
            </label>
          </div>

          {formData.showBanner && (
            <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                ⚠️ Enabling this banner will automatically disable any other active banner. Only
                one global banner can be displayed at a time.
              </p>
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 font-medium hover:bg-zinc-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl font-black uppercase tracking-widest text-xs transition-colors shadow-lg shadow-black/5 disabled:opacity-50 cursor-pointer hover:opacity-90"
            >
              {submitting && <LoadingSpinner size="small" />}
              {editingOffer ? 'Update Offer' : 'Create Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

