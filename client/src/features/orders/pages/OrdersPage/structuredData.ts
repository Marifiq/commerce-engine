/**
 * Generate structured data (JSON-LD) for orders
 */

import { Order } from '@/types/order';

export function generateOrdersStructuredData(orders: Order[]) {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : (process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3001');

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'My Orders',
    description: 'List of customer orders',
    numberOfItems: orders.length,
    itemListElement: orders.map((order, index) => ({
      '@type': 'Order',
      position: index + 1,
      orderNumber: order.id.toString(),
      orderDate: order.createdAt,
      orderStatus: order.status || 'pending',
      totalPrice: (order.totalAmount ?? order.total) || 0,
      priceCurrency: 'USD',
      url: `${baseUrl}/orders`,
    })),
  };
}

