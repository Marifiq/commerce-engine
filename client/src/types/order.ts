/**
 * Order-related types and interfaces
 */

import { Product } from './product';

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  product?: Product;
  price: number;
  quantity: number;
  size?: string | null;
  returned?: boolean;
  returnId?: number | null;
}

export interface Order {
  id: number;
  userId?: number | null;
  items: OrderItem[];
  total?: number; // Legacy field, prefer totalAmount
  totalAmount?: number; // Matches backend schema
  status: string;
  createdAt: string;
  refunds?: any[];
  returns?: any[];
}

