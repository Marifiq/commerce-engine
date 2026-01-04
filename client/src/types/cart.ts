/**
 * Cart-related types and interfaces
 */

import { ProductSize } from './product';

/**
 * Frontend state representation of a cart item
 */
export interface CartItem {
  id: number | string; // Guest items might have temp IDs
  productId: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: string | null;
  availableStock?: number;
  isOutOfStock?: boolean;
  sizeEnabled?: boolean;
  sizes?: ProductSize[];
}

/**
 * Backend response representation of a cart item (with relations)
 */
export interface ServerCartItem {
  id: number;
  cartId: number;
  productId: number;
  quantity: number;
  size?: string | null;
  availableStock?: number;
  isOutOfStock?: boolean;
  product?: {
    name: string;
    price: number;
    image: string;
    sizeEnabled?: boolean;
    sizes?: ProductSize[];
  };
}

export interface CartState {
  items: CartItem[];
  isCartOpen: boolean;
  isCheckoutOpen: boolean;
  loading: boolean;
  error: string | null;
}
