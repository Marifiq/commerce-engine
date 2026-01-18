'use client';

import { RotateCcw, Archive, ArchiveRestore } from 'lucide-react';
import { Order } from '@/types/order';
import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderItems } from '../OrderDetails/OrderItems';

interface OrderCardProps {
  order: Order;
  reorderingOrderId: number | null;
  onReorder: (order: Order) => void;
  onWriteReview: (product: { id: number; name: string; image: string }) => void;
  onEditReview: (product: { id: number; name: string; image: string }, review: any) => void;
  onDeleteReview: (reviewId: number, productId: number) => void;
  onMediaClick: (media: string) => void;
  userReviews: any[];
  onArchive?: (orderId: number) => void;
  onUnarchive?: (orderId: number) => void;
}

export function OrderCard({
  order,
  reorderingOrderId,
  onReorder,
  onWriteReview,
  onEditReview,
  onDeleteReview,
  onMediaClick,
  userReviews,
  onArchive,
  onUnarchive,
}: OrderCardProps) {
  const getProductReview = (productId: number) => {
    return userReviews.find((r) => r.productId === productId);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Order #{order.id}
              </h3>
              <OrderStatusBadge status={order.status || 'pending'} />
              {order.isArchived && (
                <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400">
                  Archived
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-500">
              Placed on{' '}
              {new Date(order.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="flex flex-col sm:items-end gap-3">
            <div className="text-left sm:text-right">
              <p className="text-sm text-zinc-500 mb-1">Total Amount</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-white">
                ${((order.totalAmount ?? order.total) || 0).toFixed(2)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {order.isArchived ? (
                onUnarchive && (
                  <button
                    onClick={() => onUnarchive(order.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-all shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    title="Unarchive Order"
                  >
                    <ArchiveRestore className="h-4 w-4" />
                    <span>Unarchive</span>
                  </button>
                )
              ) : (
                onArchive && (
                  <button
                    onClick={() => onArchive(order.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-600 text-white text-sm font-semibold hover:bg-zinc-700 transition-all shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    title="Archive Order"
                  >
                    <Archive className="h-4 w-4" />
                    <span>Archive</span>
                  </button>
                )
              )}
              {(order.status || 'pending') === 'delivered' && !order.isArchived && (
                <button
                  onClick={() => onReorder(order)}
                  disabled={reorderingOrderId === order.id}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-semibold hover:bg-black transition-all shadow-sm hover:shadow-md active:scale-95 dark:bg-white dark:text-black dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {reorderingOrderId === order.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin"></div>
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4" />
                      <span>Re-order</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6">
          <OrderItems
            order={order}
            getProductReview={getProductReview}
            onWriteReview={onWriteReview}
            onEditReview={onEditReview}
            onDeleteReview={onDeleteReview}
            onMediaClick={onMediaClick}
          />
        </div>
      </div>
    </div>
  );
}

