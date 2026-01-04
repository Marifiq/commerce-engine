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
          product: {
            include: {
              sizes: true,
            },
          },
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
            product: {
              include: {
                sizes: true,
              },
            },
          },
        },
      },
    });
  }

  // Enrich cart items with stock availability information
  const enrichedItems = cart.items.map(item => {
    let availableStock = 0;
    let isOutOfStock = false;

    if (item.product.sizeEnabled && item.size) {
      const productSize = item.product.sizes.find(s => s.size === item.size);
      availableStock = productSize?.stock || 0;
      isOutOfStock = availableStock < item.quantity;
    } else {
      availableStock = item.product.stock || 0;
      isOutOfStock = availableStock < item.quantity;
    }

    return {
      ...item,
      availableStock,
      isOutOfStock,
    };
  });

  res.status(200).json({
    status: "success",
    data: { 
      cart: {
        ...cart,
        items: enrichedItems,
      }
    },
  });
});

// Add item to cart
export const addToCart = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const { productId, quantity, size } = req.body;

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

  // 2. Check if product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      sizes: true,
    },
  });

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  // 3. Handle size-enabled products
  if (product.sizeEnabled) {
    if (!size) {
      return next(new AppError("Please select a size", 400));
    }

    const productSize = product.sizes.find(s => s.size === size.trim());
    if (!productSize) {
      return next(new AppError("Invalid size selected", 400));
    }

    // Check if item with same size already in cart FIRST
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: productId,
        size: size.trim(),
      },
    });

    // Calculate total quantity that would be in cart after adding
    const totalQuantity = existingItem ? existingItem.quantity + quantity : quantity;

    // Check if total quantity exceeds available stock
    if (productSize.stock < totalQuantity) {
      return next(new AppError(`Not enough stock available for size ${size}`, 400));
    }

    if (existingItem) {
      // Update quantity
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      // Add new item with size
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: productId,
          quantity: quantity,
          size: size.trim(),
        },
      });
    }
  } else {
    // Handle non-size products
    // Check if item already in cart (without size) FIRST
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: productId,
        size: null,
      },
    });

    // Calculate total quantity that would be in cart after adding
    const totalQuantity = existingItem ? existingItem.quantity + quantity : quantity;

    // Check if total quantity exceeds available stock
    if (product.stock < totalQuantity) {
      return next(new AppError("Not enough stock available", 400));
    }

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
  }

  // 4. Return updated cart with stock information
  const updatedCart = await prisma.cart.findUnique({
    where: { userId: req.user!.id },
    include: {
      items: {
        include: {
          product: {
            include: {
              sizes: true,
            },
          },
        },
      },
    },
  });

  // Enrich cart items with stock availability information
  const enrichedItems = updatedCart?.items.map(item => {
    let availableStock = 0;
    let isOutOfStock = false;

    if (item.product.sizeEnabled && item.size) {
      const productSize = item.product.sizes.find(s => s.size === item.size);
      availableStock = productSize?.stock || 0;
      isOutOfStock = availableStock < item.quantity;
    } else {
      availableStock = item.product.stock || 0;
      isOutOfStock = availableStock < item.quantity;
    }

    return {
      ...item,
      availableStock,
      isOutOfStock,
    };
  }) || [];

  res.status(200).json({
    status: "success",
    data: { 
      cart: {
        ...updatedCart,
        items: enrichedItems,
      }
    },
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
  const { quantity, size } = req.body;

  if (quantity < 1) {
    return next(new AppError("Quantity must be at least 1", 400));
  }

  const item = await prisma.cartItem.findUnique({
    where: { id: parseInt(cartItemId) },
    include: { 
      cart: true, 
      product: {
        include: {
          sizes: true,
        },
      },
    },
  });

  if (!item || item.cart.userId !== req.user!.id) {
    return next(new AppError("Item not found in your cart", 404));
  }

  // Handle size update for size-enabled products
  if (item.product.sizeEnabled && size !== undefined) {
    // Validate the new size
    const productSize = item.product.sizes.find(s => s.size === size.trim());
    if (!productSize) {
      return next(new AppError("Invalid size selected", 400));
    }

    // Check stock for the new size
    if (productSize.stock < quantity) {
      return next(new AppError(`Not enough stock available for size ${size.trim()}`, 400));
    }

    // If size is changing, check if there's already an item with the new size
    const newSize = size.trim();
    if (item.size !== newSize) {
      const existingItemWithNewSize = await prisma.cartItem.findFirst({
        where: {
          cartId: item.cartId,
          productId: item.productId,
          size: newSize,
        },
      });

      if (existingItemWithNewSize) {
        // Merge quantities: add current item's quantity to existing item, then delete current item
        const totalQuantity = existingItemWithNewSize.quantity + quantity;
        if (productSize.stock < totalQuantity) {
          return next(new AppError(`Not enough stock available for size ${newSize}. Only ${productSize.stock} available.`, 400));
        }

        await prisma.$transaction([
          prisma.cartItem.update({
            where: { id: existingItemWithNewSize.id },
            data: { quantity: totalQuantity },
          }),
          prisma.cartItem.delete({
            where: { id: parseInt(cartItemId) },
          }),
        ]);

        // Fetch the updated item
        const updatedItem = await prisma.cartItem.findUnique({
          where: { id: existingItemWithNewSize.id },
          include: { 
            product: {
              include: {
                sizes: true,
              },
            },
          },
        });

        // Enrich item with stock availability information
        const productSizeData = updatedItem!.product.sizes.find(s => s.size === updatedItem!.size);
        const availableStock = productSizeData?.stock || 0;
        const isOutOfStock = availableStock < updatedItem!.quantity;

        const enrichedItem = {
          ...updatedItem!,
          availableStock,
          isOutOfStock,
        };

        return res.status(200).json({
          status: "success",
          data: { item: enrichedItem },
        });
      } else {
        // Update current item with new size
        const updatedItem = await prisma.cartItem.update({
          where: { id: parseInt(cartItemId) },
          data: { quantity, size: newSize },
          include: { 
            product: {
              include: {
                sizes: true,
              },
            },
          },
        });

        // Enrich item with stock availability information
        const productSizeData = updatedItem.product.sizes.find(s => s.size === updatedItem.size);
        const availableStock = productSizeData?.stock || 0;
        const isOutOfStock = availableStock < updatedItem.quantity;

        const enrichedItem = {
          ...updatedItem,
          availableStock,
          isOutOfStock,
        };

        return res.status(200).json({
          status: "success",
          data: { item: enrichedItem },
        });
      }
    }
  }

  // If size is not changing or product doesn't have sizes, just update quantity
  // Check stock based on current size
  if (item.product.sizeEnabled && item.size) {
    const productSize = item.product.sizes.find(s => s.size === item.size);
    if (!productSize || productSize.stock < quantity) {
      return next(new AppError(`Not enough stock available for size ${item.size}`, 400));
    }
  } else {
    if (item.product.stock < quantity) {
      return next(new AppError("Not enough stock available", 400));
    }
  }

  const updatedItem = await prisma.cartItem.update({
    where: { id: parseInt(cartItemId) },
    data: { quantity },
    include: { 
      product: {
        include: {
          sizes: true,
        },
      },
    },
  });

  // Enrich item with stock availability information
  let availableStock = 0;
  let isOutOfStock = false;

  if (updatedItem.product.sizeEnabled && updatedItem.size) {
    const productSize = updatedItem.product.sizes.find(s => s.size === updatedItem.size);
    availableStock = productSize?.stock || 0;
    isOutOfStock = availableStock < updatedItem.quantity;
  } else {
    availableStock = updatedItem.product.stock || 0;
    isOutOfStock = availableStock < updatedItem.quantity;
  }

  const enrichedItem = {
    ...updatedItem,
    availableStock,
    isOutOfStock,
  };

  res.status(200).json({
    status: "success",
    data: { item: enrichedItem },
  });
});
