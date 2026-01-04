/**
 * Category-related types and interfaces
 */

export interface Category {
  id: number;
  name: string;
  image?: string | null;
  discountPercent?: number;
  createdAt: string;
}
