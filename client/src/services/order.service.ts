import { apiFetch } from '@/lib/utils/api';
import { Order } from '@/types/order';
import { API_ENDPOINTS } from '@/lib/constants/api';

export const orderService = {
  /**
   * Create a new order (checkout) - requires authentication
   */
  async createOrder(orderData: {
    shippingAddress: string;
    paymentMethod: string;
    phoneNumber?: string;
  }): Promise<Order> {
    const data = await apiFetch(API_ENDPOINTS.ORDERS.CHECKOUT, {
      method: 'POST',
      body: orderData,
    });
    return data.data.order as Order;
  },

  /**
   * Create a guest order (no authentication required)
   */
  async createGuestOrder(orderData: {
    items: Array<{
      productId: number;
      quantity: number;
      size?: string;
      price: number;
    }>;
    shippingAddress: string;
    paymentMethod: string;
    phoneNumber: string;
    customerEmail: string;
    customerName: string;
  }): Promise<Order> {
    const data = await apiFetch(API_ENDPOINTS.ORDERS.GUEST_CHECKOUT, {
      method: 'POST',
      body: orderData,
    });
    return data.data.order as Order;
  },

  /**
   * Fetch all orders for the current user
   */
  async getMyOrders(): Promise<Order[]> {
    const data = await apiFetch(API_ENDPOINTS.ORDERS.MY_ORDERS);
    return data.data.orders as Order[];
  },

  /**
   * Fetch a single order by ID
   */
  async getOrder(id: string | number): Promise<Order> {
    const data = await apiFetch(API_ENDPOINTS.ORDERS.BY_ID(id));
    return data.data.order as Order;
  },
};

