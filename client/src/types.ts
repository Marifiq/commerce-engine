/**
 * Centralized TypeScript types and interfaces for the ShirtStore frontend
 */

// --- User Types ---
export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  profileImage?: string;
  gender?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  addressCountry?: string;
  createdAt?: string;
}

export interface UserState {
  currentUser: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// --- Category Types ---
export interface Category {
  id: number;
  name: string;
  image?: string | null;
  discountPercent?: number;
  createdAt: string;
}

// --- Product Types ---
export interface ProductMedia {
  id: number;
  productId: number;
  url: string;
  type: "image" | "video";
  isPrimary: boolean;
  order: number;
  createdAt: string;
}

export interface ProductSize {
  id: number;
  productId: number;
  size: string;
  stock: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  discountedPrice?: number;
  discountPercent?: number;
  hasDiscount?: boolean;
  category: string;
  image: string;
  media?: ProductMedia[];
  section?: string;
  stock: number;
  sizeEnabled?: boolean;
  sizes?: ProductSize[];
  rating?: number;
  averageRating?: number;
  reviewCount?: number;
  color?: string;
  createdAt: string;
}

// --- Cart Types ---
/**
 * Frontend state representation of a cart item
 */
export interface CartItem {
  id: number | string; // Guest items might have temp IDs
  productId: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: string | null;
}

/**
 * Backend response representation of a cart item (with relations)
 */
export interface ServerCartItem {
  id: number;
  cartId: number;
  productId: number;
  quantity: number;
  size?: string | null;
  product?: {
    name: string;
    price: number;
    image: string;
    sizeEnabled?: boolean;
    sizes?: ProductSize[];
  };
}

export interface CartState {
  items: CartItem[];
  isCartOpen: boolean;
  isCheckoutOpen: boolean;
  loading: boolean;
  error: string | null;
}

// --- Review Types ---
export interface Review {
  id: number;
  text: string;
  rating: number;
  images?: string[];
  videos?: string[];
  productId: number;
  userId: number;
  isApproved: boolean;
  createdAt: string;
  user?:
    | string
    | {
        name: string;
        role?: string;
      };
  product?: {
    name: string;
  };
}

// --- Order Types ---
export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  product?: Product;
  price: number;
  quantity: number;
  size?: string | null;
}

export interface Order {
  id: number;
  userId: number;
  items: OrderItem[];
  total?: number; // Legacy field, prefer totalAmount
  totalAmount?: number; // Matches backend schema
  status: string;
  createdAt: string;
}

// --- Offer Types ---
export interface OfferProduct {
  id: number;
  offerId: number;
  productId: number;
  product?: Product;
  createdAt: string;
}

export interface Offer {
  id: number;
  title: string;
  description?: string | null;
  discountPercent: number;
  targetType: string; // "product", "category", or "all"
  targetId?: number | null;
  targetName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
  showBanner: boolean;
  products?: OfferProduct[] | number[];
  createdAt: string;
  updatedAt: string;
}
