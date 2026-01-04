import { Request, Response, NextFunction } from "express";
import prisma from "../db.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import { UserRequest } from "../types.js";
import Stripe from "stripe";

// Initialize Stripe only if API key is provided
const getStripe = (): Stripe | null => {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey || stripeKey.trim() === "") {
    return null;
  }
  return new Stripe(stripeKey, {
    apiVersion: "2024-12-18.acacia",
    typescript: true,
  });
};

// Get all payment methods for the current user
export const getPaymentMethods = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const paymentMethods = await prisma.paymentMethod.findMany({
      where: { userId: req.user!.id },
      orderBy: [
        { isDefault: "desc" },
        { createdAt: "desc" },
      ],
    });

    res.status(200).json({
      status: "success",
      results: paymentMethods.length,
      data: { paymentMethods },
    });
  }
);

// Get a single payment method
export const getPaymentMethod = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const paymentMethodId = parseInt(req.params.id);

    if (isNaN(paymentMethodId)) {
      return next(new AppError("Invalid payment method ID", 400));
    }

    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: {
        id: paymentMethodId,
        userId: req.user!.id,
      },
    });

    if (!paymentMethod) {
      return next(new AppError("Payment method not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: { paymentMethod },
    });
  }
);

// Create a payment method
export const createPaymentMethod = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const { type, provider, phoneNumber, accountName, paymentMethodId } = req.body;

    // Validate required fields based on type
    if (type === "visa" || type === "card") {
      if (!paymentMethodId) {
        return next(new AppError("Payment method ID is required for card", 400));
      }

      // Attach payment method to customer in Stripe
      const stripe = getStripe();
      if (!stripe) {
        return next(new AppError("Stripe is not configured. Please contact support.", 503));
      }

      let customerId: string | null = null;
      
      // Check if user has a Stripe customer ID stored (you might want to add this to User model)
      // For now, we'll create or retrieve customer
      try {
        // Try to retrieve payment method from Stripe
        const stripePaymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
        
        // Get or create Stripe customer
        const customers = await stripe.customers.list({
          email: req.user!.email,
          limit: 1,
        });

        if (customers.data.length > 0) {
          customerId = customers.data[0].id;
        } else {
          const customer = await stripe.customers.create({
            email: req.user!.email,
            name: req.user!.name,
            metadata: {
              userId: req.user!.id.toString(),
            },
          });
          customerId = customer.id;
        }

        // Attach payment method to customer
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: customerId,
        });

        // Set as default if no other payment methods exist
        const existingMethods = await prisma.paymentMethod.count({
          where: { userId: req.user!.id },
        });

        const isDefault = existingMethods === 0;

        // If setting as default, unset other defaults
        if (isDefault) {
          await prisma.paymentMethod.updateMany({
            where: { userId: req.user!.id, isDefault: true },
            data: { isDefault: false },
          });
        }

        const paymentMethod = await prisma.paymentMethod.create({
          data: {
            userId: req.user!.id,
            type: "visa",
            provider: "stripe",
            last4: stripePaymentMethod.card?.last4 || "",
            brand: stripePaymentMethod.card?.brand || "",
            stripeId: paymentMethodId,
            accountName: accountName || req.user!.name,
            isDefault,
          },
        });

        res.status(201).json({
          status: "success",
          data: { paymentMethod },
        });
      } catch (error: any) {
        return next(new AppError(error.message || "Failed to create payment method", 400));
      }
    } else if (type === "jazzcash" || type === "easypaisa") {
      if (!phoneNumber) {
        return next(new AppError("Phone number is required", 400));
      }

      const existingMethods = await prisma.paymentMethod.count({
        where: { userId: req.user!.id },
      });

      const isDefault = existingMethods === 0;

      if (isDefault) {
        await prisma.paymentMethod.updateMany({
          where: { userId: req.user!.id, isDefault: true },
          data: { isDefault: false },
        });
      }

      const paymentMethod = await prisma.paymentMethod.create({
        data: {
          userId: req.user!.id,
          type: type === "jazzcash" ? "jazzcash" : "easypaisa",
          provider: type === "jazzcash" ? "jazzcash" : "easypaisa",
          phoneNumber,
          accountName: accountName || req.user!.name,
          isDefault,
        },
      });

      res.status(201).json({
        status: "success",
        data: { paymentMethod },
      });
    } else {
      return next(new AppError("Invalid payment method type", 400));
    }
  }
);

// Update payment method (mainly for setting as default)
export const updatePaymentMethod = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const paymentMethodId = parseInt(req.params.id);
    const { isDefault, phoneNumber, accountName } = req.body;

    if (isNaN(paymentMethodId)) {
      return next(new AppError("Invalid payment method ID", 400));
    }

    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: {
        id: paymentMethodId,
        userId: req.user!.id,
      },
    });

    if (!paymentMethod) {
      return next(new AppError("Payment method not found", 404));
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.paymentMethod.updateMany({
        where: {
          userId: req.user!.id,
          isDefault: true,
          id: { not: paymentMethodId },
        },
        data: { isDefault: false },
      });
    }

    const updateData: any = {};
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (accountName !== undefined) updateData.accountName = accountName;

    const updatedPaymentMethod = await prisma.paymentMethod.update({
      where: { id: paymentMethodId },
      data: updateData,
    });

    res.status(200).json({
      status: "success",
      data: { paymentMethod: updatedPaymentMethod },
    });
  }
);

// Delete payment method
export const deletePaymentMethod = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const paymentMethodId = parseInt(req.params.id);

    if (isNaN(paymentMethodId)) {
      return next(new AppError("Invalid payment method ID", 400));
    }

    const paymentMethod = await prisma.paymentMethod.findFirst({
      where: {
        id: paymentMethodId,
        userId: req.user!.id,
      },
    });

    if (!paymentMethod) {
      return next(new AppError("Payment method not found", 404));
    }

    // If it's a Stripe payment method, detach it from customer
    if (paymentMethod.stripeId) {
      const stripe = getStripe();
      if (stripe) {
        try {
          await stripe.paymentMethods.detach(paymentMethod.stripeId);
        } catch (error) {
          // Continue even if Stripe detach fails
          console.error("Failed to detach payment method from Stripe:", error);
        }
      }
    }

    await prisma.paymentMethod.delete({
      where: { id: paymentMethodId },
    });

    res.status(204).json({
      status: "success",
      data: null,
    });
  }
);

// Create Stripe payment intent (for checkout)
export const createPaymentIntent = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const { amount, paymentMethodId, currency = "usd" } = req.body;

    if (!amount || amount <= 0) {
      return next(new AppError("Invalid amount", 400));
    }

    const stripe = getStripe();
    if (!stripe) {
      return next(new AppError("Stripe is not configured. Please contact support.", 503));
    }

    try {
      // Get or create Stripe customer
      const customers = await stripe.customers.list({
        email: req.user!.email,
        limit: 1,
      });

      let customerId: string;
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: req.user!.email,
          name: req.user!.name,
          metadata: {
            userId: req.user!.id.toString(),
          },
        });
        customerId = customer.id;
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        customer: customerId,
        payment_method: paymentMethodId,
        confirm: true,
        return_url: `${process.env.CLIENT_URL || "http://localhost:3000"}/orders`,
      });

      res.status(200).json({
        status: "success",
        data: {
          paymentIntent: {
            id: paymentIntent.id,
            status: paymentIntent.status,
            clientSecret: paymentIntent.client_secret,
          },
        },
      });
    } catch (error: any) {
      return next(new AppError(error.message || "Failed to create payment intent", 400));
    }
  }
);

// Get Stripe publishable key
export const getStripeKey = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
      status: "success",
      data: {
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
      },
    });
  }
);

