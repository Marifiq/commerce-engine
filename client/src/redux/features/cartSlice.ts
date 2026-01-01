import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CartItem, CartState } from '../../types';
import { cartService } from '../../services/cartService';

// Async Thunks
export const fetchCart = createAsyncThunk(
    'cart/fetchCart',
    async (_, { rejectWithValue }) => {
        try {
            const items = await cartService.getMyCart();
            // Map the server structure back to frontend structure
            return items.map(item => ({
                id: item.id,
                name: item.product?.name || 'Unknown Product',
                price: item.product?.price || 0,
                image: item.product?.image || '',
                quantity: item.quantity,
                productId: item.productId // Keep reference to product
            }));
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

export const addItemToCart = createAsyncThunk(
    'cart/addItem',
    async ({ productId, quantity }: { productId: number, quantity: number }, { dispatch, rejectWithValue }) => {
        try {
            await cartService.addToCart(productId, quantity);
            dispatch(fetchCart());
            dispatch(toggleCart()); // Auto-open sidebar for feedback
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

export const removeItemFromCart = createAsyncThunk(
    'cart/removeItem',
    async (cartItemId: number, { dispatch, rejectWithValue }) => {
        try {
            await cartService.removeFromCart(cartItemId);
            dispatch(fetchCart());
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

export const updateCartItemQuantity = createAsyncThunk(
    'cart/updateQuantity',
    async ({ cartItemId, quantity }: { cartItemId: number, quantity: number }, { dispatch, rejectWithValue }) => {
        try {
            await cartService.updateQuantity(cartItemId, quantity);
            dispatch(fetchCart());
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

const initialState: CartState = {
    items: [],
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

