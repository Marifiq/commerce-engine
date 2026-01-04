/**
 * Offer-related types and interfaces
 */

import { Product } from './product';

export interface OfferProduct {
  id: number;
  offerId: number;
  productId: number;
  product?: Product;
  createdAt: string;
}

export interface Offer {
  id: number;
  title: string;
  description?: string | null;
  discountPercent: number;
  targetType: string; // "product", "category", or "all"
  targetId?: number | null;
  targetName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
  showBanner: boolean;
  products?: OfferProduct[] | number[];
  createdAt: string;
  updatedAt: string;
}

