import { apiFetch } from "@/lib/utils/api";
import { Return } from "@/types/return";

export const returnService = {
  /**
   * Create a return request
   */
  createReturn: async (data: {
    orderId: number;
    orderItemIds?: number[];
    reason?: string;
  }): Promise<Return> => {
    const response = await apiFetch("/orders/returns", {
      method: "POST",
      body: data,
    });
    return response.data.return;
  },

  /**
   * Get all returns for the current user
   */
  getMyReturns: async (params?: {
    status?: string;
    orderId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<Return[]> => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.orderId) queryParams.append("orderId", params.orderId.toString());
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);

    const url = `/orders/returns/my-returns${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const response = await apiFetch(url);
    return response.data.returns;
  },

  /**
   * Get a single return by ID
   */
  getReturn: async (id: number): Promise<Return> => {
    const response = await apiFetch(`/orders/returns/${id}`);
    return response.data.return;
  },
};

