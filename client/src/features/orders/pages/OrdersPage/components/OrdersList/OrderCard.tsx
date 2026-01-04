'use client';

import { RotateCcw } from 'lucide-react';
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
}: OrderCardProps) {
  const getProductReview = (productId: number) => {
    return userReviews.find((r) => r.productId === productId);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Order #{order.id}
              </h3>
              <OrderStatusBadge status={order.status || 'pending'} />
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
            {(order.status || 'pending') === 'delivered' && (
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

