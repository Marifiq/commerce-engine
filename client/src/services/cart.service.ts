import { apiFetch } from '@/lib/utils/api';
import { ServerCartItem } from '@/types/cart';
import { API_ENDPOINTS } from '@/lib/constants/api';

export const cartService = {
  /**
   * Fetch the logged-in user's cart
   */
  async getMyCart(): Promise<ServerCartItem[]> {
    const data = await apiFetch(API_ENDPOINTS.CART.BASE);
    return data.data.cart.items as ServerCartItem[];
  },

  /**
   * Add a product to the cart
   */
  async addToCart(productId: number, quantity: number = 1, size?: string | null) {
    const body: any = { productId, quantity };
    if (size) {
      body.size = size;
    }
    const data = await apiFetch(API_ENDPOINTS.CART.BASE, {
      method: 'POST',
      body,
    });
    return data.data.cart;
  },

  /**
   * Update quantity and/or size of a cart item
   */
  async updateQuantity(cartItemId: number, quantity: number, size?: string | null) {
    const body: any = { quantity };
    if (size !== undefined) {
      body.size = size;
    }
    const data = await apiFetch(API_ENDPOINTS.CART.BY_ID(cartItemId), {
      method: 'PATCH',
      body,
    });
    return data.data;
  },

  /**
   * Remove item from cart
   */
  async removeFromCart(cartItemId: number) {
    await apiFetch(API_ENDPOINTS.CART.BY_ID(cartItemId), {
      method: 'DELETE',
    });
  },
};

