/**
 * Product-related types and interfaces
 */

export interface ProductMedia {
  id: number;
  productId: number;
  url: string;
  type: "image" | "video";
  isPrimary: boolean;
  order: number;
  createdAt: string;
}

export interface ProductSize {
  id: number;
  productId: number;
  size: string;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  discountedPrice?: number;
  discountPercent?: number;
  hasDiscount?: boolean;
  category: string;
  image: string;
  media?: ProductMedia[];
  section?: string;
  stock: number;
  sizeEnabled?: boolean;
  sizes?: ProductSize[];
  rating?: number;
  averageRating?: number;
  reviewCount?: number;
  color?: string;
  isArchived?: boolean;
  createdAt: string;
}
