/**
 * Payment method types and interfaces
 */

export type PaymentMethodType = 'visa' | 'jazzcash' | 'easypaisa';
export type PaymentProvider = 'stripe' | 'jazzcash' | 'easypaisa';

export interface PaymentMethod {
  id: number;
  userId: number;
  type: PaymentMethodType;
  provider: PaymentProvider;
  last4?: string;
  brand?: string;
  stripeId?: string;
  phoneNumber?: string;
  accountName?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentMethodData {
  type: PaymentMethodType;
  provider?: PaymentProvider;
  phoneNumber?: string;
  accountName?: string;
  paymentMethodId?: string; // For Stripe cards
}

export interface UpdatePaymentMethodData {
  isDefault?: boolean;
  phoneNumber?: string;
  accountName?: string;
}

export interface PaymentIntentData {
  amount: number;
  paymentMethodId: string;
  currency?: string;
}

