import { apiFetch } from "@/lib/utils/api";
import { Refund } from "@/types/refund";

export const refundService = {
  /**
   * Create a refund request
   */
  createRefund: async (data: {
    orderId: number;
    amount: number;
    reason?: string;
  }): Promise<Refund> => {
    const response = await apiFetch("/orders/refunds", {
      method: "POST",
      body: data,
    });
    return response.data.refund;
  },

  /**
   * Get all refunds for the current user
   */
  getMyRefunds: async (params?: {
    status?: string;
    orderId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<Refund[]> => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.orderId) queryParams.append("orderId", params.orderId.toString());
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);

    const url = `/orders/refunds/my-refunds${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const response = await apiFetch(url);
    return response.data.refunds;
  },

  /**
   * Get a single refund by ID
   */
  getRefund: async (id: number): Promise<Refund> => {
    const response = await apiFetch(`/orders/refunds/${id}`);
    return response.data.refund;
  },
};

