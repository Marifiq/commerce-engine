/**
 * Centralized TypeScript types and interfaces for the ShirtStore frontend
 */

// --- User Types ---
export interface User {
    id: number;
    name: string;
    email: string;
    role?: string;
}

export interface UserState {
    currentUser: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
}

// --- Product Types ---
export interface Product {
    id: number;
    name: string;
    description?: string;
    price: number;
    category: string;
    image: string;
    section?: string;
    stock: number;
    rating?: number;
    createdAt: string;
}

// --- Cart Types ---
/**
 * Frontend state representation of a cart item
 */
export interface CartItem {
    id: number;
    name: string;
    price: number;
    image: string;
    quantity: number;
}

/**
 * Backend response representation of a cart item (with relations)
 */
export interface ServerCartItem {
    id: number;
    cartId: number;
    productId: number;
    quantity: number;
    product?: {
        name: string;
        price: number;
        image: string;
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
    productId: number;
    userId: number;
    createdAt: string;
    user?: {
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
}

export interface Order {
    id: number;
    userId: number;
    items: OrderItem[];
    totalAmount: number;
    status: string;
    createdAt: string;
}
