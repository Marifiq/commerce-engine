'use client';

import { useState } from 'react';
import { X, Package } from 'lucide-react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Order, OrderItem } from '@/types/order';

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { orderId: number; orderItemIds?: number[]; reason?: string }) => Promise<void>;
  order: Order;
}

export default function ReturnModal({ isOpen, onClose, onSubmit, order }: ReturnModalProps) {
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const formik = useFormik({
    initialValues: {
      reason: '',
    },
    validationSchema: Yup.object({
      reason: Yup.string().min(10, 'Please provide a reason (at least 10 characters)'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        await onSubmit({
          orderId: order.id,
          orderItemIds: selectedItems.length > 0 ? selectedItems : undefined,
          reason: values.reason || undefined,
        });
        formik.resetForm();
        setSelectedItems([]);
        onClose();
      } catch (error) {
        console.error('Failed to submit return request', error);
      } finally {
        setLoading(false);
      }
    },
  });

  const toggleItem = (itemId: number) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  if (!isOpen) return null;

  // Filter out already returned items
  const returnableItems = order.items.filter((item) => !item.returned);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
              <Package className="h-5 w-5 text-zinc-900 dark:text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Request Return</h2>
              <p className="text-sm text-zinc-500">Order #{order.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-zinc-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={formik.handleSubmit} className="p-6 space-y-6">
          {/* Select Items */}
          {returnableItems.length > 0 ? (
            <div>
              <label className="block text-sm font-semibold text-zinc-900 dark:text-white mb-3">
                Select items to return (optional - leave empty to return entire order)
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {returnableItems.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-3 p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => toggleItem(item.id)}
                      className="w-4 h-4 text-black border-zinc-300 rounded focus:ring-2 focus:ring-black dark:focus:ring-white"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-zinc-900 dark:text-white">
                        {item.product?.name || 'Product'}
                      </p>
                      <p className="text-sm text-zinc-500">
                        Quantity: {item.quantity} {item.size && `• Size: ${item.size}`} • ${item.price.toFixed(2)}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                All items in this order have already been returned.
              </p>
            </div>
          )}

          {/* Reason */}
          <div>
            <label htmlFor="reason" className="block text-sm font-semibold text-zinc-900 dark:text-white mb-2">
              Reason for return (optional)
            </label>
            <textarea
              id="reason"
              name="reason"
              rows={4}
              value={formik.values.reason}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Please tell us why you're returning this item..."
              className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent resize-none"
            />
            {formik.touched.reason && formik.errors.reason && (
              <p className="mt-1 text-sm text-red-500">{formik.errors.reason}</p>
            )}
          </div>

          {/* Info */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              <strong>Note:</strong> Your return request will be reviewed by our team. You'll receive an email once it's processed.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg font-semibold text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || returnableItems.length === 0}
              className="flex-1 px-4 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Return Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

