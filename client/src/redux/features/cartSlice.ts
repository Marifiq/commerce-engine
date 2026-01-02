import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CartItem, CartState, Product } from '../../types';
import { cartService } from '../../services/cartService';

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

// Async Thunks
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
                productId: item.productId
            })) as CartItem[];
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

export const addItemToCart = createAsyncThunk(
    'cart/addItem',
    async ({ product, quantity }: { product: Product, quantity: number }, { dispatch, rejectWithValue }) => {
        try {
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            if (!token) {
                const items = getGuestItems();
                const existingItem = items.find(item => item.productId === product.id);
                if (existingItem) {
                    existingItem.quantity += quantity;
                } else {
                    items.push({
                        id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        productId: product.id,
                        name: product.name,
                        price: product.price,
                        image: product.image,
                        quantity: quantity
                    });
                }
                setGuestItems(items);
                dispatch(fetchCart());
                dispatch(toggleCart());
                return;
            }

            await cartService.addToCart(product.id, quantity);
            dispatch(fetchCart());
            dispatch(toggleCart()); // Auto-open sidebar for feedback
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
    async ({ cartItemId, quantity }: { cartItemId: number | string, quantity: number }, { dispatch, rejectWithValue }) => {
        try {
            if (quantity < 1) return;

            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            if (!token) {
                const items = getGuestItems();
                const item = items.find(i => i.id === cartItemId);
                if (item) {
                    item.quantity = quantity;
                    setGuestItems(items);
                    dispatch(fetchCart());
                }
                return;
            }

            await cartService.updateQuantity(cartItemId as number, quantity);
            dispatch(fetchCart());
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
            if (guestItems.length === 0) return;

            // Add each guest item to the backend cart
            for (const item of guestItems) {
                await cartService.addToCart(item.productId, item.quantity);
            }

            // Clear guest items after successful merging
            setGuestItems([]);
            dispatch(fetchCart());
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

const initialState: CartState = {
    items: typeof window !== 'undefined' ? getGuestItems() : [],
    isCartOpen: false,
    isCheckoutOpen: false,
    loading: false,
    error: null,
};

export const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        clearCart: (state) => {
            state.items = [];
        },
        toggleCart: (state) => {
            state.isCartOpen = !state.isCartOpen;
            if (state.isCartOpen) state.isCheckoutOpen = false;
        },
        toggleCheckout: (state) => {
            state.isCheckoutOpen = !state.isCheckoutOpen;
            if (state.isCheckoutOpen) state.isCartOpen = false;
        },
        closeCart: (state) => {
            state.isCartOpen = false;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Cart
            .addCase(fetchCart.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCart.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload as any;
            })
            .addCase(fetchCart.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Add Item
            .addCase(addItemToCart.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addItemToCart.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(addItemToCart.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Merge Guest Cart
            .addCase(mergeGuestCart.pending, (state) => {
                state.loading = true;
            })
            .addCase(mergeGuestCart.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(mergeGuestCart.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    }
});


export const { clearCart, toggleCart, toggleCheckout, closeCart } = cartSlice.actions;

// Selectors
export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectIsCartOpen = (state: { cart: CartState }) => state.cart.isCartOpen;
export const selectIsCheckoutOpen = (state: { cart: CartState }) => state.cart.isCheckoutOpen;
export const selectCartTotal = (state: { cart: CartState }) =>
    state.cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
export const selectCartCount = (state: { cart: CartState }) =>
    state.cart.items.reduce((count, item) => count + item.quantity, 0);

export default cartSlice.reducer;

