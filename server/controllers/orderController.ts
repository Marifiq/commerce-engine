import { Request, Response, NextFunction } from "express";
import prisma from "../db.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import { UserRequest } from "../types.js";

// Checkout (Convert cart to order)
export const checkout = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  // 1. Get user's cart and items
  const cart = await prisma.cart.findUnique({
    where: { userId: req.user!.id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    return next(new AppError("Your cart is empty", 400));
  }

  // 2. Validate stock for all items and calculate total
  let totalAmount = 0;
  for (const item of cart.items) {
    if (item.product.stock < item.quantity) {
      return next(new AppError(`Not enough stock for ${item.product.name}`, 400));
    }
    totalAmount += item.product.price * item.quantity;
  }

  // 3. Get shipping address and payment method from request body
  const { shippingAddress, paymentMethod } = req.body;

  // 3. Create order and order items (using transaction)
  const order = await prisma.$transaction(async (tx) => {
    // Create the order
    const newOrder = await tx.order.create({
      data: {
        userId: req.user!.id!,
        totalAmount,
        status: "pending",
        shippingAddress: shippingAddress || null,
        paymentMethod: paymentMethod || null,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price, // Store price at time of purchase
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Update product stock
    for (const item of cart.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    // Clear cart items
    await tx.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return newOrder;
  });

  res.status(201).json({
    status: "success",
    data: { order },
  });
});

// Get user's order history
export const getMyOrders = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user!.id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  res.status(200).json({
    status: "success",
    results: orders.length,
    data: { orders },
  });
});

// Get single order details
export const getOrder = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const order = await prisma.order.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order || (order.userId !== req.user!.id && req.user!.role !== "admin")) {
    return next(new AppError("Order not found or access denied", 404));
  }

  res.status(200).json({
    status: "success",
    data: { order },
  });
});
