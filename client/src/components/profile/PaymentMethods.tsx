"use client";

import { useState, useEffect } from "react";
import { CreditCard, Trash2, Plus, Check, Phone, Wallet } from "lucide-react";
import { paymentService } from "@/services/payment.service";
import { PaymentMethod, PaymentMethodType } from "@/types/payment";
import { useToast } from "@/contexts";
import AddPaymentMethodModal from "./AddPaymentMethodModal";

interface PaymentMethodsProps {
  userId: number;
}

export default function PaymentMethods({ userId }: PaymentMethodsProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchPaymentMethods();
  }, [userId]);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const methods = await paymentService.getPaymentMethods();
      setPaymentMethods(methods);
    } catch (error: unknown) {
      console.error("Failed to fetch payment methods:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load payment methods";
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await paymentService.updatePaymentMethod(id, { isDefault: true });
      showToast("Default payment method updated", "success");
      fetchPaymentMethods();
    } catch (error: unknown) {
      console.error("Failed to set default payment method:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update payment method";
      showToast(errorMessage, "error");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setDeletingId(id);
      await paymentService.deletePaymentMethod(id);
      showToast("Payment method deleted", "success");
      fetchPaymentMethods();
    } catch (error: unknown) {
      console.error("Failed to delete payment method:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete payment method";
      showToast(errorMessage, "error");
    } finally {
      setDeletingId(null);
    }
  };

  const getPaymentMethodIcon = (type: PaymentMethodType) => {
    switch (type) {
      case "visa":
        return <CreditCard className="w-5 h-5" />;
      case "jazzcash":
        return <Phone className="w-5 h-5" />;
      case "easypaisa":
        return <Wallet className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    if (method.type === "visa") {
      return `${method.brand?.toUpperCase() || "Card"} •••• ${method.last4 || ""}`;
    } else if (method.type === "jazzcash") {
      return `JazzCash • ${method.phoneNumber || ""}`;
    } else if (method.type === "easypaisa") {
      return `EasyPaisa • ${method.phoneNumber || ""}`;
    }
    return "Payment Method";
  };

  if (loading) {
    return (
      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment Methods
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-zinc-100 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Payment Method
        </button>
      </div>

      {paymentMethods.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-zinc-400 mb-4">No payment methods added yet</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-zinc-100 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Your First Payment Method
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg border border-zinc-700"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="text-zinc-400">
                  {getPaymentMethodIcon(method.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium">
                      {getPaymentMethodLabel(method)}
                    </p>
                    {method.isDefault && (
                      <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-medium rounded">
                        Default
                      </span>
                    )}
                  </div>
                  {method.accountName && (
                    <p className="text-sm text-zinc-400">{method.accountName}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!method.isDefault && (
                  <button
                    onClick={() => handleSetDefault(method.id)}
                    className="p-2 text-zinc-400 hover:text-white transition-colors"
                    title="Set as default"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(method.id)}
                  disabled={deletingId === method.id}
                  className="p-2 text-zinc-400 hover:text-red-400 transition-colors disabled:opacity-50"
                  title="Delete payment method"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddPaymentMethodModal
          onClose={() => {
            setShowAddModal(false);
            fetchPaymentMethods();
          }}
          onSuccess={() => {
            setShowAddModal(false);
            fetchPaymentMethods();
          }}
        />
      )}
    </div>
  );
}

