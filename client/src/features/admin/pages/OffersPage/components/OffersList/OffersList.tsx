'use client';

import { Offer } from '@/types/offer';
import { Pagination, Skeleton } from '@/components/ui';
import { OfferRow } from './OfferRow';

interface OffersListProps {
  offers: Offer[];
  loading: boolean;
  searchTerm: string;
  currentPage: number;
  itemsPerPage: number;
  onEdit: (offer: Offer) => void;
  onDelete: (offerId: number) => void;
  onPageChange: (page: number) => void;
}

export function OffersList({
  offers,
  loading,
  searchTerm,
  currentPage,
  itemsPerPage,
  onEdit,
  onDelete,
  onPageChange,
}: OffersListProps) {
  const filteredOffers = offers.filter((offer) =>
    offer.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedOffers = filteredOffers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const isOfferActive = (offer: Offer) => {
    if (!offer.isActive) return false;
    const now = new Date();
    if (offer.startDate && new Date(offer.startDate) > now) return false;
    if (offer.endDate && new Date(offer.endDate) < now) return false;
    return true;
  };

  const totalPages = Math.ceil(filteredOffers.length / itemsPerPage);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-zinc-500">
                Title
              </th>
              <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-zinc-500">
                Discount
              </th>
              <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-zinc-500">
                Target
              </th>
              <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-zinc-500">
                Period
              </th>
              <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-zinc-500">
                Status
              </th>
              <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-zinc-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-6 py-4">
                    <Skeleton className="h-5 w-32" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-5 w-16" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-4 w-28" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <Skeleton className="h-8 w-8 rounded-lg" />
                    </div>
                  </td>
                </tr>
              ))
            ) : paginatedOffers.length > 0 ? (
              paginatedOffers.map((offer) => (
                <OfferRow
                  key={offer.id}
                  offer={offer}
                  isActive={isOfferActive(offer)}
                  onEdit={() => onEdit(offer)}
                  onDelete={() => onDelete(offer.id)}
                />
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <p className="text-zinc-400 dark:text-zinc-600">No offers found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filteredOffers.length > itemsPerPage && (
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}

