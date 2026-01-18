"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, DollarSign } from "lucide-react";
import Link from "next/link";
import { useFormik } from "formik";
import * as Yup from "yup";
import { refundService } from "@/services/refund.service";
import { orderService } from "@/services/order.service";
import { Order } from "@/types/order";
import { useToast } from "@/contexts";
import { LoadingSpinner } from "@/components/ui";

export default function RefundRequestPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const ordersData = await orderService.getMyOrders();
        // Filter orders that can be refunded
        const refundableOrders = ordersData.filter((order) => {
          const status = order.status?.toLowerCase() || "";
          return ["delivered", "completed", "shipped", "pending", "processing"].includes(status);
        });
        setOrders(refundableOrders);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
        showToast("Failed to load orders", "error");
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchOrders();
  }, [showToast]);

  const formik = useFormik({
    initialValues: {
      orderId: "",
      amount: 0,
      reason: "",
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      orderId: Yup.string().required("Please select an order"),
      amount: Yup.number()
        .required("Amount is required")
        .min(0.01, "Amount must be greater than 0"),
      reason: Yup.string()
        .min(10, "Please provide a detailed reason (at least 10 characters)")
        .required("Reason is required"),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        await refundService.createRefund({
          orderId: parseInt(values.orderId),
          amount: values.amount,
          reason: values.reason,
        });
        showToast("Refund request submitted successfully! We'll review it soon.", "success");
        router.push("/orders");
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to submit refund request. Please try again.";
        showToast(errorMessage, "error");
      } finally {
        setLoading(false);
      }
    },
  });

  const selectedOrder = orders.find(
    (o) => o.id.toString() === formik.values.orderId
  );

  // Calculate refundable amount
  const totalAmount = selectedOrder ? (selectedOrder.totalAmount || selectedOrder.total || 0) : 0;
  const alreadyRefunded =
    selectedOrder?.refunds
      ?.filter((r: any) => r.status === "processed" || r.status === "approved")
      .reduce((sum: number, r: any) => sum + (r.amount || 0), 0) || 0;
  const maxRefundAmount = totalAmount - alreadyRefunded;

  useEffect(() => {
    if (selectedOrder && maxRefundAmount > 0) {
      formik.setFieldValue("amount", maxRefundAmount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrder, maxRefundAmount]);

  if (loadingOrders) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Link
          href="/policies/refund"
          className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="font-bold">Back to Refund Policy</span>
        </Link>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 sm:p-8 lg:p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
              <DollarSign className="h-6 w-6 text-zinc-900 dark:text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-black dark:text-white">
                Request a Refund
              </h1>
              <p className="text-sm text-zinc-500 mt-1">
                Fill out the form below to request a refund
              </p>
            </div>
          </div>

          <form onSubmit={formik.handleSubmit} className="space-y-6">
            {/* Order Selection */}
            <div>
              <label
                htmlFor="orderId"
                className="block text-sm font-semibold text-zinc-900 dark:text-white mb-2"
              >
                Select Order *
              </label>
              <select
                id="orderId"
                name="orderId"
                value={formik.values.orderId}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
              >
                <option value="">-- Select an order --</option>
                {orders.map((order) => {
                  const orderTotal = order.totalAmount || order.total || 0;
                  const orderRefunded =
                    order.refunds
                      ?.filter((r: any) => r.status === "processed" || r.status === "approved")
                      .reduce((sum: number, r: any) => sum + (r.amount || 0), 0) || 0;
                  const available = orderTotal - orderRefunded;
                  return (
                    <option key={order.id} value={order.id}>
                      Order #{order.id} - ${orderTotal.toFixed(2)} - Available: ${available.toFixed(2)} -{" "}
                      {new Date(order.createdAt).toLocaleDateString()}
                    </option>
                  );
                })}
              </select>
              {formik.touched.orderId && formik.errors.orderId && (
                <p className="mt-1 text-sm text-red-500">{formik.errors.orderId}</p>
              )}
              {orders.length === 0 && (
                <p className="mt-2 text-sm text-zinc-500">
                  No eligible orders found for refund.
                </p>
              )}
            </div>

            {/* Order Summary */}
            {selectedOrder && (
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
            )}

            {/* Amount */}
            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-semibold text-zinc-900 dark:text-white mb-2"
              >
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
              {selectedOrder && maxRefundAmount > 0 && (
                <button
                  type="button"
                  onClick={() => formik.setFieldValue("amount", maxRefundAmount)}
                  className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Use maximum amount (${maxRefundAmount.toFixed(2)})
                </button>
              )}
            </div>

            {/* Reason */}
            <div>
              <label
                htmlFor="reason"
                className="block text-sm font-semibold text-zinc-900 dark:text-white mb-2"
              >
                Reason for Refund *
              </label>
              <textarea
                id="reason"
                name="reason"
                rows={6}
                value={formik.values.reason}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Please provide a detailed reason for your refund request..."
                className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent resize-none"
              />
              {formik.touched.reason && formik.errors.reason && (
                <p className="mt-1 text-sm text-red-500">{formik.errors.reason}</p>
              )}
            </div>

            {/* Info */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <strong>Note:</strong> Your refund request will be reviewed by our team. You'll receive an email notification once it's processed. Please allow 3-5 business days for review and processing.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <Link
                href="/policies/refund"
                className="flex-1 px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg font-semibold text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || orders.length === 0 || maxRefundAmount <= 0}
                className="flex-1 px-4 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Submitting..." : "Submit Refund Request"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

