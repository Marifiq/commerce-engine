'use client';

import { Order } from '@/types/order';
import { OrderCard } from './OrderCard';

interface OrdersListProps {
  orders: Order[];
  reorderingOrderId: number | null;
  onReorder: (order: Order) => void;
  onWriteReview: (product: { id: number; name: string; image: string }) => void;
  onEditReview: (product: { id: number; name: string; image: string }, review: any) => void;
  onDeleteReview: (reviewId: number, productId: number) => void;
  onMediaClick: (media: string) => void;
  userReviews: any[];
  showArchived: boolean;
  onArchive?: (orderId: number) => void;
  onUnarchive?: (orderId: number) => void;
}

export function OrdersList({
  orders,
  reorderingOrderId,
  onReorder,
  onWriteReview,
  onEditReview,
  onDeleteReview,
  onMediaClick,
  userReviews,
  showArchived,
  onArchive,
  onUnarchive,
}: OrdersListProps) {
  // Filter orders based on showArchived state
  const filteredOrders = orders.filter((order) => {
    if (!showArchived && order.isArchived) {
      return false;
    }
    if (showArchived && !order.isArchived) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {filteredOrders.length > 0 ? (
        filteredOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            reorderingOrderId={reorderingOrderId}
            onReorder={onReorder}
            onWriteReview={onWriteReview}
            onEditReview={onEditReview}
            onDeleteReview={onDeleteReview}
            onMediaClick={onMediaClick}
            userReviews={userReviews}
            onArchive={onArchive}
            onUnarchive={onUnarchive}
          />
        ))
      ) : (
        <div className="text-center py-12 text-zinc-500">
          {showArchived ? "No archived orders found." : "No active orders found."}
        </div>
      )}
    </div>
  );
}

