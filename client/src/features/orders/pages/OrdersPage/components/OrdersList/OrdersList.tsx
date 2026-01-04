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
}: OrdersListProps) {
  return (
    <div className="space-y-6">
      {orders.map((order) => (
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
        />
      ))}
    </div>
  );
}

