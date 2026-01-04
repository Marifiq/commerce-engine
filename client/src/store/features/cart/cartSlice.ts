import { createSlice } from '@reduxjs/toolkit';
import { CartState } from '@/types/cart';
import { fetchCart, addItemToCart, mergeGuestCart, getGuestItems } from './cartThunks';

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

