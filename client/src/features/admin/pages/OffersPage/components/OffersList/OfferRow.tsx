'use client';

import { Tag } from 'lucide-react';
import { Offer } from '@/types/offer';
import { OfferActions } from '../OfferActions';

interface OfferRowProps {
  offer: Offer;
  isActive: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function OfferRow({ offer, isActive, onEdit, onDelete }: OfferRowProps) {
  return (
    <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <Tag size={18} className="text-zinc-400 dark:text-zinc-600" />
          <div>
            <p className="font-bold text-zinc-900 dark:text-white">{offer.title}</p>
            {offer.description && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {offer.description}
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
          {offer.discountPercent}% OFF
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm">
          <p className="font-medium text-zinc-900 dark:text-white capitalize">
            {offer.targetType}
          </p>
          {offer.targetName && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{offer.targetName}</p>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          {offer.startDate ? (
            <p>{new Date(offer.startDate).toLocaleDateString()}</p>
          ) : (
            <p className="text-zinc-400">No start</p>
          )}
          {offer.endDate && (
            <p className="mt-1">→ {new Date(offer.endDate).toLocaleDateString()}</p>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col gap-1">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              isActive
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            {isActive ? 'Active' : 'Inactive'}
          </span>
          {offer.showBanner && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg animate-pulse">
              🌟 Global Banner
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <OfferActions onEdit={onEdit} onDelete={onDelete} />
      </td>
    </tr>
  );
}

