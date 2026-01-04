/**
 * API endpoint constants
 */

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/users/login',
    SIGNUP: '/users/signup',
    LOGOUT: '/users/logout',
    GOOGLE_AUTH: '/users/auth/google',
    VERIFY_EMAIL: '/users/verify-email',
    RESEND_VERIFICATION_CODE: '/users/resend-verification-code',
    RESET_PASSWORD: '/users/reset-password',
  },
  
  // Products
  PRODUCTS: {
    BASE: '/products',
    BEST_SELLERS: '/products/best-sellers',
    BY_ID: (id: string | number) => `/products/${id}`,
    REVIEWS: (id: string | number) => `/products/${id}/reviews`,
  },
  
  // Cart
  CART: {
    BASE: '/cart',
    BY_ID: (id: number) => `/cart/${id}`,
  },
  
  // Orders
  ORDERS: {
    BASE: '/orders',
    CHECKOUT: '/orders/checkout',
    GUEST_CHECKOUT: '/orders/guest-checkout',
    MY_ORDERS: '/orders/my-orders',
    BY_ID: (id: string | number) => `/orders/${id}`,
  },
  
  // Reviews
  REVIEWS: {
    BASE: '/reviews',
    HOMEPAGE: '/reviews/homepage',
    MY_REVIEWS: '/reviews/my-reviews',
    BY_ID: (id: number) => `/reviews/${id}`,
  },
  
  // Categories
  CATEGORIES: {
    BASE: '/categories',
  },
  
  // Offers
  OFFERS: {
    BASE: '/offers',
  },
  
  // Profile
  PROFILE: {
    GET_ME: '/users/me',
    UPDATE_ME: '/users/update-me',
    UPDATE_EMAIL: '/users/update-email',
    CHANGE_PASSWORD: '/users/change-my-password',
    DELETE_ACCOUNT: '/users/delete-me',
    FORGOT_PASSWORD: '/users/forget-password',
  },
  
  // Payments
  PAYMENTS: {
    METHODS: '/payments/methods',
    METHOD_BY_ID: (id: string | number) => `/payments/methods/${id}`,
    STRIPE_KEY: '/payments/stripe-key',
    INTENT: '/payments/intent',
  },
} as const;

