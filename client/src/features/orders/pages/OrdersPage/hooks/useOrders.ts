/**
 * Hook for fetching and managing orders
 */

import { useState, useEffect } from 'react';
import { Order } from '@/types/order';
import { orderService } from '@/services/order.service';

export function useOrders(includeArchived: boolean = false) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const ordersData = await orderService.getMyOrders(includeArchived);
      const sorted = ordersData.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setOrders(sorted);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeArchived]);

  return {
    orders,
    loading,
    refetch: fetchOrders,
  };
}

