import { Request, Response, NextFunction } from "express";
import prisma from "../db.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import { UserRequest } from "../types.js";
import Email from "../utils/email.js";

// Checkout (Convert cart to order)
export const checkout = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  // 1. Get user's cart and items
  const cart = await prisma.cart.findUnique({
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

  if (!cart || cart.items.length === 0) {
    return next(new AppError("Your cart is empty", 400));
  }

  // 2. Validate stock for all items and calculate total
  let totalAmount = 0;
  for (const item of cart.items) {
    // Check stock based on whether product has sizes enabled
    if (item.product.sizeEnabled && item.size) {
      const productSize = await prisma.productSize.findUnique({
        where: {
          productId_size: {
            productId: item.productId,
            size: item.size,
          },
        },
      });
      if (!productSize || productSize.stock < item.quantity) {
        return next(new AppError(`Not enough stock for ${item.product.name} (Size: ${item.size})`, 400));
      }
    } else {
      if (item.product.stock < item.quantity) {
        return next(new AppError(`Not enough stock for ${item.product.name}`, 400));
      }
    }
    totalAmount += item.product.price * item.quantity;
  }

  // 3. Get shipping address, payment method, and phone number from request body
  const { shippingAddress, paymentMethod, phoneNumber } = req.body;

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
        phoneNumber: phoneNumber || null,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price, // Store price at time of purchase
            size: item.size || null,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Update product stock (and size stock if applicable)
    for (const item of cart.items) {
      if (item.product.sizeEnabled && item.size) {
        // Update size stock
        await tx.productSize.updateMany({
          where: {
            productId: item.productId,
            size: item.size,
          },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        // Recalculate total product stock from all sizes
        const allSizes = await tx.productSize.findMany({
          where: { productId: item.productId },
        });
        const totalStock = allSizes.reduce((sum, s) => sum + s.stock, 0);
        
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: totalStock,
          },
        });
      } else {
        // Update regular product stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }
    }

    // Clear cart items
    await tx.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return newOrder;
  });

  // Send order confirmation email
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { email: true, name: true },
    });
    
    if (user) {
      const email = new Email(user, '');
      await email.sendOrderConfirmation(order, user);
    }
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    // Don't fail the request if email fails
  }

  res.status(201).json({
    status: "success",
    data: { order },
  });
});

// Guest Checkout (No authentication required)
export const guestCheckout = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { items, shippingAddress, paymentMethod, phoneNumber, customerEmail, customerName } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return next(new AppError("Cart is empty", 400));
  }

  if (!customerEmail || !customerName) {
    return next(new AppError("Customer email and name are required", 400));
  }

  // 1. Validate all products exist and calculate total
  let totalAmount = 0;
  const validatedItems = [];

  for (const item of items) {
    const { productId, quantity, size, price } = item;

    if (!productId || !quantity || !price) {
      return next(new AppError("Invalid cart item: missing required fields", 400));
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        sizes: true,
      },
    });

    if (!product) {
      return next(new AppError(`Product with ID ${productId} not found`, 404));
    }

    // Validate stock
    if (product.sizeEnabled && size) {
      const productSize = await prisma.productSize.findUnique({
        where: {
          productId_size: {
            productId: product.id,
            size: size,
          },
        },
      });
      if (!productSize || productSize.stock < quantity) {
        return next(new AppError(`Not enough stock for ${product.name} (Size: ${size})`, 400));
      }
    } else {
      if (product.stock < quantity) {
        return next(new AppError(`Not enough stock for ${product.name}`, 400));
      }
    }

    totalAmount += price * quantity;
    validatedItems.push({
      productId,
      quantity,
      size: size || null,
      price,
      product,
    });
  }

  // 2. Create order and order items (using transaction)
  const order = await prisma.$transaction(async (tx) => {
    // Create the guest order - userId must be explicitly set to null for guest orders
    // Using type assertion to work around Prisma's strict type checking for optional relations
    const newOrder = await tx.order.create({
      data: {
        userId: null,
        totalAmount,
        status: "pending",
        shippingAddress: shippingAddress || null,
        paymentMethod: paymentMethod || null,
        phoneNumber: phoneNumber || null,
        customerEmail: customerEmail.toLowerCase().trim(),
        customerName: customerName,
        items: {
          create: validatedItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            size: item.size,
          })),
        },
      } as any,
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Update product stock
    for (const item of validatedItems) {
      if (item.product.sizeEnabled && item.size) {
        // Update size stock
        await tx.productSize.updateMany({
          where: {
            productId: item.productId,
            size: item.size,
          },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        // Recalculate total product stock from all sizes
        const allSizes = await tx.productSize.findMany({
          where: { productId: item.productId },
        });
        const totalStock = allSizes.reduce((sum, s) => sum + s.stock, 0);
        
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: totalStock,
          },
        });
      } else {
        // Update regular product stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }
    }

    return newOrder;
  });

  // Send order confirmation email to guest
  try {
    const guestUser = { email: customerEmail, name: customerName };
    const email = new Email(guestUser, '');
    await email.sendOrderConfirmation(order, guestUser);
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    // Don't fail the request if email fails
  }

  res.status(201).json({
    status: "success",
    data: { order },
  });
});

// Get user's order history (includes both user orders and guest orders by email)
export const getMyOrders = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { email: true },
  });

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Get orders by userId OR by customerEmail (for guest orders)
  // Normalize email to lowercase for case-insensitive matching
  const normalizedEmail = user.email.toLowerCase().trim();
  const { includeArchived } = req.query;
  
  const where: any = {
    OR: [
      { userId: req.user!.id },
      { customerEmail: normalizedEmail },
    ],
  };
  
  // Filter archived orders unless includeArchived is true
  if (includeArchived !== 'true') {
    where.isArchived = false;
  }
  
  const orders = await prisma.order.findMany({
    where,
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

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  // Admin can access any order
  if (req.user!.role === "admin") {
    return res.status(200).json({
      status: "success",
      data: { order },
    });
  }

  // User can access their own orders (by userId) or guest orders (by email)
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { email: true },
  });

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  const canAccess = 
    order.userId === req.user!.id || 
    (order.customerEmail && order.customerEmail.toLowerCase() === user.email.toLowerCase());

  if (!canAccess) {
    return next(new AppError("Order not found or access denied", 404));
  }

  res.status(200).json({
    status: "success",
    data: { order },
  });
});

// Archive order (user can archive their own orders)
export const archiveOrder = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const orderId = parseInt(req.params.id);

    if (isNaN(orderId)) {
      return next(new AppError("Invalid order ID", 400));
    }

    // Get user email for guest order check
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { email: true },
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    const normalizedEmail = user.email.toLowerCase().trim();

    // Find order and verify ownership
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        OR: [
          { userId: req.user!.id },
          { customerEmail: normalizedEmail },
        ],
      },
    });

    if (!order) {
      return next(new AppError("Order not found or access denied", 404));
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { isArchived: true },
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
      data: { order: updatedOrder },
    });
  }
);

// Unarchive order (user can unarchive their own orders)
export const unarchiveOrder = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const orderId = parseInt(req.params.id);

    if (isNaN(orderId)) {
      return next(new AppError("Invalid order ID", 400));
    }

    // Get user email for guest order check
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { email: true },
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    const normalizedEmail = user.email.toLowerCase().trim();

    // Find order and verify ownership
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        OR: [
          { userId: req.user!.id },
          { customerEmail: normalizedEmail },
        ],
      },
    });

    if (!order) {
      return next(new AppError("Order not found or access denied", 404));
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { isArchived: false },
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
      data: { order: updatedOrder },
    });
  }
);
