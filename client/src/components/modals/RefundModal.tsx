'use client';

import { useState, useEffect } from 'react';
import { X, DollarSign } from 'lucide-react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Order } from '@/types/order';

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { orderId: number; amount: number; reason?: string }) => Promise<void>;
  order: Order;
}

export default function RefundModal({ isOpen, onClose, onSubmit, order }: RefundModalProps) {
  const [loading, setLoading] = useState(false);
  const totalAmount = order.totalAmount || order.total || 0;

  // Calculate already refunded amount
  const alreadyRefunded = order.refunds
    ?.filter((r: any) => r.status === 'processed' || r.status === 'approved')
    .reduce((sum: number, r: any) => sum + (r.amount || 0), 0) || 0;

  const maxRefundAmount = totalAmount - alreadyRefunded;

  const formik = useFormik({
    initialValues: {
      amount: maxRefundAmount,
      reason: '',
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      amount: Yup.number()
        .required('Amount is required')
        .min(0.01, 'Amount must be greater than 0')
        .max(maxRefundAmount, `Maximum refund amount is $${maxRefundAmount.toFixed(2)}`),
      reason: Yup.string().min(10, 'Please provide a reason (at least 10 characters)'),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        await onSubmit({
          orderId: order.id,
          amount: values.amount,
          reason: values.reason || undefined,
        });
        formik.resetForm();
        onClose();
      } catch (error) {
        console.error('Failed to submit refund request', error);
      } finally {
        setLoading(false);
      }
    },
  });

  useEffect(() => {
    if (isOpen) {
      formik.setFieldValue('amount', maxRefundAmount);
    }
  }, [isOpen, maxRefundAmount]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
              <DollarSign className="h-5 w-5 text-zinc-900 dark:text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Request Refund</h2>
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
          {/* Order Summary */}
          <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Order Total:</span>
              <span className="font-semibold text-zinc-900 dark:text-white">${totalAmount.toFixed(2)}</span>
            </div>
            {alreadyRefunded > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Already Refunded:</span>
                <span className="font-semibold text-zinc-900 dark:text-white">${alreadyRefunded.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm pt-2 border-t border-zinc-200 dark:border-zinc-700">
              <span className="text-zinc-600 dark:text-zinc-400">Available for Refund:</span>
              <span className="font-bold text-zinc-900 dark:text-white">${maxRefundAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-semibold text-zinc-900 dark:text-white mb-2">
              Refund Amount *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
              <input
                type="number"
                id="amount"
                name="amount"
                step="0.01"
                min="0.01"
                max={maxRefundAmount}
                value={formik.values.amount}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full pl-8 pr-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            {formik.touched.amount && formik.errors.amount && (
              <p className="mt-1 text-sm text-red-500">{formik.errors.amount}</p>
            )}
            <button
              type="button"
              onClick={() => formik.setFieldValue('amount', maxRefundAmount)}
              className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Use maximum amount (${maxRefundAmount.toFixed(2)})
            </button>
          </div>

          {/* Reason */}
          <div>
            <label htmlFor="reason" className="block text-sm font-semibold text-zinc-900 dark:text-white mb-2">
              Reason for refund (optional)
            </label>
            <textarea
              id="reason"
              name="reason"
              rows={4}
              value={formik.values.reason}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="Please tell us why you're requesting a refund..."
              className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent resize-none"
            />
            {formik.touched.reason && formik.errors.reason && (
              <p className="mt-1 text-sm text-red-500">{formik.errors.reason}</p>
            )}
          </div>

          {/* Info */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              <strong>Note:</strong> Your refund request will be reviewed by our team. You'll receive an email once it's processed.
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
              disabled={loading || maxRefundAmount <= 0}
              className="flex-1 px-4 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Refund Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

