import { apiFetch } from '@/lib/utils/api';
import { API_ENDPOINTS } from '@/lib/constants/api';
import { PaymentMethod, CreatePaymentMethodData, UpdatePaymentMethodData, PaymentIntentData } from '@/types/payment';

export interface PaymentMethodsResponse {
  status: string;
  results: number;
  data: {
    paymentMethods: PaymentMethod[];
  };
}

export interface PaymentMethodResponse {
  status: string;
  data: {
    paymentMethod: PaymentMethod;
  };
}

export interface StripeKeyResponse {
  status: string;
  data: {
    publishableKey: string;
  };
}

export interface PaymentIntentResponse {
  status: string;
  data: {
    paymentIntent: {
      id: string;
      status: string;
      clientSecret: string;
    };
  };
}

export const paymentService = {
  /**
   * Get all payment methods for the current user
   */
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const data = await apiFetch(API_ENDPOINTS.PAYMENTS.METHODS) as PaymentMethodsResponse;
    return data.data.paymentMethods;
  },

  /**
   * Get a single payment method by ID
   */
  async getPaymentMethod(id: string | number): Promise<PaymentMethod> {
    const data = await apiFetch(API_ENDPOINTS.PAYMENTS.METHOD_BY_ID(id)) as PaymentMethodResponse;
    return data.data.paymentMethod;
  },

  /**
   * Create a new payment method
   */
  async createPaymentMethod(data: CreatePaymentMethodData): Promise<PaymentMethod> {
    const response = await apiFetch(API_ENDPOINTS.PAYMENTS.METHODS, {
      method: 'POST',
      body: data,
    }) as PaymentMethodResponse;
    return response.data.paymentMethod;
  },

  /**
   * Update a payment method
   */
  async updatePaymentMethod(id: string | number, data: UpdatePaymentMethodData): Promise<PaymentMethod> {
    const response = await apiFetch(API_ENDPOINTS.PAYMENTS.METHOD_BY_ID(id), {
      method: 'PATCH',
      body: data,
    }) as PaymentMethodResponse;
    return response.data.paymentMethod;
  },

  /**
   * Delete a payment method
   */
  async deletePaymentMethod(id: string | number): Promise<void> {
    await apiFetch(API_ENDPOINTS.PAYMENTS.METHOD_BY_ID(id), {
      method: 'DELETE',
    });
  },

  /**
   * Get Stripe publishable key
   */
  async getStripeKey(): Promise<string> {
    const data = await apiFetch(API_ENDPOINTS.PAYMENTS.STRIPE_KEY) as StripeKeyResponse;
    return data.data.publishableKey;
  },

  /**
   * Create a payment intent for checkout
   */
  async createPaymentIntent(data: PaymentIntentData): Promise<PaymentIntentResponse['data']['paymentIntent']> {
    const response = await apiFetch(API_ENDPOINTS.PAYMENTS.INTENT, {
      method: 'POST',
      body: data,
    }) as PaymentIntentResponse;
    return response.data.paymentIntent;
  },
};

