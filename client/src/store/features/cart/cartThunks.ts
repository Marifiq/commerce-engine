import { createAsyncThunk } from '@reduxjs/toolkit';
import { CartItem } from '@/types/cart';
import { Product } from '@/types/product';
import { cartService } from '@/services/cart.service';

const GUEST_CART_KEY = 'shirt_guest_cart';

const getGuestItems = (): CartItem[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(GUEST_CART_KEY);
    return stored ? JSON.parse(stored) : [];
};

const setGuestItems = (items: CartItem[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
};

export const fetchCart = createAsyncThunk(
    'cart/fetchCart',
    async (_, { rejectWithValue }) => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            if (!token) {
                return getGuestItems();
            }

            const items = await cartService.getMyCart();
            return items.map(item => ({
                id: item.id,
                name: item.product?.name || 'Unknown Product',
                price: item.product?.price || 0,
                image: item.product?.image || '',
                quantity: item.quantity,
                productId: item.productId,
                size: item.size || null,
                availableStock: item.availableStock,
                isOutOfStock: item.isOutOfStock || false,
                sizeEnabled: item.product?.sizeEnabled || false,
                sizes: item.product?.sizes || []
            })) as CartItem[];
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

export const addItemToCart = createAsyncThunk(
    'cart/addItem',
    async ({ product, quantity, size }: { product: Product, quantity: number, size?: string | null }, { dispatch, rejectWithValue }) => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            if (!token) {
                const items = getGuestItems();
                // For guest cart, match by productId and size
                const existingItem = items.find(item => 
                    item.productId === product.id && 
                    (item.size === size || (!item.size && !size))
                );
                if (existingItem) {
                    existingItem.quantity += quantity;
                } else {
                    items.push({
                        id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        productId: product.id,
                        name: product.name,
                        price: product.price,
                        image: product.image,
                        quantity: quantity,
                        size: size || null
                    });
                }
                setGuestItems(items);
                dispatch(fetchCart());
                // Use action type string to avoid circular dependency
                dispatch({ type: 'cart/toggleCart' });
                return;
            }

            await cartService.addToCart(product.id, quantity, size);
            dispatch(fetchCart());
            // Use action type string to avoid circular dependency
            dispatch({ type: 'cart/toggleCart' }); // Auto-open sidebar for feedback
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

export const removeItemFromCart = createAsyncThunk(
    'cart/removeItem',
    async (cartItemId: number | string, { dispatch, rejectWithValue }) => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            if (!token) {
                const items = getGuestItems().filter(item => item.id !== cartItemId);
                setGuestItems(items);
                dispatch(fetchCart());
                return;
            }

            await cartService.removeFromCart(cartItemId as number);
            dispatch(fetchCart());
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

export const updateCartItemQuantity = createAsyncThunk(
    'cart/updateQuantity',
    async ({ cartItemId, quantity, size }: { cartItemId: number | string, quantity: number, size?: string | null }, { dispatch, rejectWithValue }) => {
        try {
            if (quantity < 1) return;

            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            if (!token) {
                const items = getGuestItems();
                const item = items.find(i => i.id === cartItemId);
                if (item) {
                    item.quantity = quantity;
                    if (size !== undefined) {
                        item.size = size;
                    }
                    setGuestItems(items);
                    dispatch(fetchCart());
                }
                return;
            }

            try {
                await cartService.updateQuantity(cartItemId as number, quantity, size);
                dispatch(fetchCart());
            } catch (err: any) {
                // If stock error, still refresh cart to get updated stock info
                if (err.message && (err.message.includes('stock') || err.message.includes('Stock'))) {
                    dispatch(fetchCart());
                }
                return rejectWithValue(err.message);
            }
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

export const mergeGuestCart = createAsyncThunk(
    'cart/mergeGuest',
    async (_, { dispatch, rejectWithValue }) => {
        try {
            const guestItems = getGuestItems();
            if (guestItems.length === 0) {
                // Even if no guest items, fetch cart to show abandoned cart
                dispatch(fetchCart());
                return;
            }

            // First, fetch existing cart to ensure we have the latest state
            // This will load any abandoned cart items from the database
            await dispatch(fetchCart());

            // Add each guest item to the backend cart
            // The backend addToCart will handle merging with existing items
            for (const item of guestItems) {
                try {
                    await cartService.addToCart(item.productId, item.quantity, item.size || undefined);
                } catch (err: any) {
                    // If adding fails (e.g., stock issue), continue with other items
                    console.warn(`Failed to add item ${item.productId} to cart:`, err.message);
                }
            }

            // Clear guest items after successful merging
            setGuestItems([]);
            
            // Fetch cart again to get the final merged state
            dispatch(fetchCart());
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

// Export guest cart utilities for use in cartSlice
export { getGuestItems, setGuestItems, GUEST_CART_KEY };

