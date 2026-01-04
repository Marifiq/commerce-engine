/**
 * Custom hook for cart state and actions
 */

import { useAppSelector, useAppDispatch } from './useRedux';
import {
  selectCartItems,
  selectCartTotal,
  selectCartCount,
  selectIsCartOpen,
  selectIsCheckoutOpen,
  clearCart,
  toggleCart,
  toggleCheckout,
  closeCart,
  fetchCart,
  addItemToCart,
  removeItemFromCart,
  updateCartItemQuantity,
  mergeGuestCart,
} from '@/store/features/cart';
import { Product } from '@/types/product';

export function useCart() {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const total = useAppSelector(selectCartTotal);
  const count = useAppSelector(selectCartCount);
  const isOpen = useAppSelector(selectIsCartOpen);
  const isCheckoutOpen = useAppSelector(selectIsCheckoutOpen);
  const cartState = useAppSelector((state) => state.cart);

  return {
    items,
    total,
    count,
    isOpen,
    isCheckoutOpen,
    loading: cartState.loading,
    error: cartState.error,
    clearCart: () => dispatch(clearCart()),
    toggleCart: () => dispatch(toggleCart()),
    toggleCheckout: () => dispatch(toggleCheckout()),
    closeCart: () => dispatch(closeCart()),
    fetchCart: () => dispatch(fetchCart()),
    addItem: (product: Product, quantity: number = 1, size?: string | null) =>
      dispatch(addItemToCart({ product, quantity, size })),
    removeItem: (cartItemId: number | string) =>
      dispatch(removeItemFromCart(cartItemId)),
    updateQuantity: (cartItemId: number | string, quantity: number) =>
      dispatch(updateCartItemQuantity({ cartItemId, quantity })),
    mergeGuestCart: () => dispatch(mergeGuestCart()),
  };
}

