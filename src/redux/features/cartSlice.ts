import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
    id: number;
    name: string;
    price: number;
    image: string;
    quantity: number;
}

interface CartState {
    items: CartItem[];
    isCartOpen: boolean;
    isCheckoutOpen: boolean;
}

const initialState: CartState = {
    items: [],
    isCartOpen: false,
    isCheckoutOpen: false,
};

export const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        addToCart: (state, action: PayloadAction<Omit<CartItem, 'quantity'>>) => {
            const existingItem = state.items.find((item) => item.id === action.payload.id);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                state.items.push({ ...action.payload, quantity: 1 });
            }
            // Enhance UX: Open cart when adding item
            state.isCartOpen = true;
        },
        removeFromCart: (state, action: PayloadAction<number>) => {
            state.items = state.items.filter((item) => item.id !== action.payload);
        },
        updateQuantity: (state, action: PayloadAction<{ id: number; quantity: number }>) => {
            const item = state.items.find((item) => item.id === action.payload.id);
            if (item) {
                if (action.payload.quantity <= 0) {
                    state.items = state.items.filter((i) => i.id !== action.payload.id);
                } else {
                    item.quantity = action.payload.quantity;
                }
            }
        },
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
});

export const { addToCart, removeFromCart, updateQuantity, clearCart, toggleCart, toggleCheckout, closeCart } = cartSlice.actions;

// Selectors
export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectIsCartOpen = (state: { cart: CartState }) => state.cart.isCartOpen;
export const selectIsCheckoutOpen = (state: { cart: CartState }) => state.cart.isCheckoutOpen;
export const selectCartTotal = (state: { cart: CartState }) =>
    state.cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
export const selectCartCount = (state: { cart: CartState }) =>
    state.cart.items.reduce((count, item) => count + item.quantity, 0);

export default cartSlice.reducer;
