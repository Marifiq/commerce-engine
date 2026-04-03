/**
 * Hook for order actions (reorder functionality)
 */

import { useState } from 'react';
import { useAppDispatch } from '@/hooks/useRedux';
import { addItemToCart } from '@/store/features/cart';
import { Order } from '@/types/order';
import { Product } from '@/types/product';
import { productService } from '@/services/product.service';
import { useToast } from '@/contexts';

export interface ReorderResult {
  message: string;
  unavailableItems?: Array<{
    name: string;
    category: string;
    requested: number;
    available: number;
  }>;
}

export function useOrderActions() {
  const dispatch = useAppDispatch();
  const { showToast } = useToast();
  const [reorderingOrderId, setReorderingOrderId] = useState<number | null>(null);
  const [reorderResult, setReorderResult] = useState<ReorderResult | null>(null);

  const handleReorder = async (order: Order) => {
    setReorderingOrderId(order.id);

    try {
      // Fetch current product details to check stock
      const productChecks = await Promise.allSettled(
        order.items.map((item) => productService.getProduct(item.productId))
      );

      const availableItems: Array<{ product: Product; quantity: number; stock: number }> = [];
      const unavailableItems: Array<{
        name: string;
        category: string;
        requested: number;
        available: number;
      }> = [];

      // Check stock for each item
      for (let i = 0; i < order.items.length; i++) {
        const item = order.items[i];
        const productCheck = productChecks[i];

        if (productCheck.status === 'fulfilled') {
          const product = productCheck.value as Product;
          const requestedQty = item.quantity;
          const availableStock = product.stock || 0;

          if (availableStock >= requestedQty) {
            availableItems.push({
              product: product,
              quantity: requestedQty,
              stock: availableStock,
            });
          } else if (availableStock > 0) {
            availableItems.push({
              product: product,
              quantity: availableStock,
              stock: availableStock,
            });
            unavailableItems.push({
              name: product.name,
              category: product.category || 'Uncategorized',
              requested: requestedQty,
              available: availableStock,
            });
          } else {
            unavailableItems.push({
              name: product.name,
              category: product.category || 'Uncategorized',
              requested: requestedQty,
              available: 0,
            });
          }
        } else {
          unavailableItems.push({
            name: item.product?.name || 'Unknown Product',
            category: item.product?.category || 'Uncategorized',
            requested: item.quantity,
            available: 0,
          });
        }
      }

      // Add available items to cart
      const failedItems: string[] = [];
      if (availableItems.length > 0) {
        for (const item of availableItems) {
          try {
            await dispatch(
              addItemToCart({
                product: item.product,
                quantity: item.quantity,
              })
            ).unwrap();
          } catch (error: unknown) {
            console.error(`Failed to add ${item.product.name} to cart:`, error);
            failedItems.push(item.product.name);
            const index = availableItems.findIndex((ai) => ai.product.id === item.product.id);
            if (index > -1) {
              const failedProduct = order.items.find((oi) => oi.productId === item.product.id);
              availableItems.splice(index, 1);
              unavailableItems.push({
                name: item.product.name,
                category: failedProduct?.product?.category || 'Uncategorized',
                requested: item.quantity,
                available: item.stock,
              });
            }
          }
        }
      }

      // Show feedback message
      let message = '';

      if (availableItems.length > 0 && unavailableItems.length === 0) {
        message = `All items from order #${order.id} have been added to your cart!`;
        showToast(message, 'success');
        setReorderResult(null);
      } else if (availableItems.length > 0 && unavailableItems.length > 0) {
        message = `${availableItems.length} item(s) added to cart. ${unavailableItems.length} item(s) are out of stock or unavailable.`;
        setReorderResult({ message, unavailableItems });
      } else {
        message = `Sorry, all items from order #${order.id} are currently out of stock. Please shop for alternatives in the relevant categories.`;
        setReorderResult({ message, unavailableItems });
      }
    } catch (error: unknown) {
      console.error('Failed to reorder:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to reorder. Please try again.';
      showToast(errorMessage, 'error');
    } finally {
      setReorderingOrderId(null);
    }
  };

  return {
    reorderingOrderId,
    reorderResult,
    handleReorder,
    clearReorderResult: () => setReorderResult(null),
  };
}

