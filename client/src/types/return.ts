/**
 * Return-related types and interfaces
 */

import { Order, OrderItem } from './order';

export interface Return {
  id: number;
  orderId: number;
  order?: Order;
  orderItems?: OrderItem[];
  reason?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'returned';
  trackingNumber?: string | null;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

