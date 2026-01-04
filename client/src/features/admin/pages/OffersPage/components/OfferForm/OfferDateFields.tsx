'use client';

import { OfferFormData } from '../../hooks/useOfferForm';

interface OfferDateFieldsProps {
  formData: OfferFormData;
  onFieldChange: (field: keyof OfferFormData, value: any) => void;
}

export function OfferDateFields({ formData, onFieldChange }: OfferDateFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          Start Date (Optional)
        </label>
        <input
          type="datetime-local"
          className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none"
          value={formData.startDate}
          onChange={(e) => onFieldChange('startDate', e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
          End Date (Optional)
        </label>
        <input
          type="datetime-local"
          className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-zinc-900 dark:text-white outline-none"
          value={formData.endDate}
          onChange={(e) => onFieldChange('endDate', e.target.value)}
        />
      </div>
    </div>
  );
}

