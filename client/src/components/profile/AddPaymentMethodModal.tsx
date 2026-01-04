"use client";

import { useState, useEffect } from "react";
import { X, CreditCard, Phone, Wallet } from "lucide-react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { paymentService } from "@/services/payment.service";
import { useToast } from "@/contexts";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

interface AddPaymentMethodModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type PaymentMethodType = "visa" | "jazzcash" | "easypaisa";

const validationSchema = Yup.object({
  type: Yup.string()
    .oneOf(["visa", "jazzcash", "easypaisa"], "Invalid payment method type")
    .required("Payment method type is required"),
  cardNumber: Yup.string().when("type", {
    is: "visa",
    then: (schema) => schema.required("Card number is required"),
    otherwise: (schema) => schema.notRequired(),
  }),
  cardName: Yup.string().when("type", {
    is: "visa",
    then: (schema) => schema.required("Cardholder name is required"),
    otherwise: (schema) => schema.notRequired(),
  }),
  cardExpiry: Yup.string().when("type", {
    is: "visa",
    then: (schema) => schema.required("Expiry date is required"),
    otherwise: (schema) => schema.notRequired(),
  }),
  cardCvc: Yup.string().when("type", {
    is: "visa",
    then: (schema) => schema.required("CVC is required"),
    otherwise: (schema) => schema.notRequired(),
  }),
  phoneNumber: Yup.string().when("type", {
    is: (val: string) => val === "jazzcash" || val === "easypaisa",
    then: (schema) => schema.required("Phone number is required"),
    otherwise: (schema) => schema.notRequired(),
  }),
  accountName: Yup.string(),
});

function CardForm({ 
  onSuccess, 
  onClose,
  cardName,
  setCardName 
}: { 
  onSuccess: () => void; 
  onClose: () => void;
  cardName: string;
  setCardName: (name: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setCardError(null);
    
    try {
      const cardNumberElement = elements.getElement(CardNumberElement);
      const cardExpiryElement = elements.getElement(CardExpiryElement);
      const cardCvcElement = elements.getElement(CardCvcElement);

      if (!cardNumberElement || !cardExpiryElement || !cardCvcElement) {
        throw new Error("Card elements not found");
      }

      if (!cardName.trim()) {
        setCardError("Cardholder name is required");
        setLoading(false);
        return;
      }

      // Create payment method in Stripe
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardNumberElement,
        billing_details: {
          name: cardName,
        },
      });

      if (error) {
        setCardError(error.message);
        throw new Error(error.message);
      }

      if (!paymentMethod) {
        throw new Error("Failed to create payment method");
      }

      // Save payment method to backend
      await paymentService.createPaymentMethod({
        type: "visa",
        provider: "stripe",
        paymentMethodId: paymentMethod.id,
        accountName: cardName,
      });

      showToast("Payment method added successfully", "success");
      onSuccess();
    } catch (error: unknown) {
      console.error("Failed to add payment method:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add payment method";
      if (!cardError) {
        showToast(errorMessage, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const cardElementStyle = {
    base: {
      fontSize: "16px",
      color: "#ffffff",
      fontFamily: "inherit",
      "::placeholder": {
        color: "#71717a",
      },
    },
    invalid: {
      color: "#ef4444",
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Cardholder Name *
        </label>
        <input
          type="text"
          value={cardName}
          onChange={(e) => setCardName(e.target.value)}
          placeholder="John Doe"
          className="w-full px-4 py-2 rounded-lg border bg-zinc-800 text-white placeholder-zinc-500 border-zinc-700 focus:outline-none focus:ring-1 focus:border-white focus:ring-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Card Number *
        </label>
        <div className="p-4 bg-zinc-800 rounded-lg border border-zinc-700">
          <CardNumberElement
            options={{
              style: cardElementStyle,
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Expiry Date *
          </label>
          <div className="p-4 bg-zinc-800 rounded-lg border border-zinc-700">
            <CardExpiryElement
              options={{
                style: cardElementStyle,
              }}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            CVV *
          </label>
          <div className="p-4 bg-zinc-800 rounded-lg border border-zinc-700">
            <CardCvcElement
              options={{
                style: cardElementStyle,
              }}
            />
          </div>
        </div>
      </div>

      {cardError && (
        <p className="text-sm text-red-500">{cardError}</p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="flex-1 px-4 py-2 bg-white text-black rounded-lg hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? "Adding..." : "Add Card"}
        </button>
      </div>
    </form>
  );
}

export default function AddPaymentMethodModal({
  onClose,
  onSuccess,
}: AddPaymentMethodModalProps) {
  const [type, setType] = useState<PaymentMethodType>("visa");
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cardName, setCardName] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    const loadStripeKey = async () => {
      try {
        setStripeError(null);
        const key = await paymentService.getStripeKey();
        if (key && key.trim() !== "") {
          setStripePromise(loadStripe(key));
        } else {
          setStripeError("Stripe is not configured. Please contact support.");
        }
      } catch (error) {
        console.error("Failed to load Stripe key:", error);
        setStripeError("Failed to load payment form. Please try again later.");
      }
    };
    loadStripeKey();
  }, []);

  const formik = useFormik({
    initialValues: {
      type: "visa" as PaymentMethodType,
      phoneNumber: "",
      accountName: "",
    },
    validationSchema,
    onSubmit: async (values) => {
      if (values.type === "visa") {
        // Visa is handled by CardForm component
        return;
      }

      setLoading(true);
      try {
        await paymentService.createPaymentMethod({
          type: values.type,
          provider: values.type,
          phoneNumber: values.phoneNumber,
          accountName: values.accountName || undefined,
        });
        showToast("Payment method added successfully", "success");
        onSuccess();
      } catch (error: unknown) {
        console.error("Failed to add payment method:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to add payment method";
        showToast(errorMessage, "error");
      } finally {
        setLoading(false);
      }
    },
  });

  const stripeOptions: StripeElementsOptions = {
    mode: "payment",
    currency: "usd",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-md border border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Add Payment Method</h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Payment Method Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-300 mb-3">
            Payment Method Type
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => {
                setType("visa");
                formik.setFieldValue("type", "visa");
              }}
              className={`p-4 rounded-lg border-2 transition-all ${
                type === "visa"
                  ? "border-white bg-white text-black"
                  : "border-zinc-700 bg-zinc-800 text-white hover:border-zinc-600"
              }`}
            >
              <CreditCard className="w-6 h-6 mx-auto mb-2" />
              <span className="text-xs font-medium">Visa Card</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setType("jazzcash");
                formik.setFieldValue("type", "jazzcash");
              }}
              className={`p-4 rounded-lg border-2 transition-all ${
                type === "jazzcash"
                  ? "border-white bg-white text-black"
                  : "border-zinc-700 bg-zinc-800 text-white hover:border-zinc-600"
              }`}
            >
              <Phone className="w-6 h-6 mx-auto mb-2" />
              <span className="text-xs font-medium">JazzCash</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setType("easypaisa");
                formik.setFieldValue("type", "easypaisa");
              }}
              className={`p-4 rounded-lg border-2 transition-all ${
                type === "easypaisa"
                  ? "border-white bg-white text-black"
                  : "border-zinc-700 bg-zinc-800 text-white hover:border-zinc-600"
              }`}
            >
              <Wallet className="w-6 h-6 mx-auto mb-2" />
              <span className="text-xs font-medium">EasyPaisa</span>
            </button>
          </div>
        </div>

        {/* Form Content */}
        {type === "visa" ? (
          stripeError ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">{stripeError}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
              >
                Close
              </button>
            </div>
          ) : stripePromise ? (
            <Elements stripe={stripePromise} options={stripeOptions}>
              <CardForm 
                onSuccess={onSuccess} 
                onClose={onClose}
                cardName={cardName}
                setCardName={setCardName}
              />
            </Elements>
          ) : (
            <div className="text-center py-8 text-zinc-400">
              Loading payment form...
            </div>
          )
        ) : (
          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="phoneNumber"
                className="block text-sm font-medium text-zinc-300 mb-2"
              >
                Phone Number *
              </label>
              <input
                id="phoneNumber"
                type="tel"
                className="w-full px-4 py-2 rounded-lg border bg-zinc-800 text-white placeholder-zinc-500 border-zinc-700 focus:outline-none focus:ring-1 focus:border-white focus:ring-white"
                placeholder="03XX-XXXXXXX"
                {...formik.getFieldProps("phoneNumber")}
              />
              {formik.touched.phoneNumber && formik.errors.phoneNumber && (
                <p className="mt-1 text-xs text-red-500">
                  {formik.errors.phoneNumber}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="accountName"
                className="block text-sm font-medium text-zinc-300 mb-2"
              >
                Account Name (Optional)
              </label>
              <input
                id="accountName"
                type="text"
                className="w-full px-4 py-2 rounded-lg border bg-zinc-800 text-white placeholder-zinc-500 border-zinc-700 focus:outline-none focus:ring-1 focus:border-white focus:ring-white"
                placeholder="Account holder name"
                {...formik.getFieldProps("accountName")}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-white text-black rounded-lg hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? "Adding..." : "Add Payment Method"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

