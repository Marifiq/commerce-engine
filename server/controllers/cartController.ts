import { Request, Response, NextFunction } from "express";
import prisma from "../db.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import { UserRequest } from "../types.js";

// Get user's cart
export const getMyCart = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  let cart = await prisma.cart.findUnique({
    where: { userId: req.user!.id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  // If no cart exists, create one
  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId: req.user!.id! },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  res.status(200).json({
    status: "success",
    data: { cart },
  });
});

// Add item to cart
export const addToCart = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const { productId, quantity } = req.body;

  if (!productId || !quantity) {
    return next(new AppError("Please provide product ID and quantity", 400));
  }

  // 1. Find or create user's cart
  let cart = await prisma.cart.findUnique({
    where: { userId: req.user!.id },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId: req.user!.id! },
    });
  }

  // 2. Check if product exists and has enough stock
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  if (product.stock < quantity) {
    return next(new AppError("Not enough stock available", 400));
  }

  // 3. Check if item already in cart
  const existingItem = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId: productId,
    },
  });

  if (existingItem) {
    // Update quantity
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + quantity },
    });
  } else {
    // Add new item
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: productId,
        quantity: quantity,
      },
    });
  }

  // 4. Return updated cart
  const updatedCart = await prisma.cart.findUnique({
    where: { userId: req.user!.id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  res.status(200).json({
    status: "success",
    data: { cart: updatedCart },
  });
});

// Remove item from cart
export const removeFromCart = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const { cartItemId } = req.params;

  const item = await prisma.cartItem.findUnique({
    where: { id: parseInt(cartItemId) },
    include: { cart: true },
  });

  if (!item || item.cart.userId !== req.user!.id) {
    return next(new AppError("Item not found in your cart", 404));
  }

  await prisma.cartItem.delete({
    where: { id: parseInt(cartItemId) },
  });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// Update cart item quantity
export const updateCartItemQuantity = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const { cartItemId } = req.params;
  const { quantity } = req.body;

  if (quantity < 1) {
    return next(new AppError("Quantity must be at least 1", 400));
  }

  const item = await prisma.cartItem.findUnique({
    where: { id: parseInt(cartItemId) },
    include: { cart: true, product: true },
  });

  if (!item || item.cart.userId !== req.user!.id) {
    return next(new AppError("Item not found in your cart", 404));
  }

  if (item.product.stock < quantity) {
    return next(new AppError("Not enough stock available", 400));
  }

  const updatedItem = await prisma.cartItem.update({
    where: { id: parseInt(cartItemId) },
    data: { quantity },
    include: { product: true },
  });

  res.status(200).json({
    status: "success",
    data: { item: updatedItem },
  });
});
