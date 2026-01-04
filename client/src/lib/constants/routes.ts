/**
 * Route constants for navigation
 */

export const ROUTES = {
  // Public routes
  HOME: '/',
  SHOP: '/shop',
  PRODUCT: (id: string | number) => `/product/${id}`,
  
  // Auth routes
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  
  // User routes
  ORDERS: '/orders',
  
  // Admin routes
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    PRODUCTS: '/admin/products',
    ORDERS: '/admin/orders',
    USERS: '/admin/users',
    REVIEWS: '/admin/reviews',
    OFFERS: '/admin/offers',
    ABANDONED_CARTS: '/admin/abandoned-carts',
  },
} as const;

