import { apiFetch } from "../utils/api";
import { Order } from "../types";

export const orderService = {
  /**
   * Create a new order (checkout)
   */
  async createOrder(orderData: any) {
    const data = await apiFetch("/orders/checkout", {
      method: "POST",
      body: orderData,
    });
    return data.data.order as Order;
  },

  /**
   * Fetch all orders for the current user
   */
  async getMyOrders() {
    const data = await apiFetch("/orders/my-orders");
    return data.data.orders as Order[];
  },

  /**
   * Fetch a single order by ID
   */
  async getOrder(id: string | number) {
    const data = await apiFetch(`/orders/${id}`);
    return data.data.order as Order;
  },
};
