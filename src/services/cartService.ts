import { apiFetch } from "../utils/api";
import { ServerCartItem as CartItem } from "../types";


export const cartService = {
  /**
   * Fetch the logged-in user's cart
   */
  async getMyCart() {
    const data = await apiFetch("/cart");
    return data.data.cart.items as CartItem[];
  },

  /**
   * Add a product to the cart
   */
  async addToCart(productId: number, quantity: number = 1) {
    const data = await apiFetch("/cart", {
      method: "POST",
      body: { productId, quantity },
    });
    return data.data.cart;
  },

  /**
   * Update quantity of a cart item
   */
  async updateQuantity(cartItemId: number, quantity: number) {
    const data = await apiFetch(`/cart/${cartItemId}`, {
      method: "PATCH",
      body: { quantity },
    });
    return data.data;
  },

  /**
   * Remove item from cart
   */
  async removeFromCart(cartItemId: number) {
    await apiFetch(`/cart/${cartItemId}`, {
      method: "DELETE",
    });
  },
};
