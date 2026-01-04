/**
 * Refund-related types and interfaces
 */

import { Order } from './order';

export interface Refund {
  id: number;
  orderId: number;
  order?: Order;
  amount: number;
  reason?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  adminNotes?: string | null;
  createdAt: string;
  processedAt?: string | null;
}

