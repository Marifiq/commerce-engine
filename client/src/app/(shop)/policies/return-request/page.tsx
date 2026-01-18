"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";
import Link from "next/link";
import { useFormik } from "formik";
import * as Yup from "yup";
import { returnService } from "@/services/return.service";
import { orderService } from "@/services/order.service";
import { Order } from "@/types/order";
import { useToast } from "@/contexts";
import { LoadingSpinner } from "@/components/ui";

export default function ReturnRequestPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const ordersData = await orderService.getMyOrders();
        // Filter orders that can be returned (delivered, completed, shipped)
        const returnableOrders = ordersData.filter((order) => {
          const status = order.status?.toLowerCase() || "";
          return ["delivered", "completed", "shipped"].includes(status);
        });
        setOrders(returnableOrders);
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
      orderItemIds: [] as number[],
      reason: "",
    },
    validationSchema: Yup.object({
      orderId: Yup.string().required("Please select an order"),
      reason: Yup.string()
        .min(10, "Please provide a detailed reason (at least 10 characters)")
        .required("Reason is required"),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        await returnService.createReturn({
          orderId: parseInt(values.orderId),
          orderItemIds: values.orderItemIds.length > 0 ? values.orderItemIds : undefined,
          reason: values.reason,
        });
        showToast("Return request submitted successfully! We'll review it soon.", "success");
        router.push("/orders");
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to submit return request. Please try again.";
        showToast(errorMessage, "error");
      } finally {
        setLoading(false);
      }
    },
  });

  const selectedOrder = orders.find(
    (o) => o.id.toString() === formik.values.orderId
  );

  const toggleItem = (itemId: number) => {
    const current = formik.values.orderItemIds;
    if (current.includes(itemId)) {
      formik.setFieldValue(
        "orderItemIds",
        current.filter((id) => id !== itemId)
      );
    } else {
      formik.setFieldValue("orderItemIds", [...current, itemId]);
    }
  };

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
          href="/policies/return"
          className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="font-bold">Back to Return Policy</span>
        </Link>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 sm:p-8 lg:p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
              <Package className="h-6 w-6 text-zinc-900 dark:text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-black dark:text-white">
                Request a Return
              </h1>
              <p className="text-sm text-zinc-500 mt-1">
                Fill out the form below to request a return
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
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    Order #{order.id} - ${((order.totalAmount ?? order.total) || 0).toFixed(2)} -{" "}
                    {new Date(order.createdAt).toLocaleDateString()}
                  </option>
                ))}
              </select>
              {formik.touched.orderId && formik.errors.orderId && (
                <p className="mt-1 text-sm text-red-500">{formik.errors.orderId}</p>
              )}
              {orders.length === 0 && (
                <p className="mt-2 text-sm text-zinc-500">
                  No eligible orders found for return. Orders must be delivered, completed, or shipped.
                </p>
              )}
            </div>

            {/* Item Selection */}
            {selectedOrder && (
              <div>
                <label className="block text-sm font-semibold text-zinc-900 dark:text-white mb-3">
                  Select Items to Return (optional - leave empty to return entire order)
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                  {selectedOrder.items
                    .filter((item) => !item.returned)
                    .map((item) => (
                      <label
                        key={item.id}
                        className="flex items-center gap-3 p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={formik.values.orderItemIds.includes(item.id)}
                          onChange={() => toggleItem(item.id)}
                          className="w-4 h-4 text-black border-zinc-300 rounded focus:ring-2 focus:ring-black dark:focus:ring-white"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-zinc-900 dark:text-white">
                            {item.product?.name || "Product"}
                          </p>
                          <p className="text-sm text-zinc-500">
                            Quantity: {item.quantity} {item.size && `• Size: ${item.size}`} • ${item.price.toFixed(2)}
                          </p>
                        </div>
                      </label>
                    ))}
                  {selectedOrder.items.filter((item) => !item.returned).length === 0 && (
                    <p className="text-sm text-zinc-500 text-center py-4">
                      All items in this order have already been returned.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Reason */}
            <div>
              <label
                htmlFor="reason"
                className="block text-sm font-semibold text-zinc-900 dark:text-white mb-2"
              >
                Reason for Return *
              </label>
              <textarea
                id="reason"
                name="reason"
                rows={6}
                value={formik.values.reason}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Please provide a detailed reason for your return request..."
                className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent resize-none"
              />
              {formik.touched.reason && formik.errors.reason && (
                <p className="mt-1 text-sm text-red-500">{formik.errors.reason}</p>
              )}
            </div>

            {/* Info */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <strong>Note:</strong> Your return request will be reviewed by our team. You'll receive an email notification once it's processed. Please allow 2-3 business days for review.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <Link
                href="/policies/return"
                className="flex-1 px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg font-semibold text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || orders.length === 0}
                className="flex-1 px-4 py-3 bg-black dark:bg-white text-white dark:text-black rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Submitting..." : "Submit Return Request"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

