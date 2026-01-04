/**
 * Review-related types and interfaces
 */

export interface Review {
  id: number;
  text: string;
  rating: number;
  images?: string[];
  videos?: string[];
  productId: number;
  userId: number;
  isApproved: boolean;
  createdAt: string;
  user?: string | {
    name: string;
    role?: string;
  };
  product?: {
    name: string;
  };
}

