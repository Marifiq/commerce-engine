import { Request, Response, NextFunction } from "express";
import prisma from "../db.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import { UserRequest } from "../types.js";
import Email from "../utils/email.js";

// Get dashboard statistics
export const getStats = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  // Get all orders with dates and userId
  const orders = await prisma.order.findMany({
    select: {
      totalAmount: true,
      status: true,
      createdAt: true,
      userId: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalOrders = orders.length;
  const totalProducts = await prisma.product.count();
  const totalUsers = await prisma.user.count();

  // Calculate revenue for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentRevenue = orders
    .filter(order => new Date(order.createdAt) >= thirtyDaysAgo)
    .reduce((sum, order) => sum + order.totalAmount, 0);

  // Calculate revenue for last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const weekRevenue = orders
    .filter(order => new Date(order.createdAt) >= sevenDaysAgo)
    .reduce((sum, order) => sum + order.totalAmount, 0);

  // Get orders by status
  const ordersByStatus = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get revenue over last 12 months
  const monthlyRevenue: Record<string, number> = {};
  orders.forEach(order => {
    const date = new Date(order.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + order.totalAmount;
  });

  // Get revenue over last 30 days (daily)
  const dailyRevenue: Record<string, number> = {};
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split('T')[0];
  });

  last30Days.forEach(date => {
    dailyRevenue[date] = 0;
  });

  orders
    .filter(order => {
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
      return last30Days.includes(orderDate);
    })
    .forEach(order => {
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + order.totalAmount;
    });

  // Get orders count over last 30 days (daily)
  const dailyOrders: Record<string, number> = {};
  last30Days.forEach(date => {
    dailyOrders[date] = 0;
  });

  orders
    .filter(order => {
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
      return last30Days.includes(orderDate);
    })
    .forEach(order => {
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      dailyOrders[date] = (dailyOrders[date] || 0) + 1;
    });

  // Get user growth over last 12 months
  const users = await prisma.user.findMany({
    select: {
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  const monthlyUsers: Record<string, number> = {};
  users.forEach(user => {
    const date = new Date(user.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyUsers[monthKey] = (monthlyUsers[monthKey] || 0) + 1;
  });

  // Get products by category
  const products = await prisma.product.findMany({
    select: {
      category: true,
    },
  });

  const productsByCategory = products.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get revenue by category
  const orderItems = await prisma.orderItem.findMany({
    include: {
      product: {
        select: {
          category: true,
        },
      },
      order: {
        select: {
          createdAt: true,
        },
      },
    },
  });

  const revenueByCategory: Record<string, number> = {};
  orderItems.forEach(item => {
    const category = item.product.category;
    revenueByCategory[category] = (revenueByCategory[category] || 0) + (item.price * item.quantity);
  });

  // Get orders by category (count unique orders per category)
  const ordersByCategory: Record<string, number> = {};
  const categoryOrderMap = new Map<string, Set<number>>();
  
  orderItems.forEach(item => {
    const category = item.product.category;
    const orderId = item.orderId;
    
    if (!categoryOrderMap.has(category)) {
      categoryOrderMap.set(category, new Set());
    }
    categoryOrderMap.get(category)!.add(orderId);
  });
  
  categoryOrderMap.forEach((orderSet, category) => {
    ordersByCategory[category] = orderSet.size;
  });

  // Get top products by revenue
  const productRevenue: Record<number, { name: string; revenue: number; quantity: number }> = {};
  const productDetails = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
    },
  });
  const productMap = new Map(productDetails.map(p => [p.id, p.name]));

  orderItems.forEach(item => {
    const productId = item.productId;
    const productName = productMap.get(productId) || 'Unknown';
    if (!productRevenue[productId]) {
      productRevenue[productId] = {
        name: productName,
        revenue: 0,
        quantity: 0,
      };
    }
    productRevenue[productId].revenue += item.price * item.quantity;
    productRevenue[productId].quantity += item.quantity;
  });

  const topProducts = Object.entries(productRevenue)
    .map(([id, data]) => ({ id: parseInt(id), ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Get abandoned carts count
  const abandonedCarts = await prisma.cart.findMany({
    where: {
      items: {
        some: {},
      },
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              price: true,
            },
          },
        },
      },
    },
  });

  const abandonedCartsValue = abandonedCarts.reduce((sum, cart) => {
    return sum + cart.items.reduce((itemSum, item) => {
      return itemSum + (item.product.price * item.quantity);
    }, 0);
  }, 0);

  // Get average order value
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Get pending orders count
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'delivered').length;

  // Get orders by user type (signed-up vs guest) over last 30 days
  const ordersByUserType: Record<string, { signedUp: number; guest: number }> = {};
  last30Days.forEach(date => {
    ordersByUserType[date] = { signedUp: 0, guest: 0 };
  });

  orders
    .filter(order => {
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
      return last30Days.includes(orderDate);
    })
    .forEach(order => {
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      if (order.userId !== null) {
        ordersByUserType[date].signedUp += 1;
      } else {
        ordersByUserType[date].guest += 1;
      }
    });

  // Get newsletter subscribers over last 30 days (daily cumulative count)
  const newsletterSubscribers = await prisma.newsletterSubscriber.findMany({
    select: {
      createdAt: true,
      isActive: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  const dailyNewsletterSubscribers: Record<string, number> = {};
  last30Days.forEach(date => {
    dailyNewsletterSubscribers[date] = 0;
  });

  // Calculate cumulative count of active subscribers up to each date
  last30Days.forEach(date => {
    const dateObj = new Date(date);
    const count = newsletterSubscribers.filter(sub => {
      const subDate = new Date(sub.createdAt).toISOString().split('T')[0];
      return subDate <= date && sub.isActive;
    }).length;
    dailyNewsletterSubscribers[date] = count;
  });

  res.status(200).json({
    status: "success",
    data: {
      // Basic stats
      totalRevenue,
      totalOrders,
      totalProducts,
      totalUsers,
      recentRevenue,
      weekRevenue,
      averageOrderValue,
      pendingOrders,
      completedOrders,
      
      // Chart data
      ordersByStatus,
      monthlyRevenue,
      dailyRevenue,
      dailyOrders,
      monthlyUsers,
      productsByCategory,
      revenueByCategory,
      ordersByCategory,
      topProducts,
      abandonedCarts: abandonedCarts.length,
      ordersByUserType,
      dailyNewsletterSubscribers,
    },
  });
});

// Get all orders (admin)
export const getAllOrders = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const orders = await prisma.order.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
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

// Get single order (admin)
export const getOrder = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const order = await prisma.order.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
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

  res.status(200).json({
    status: "success",
    data: { order },
  });
});

// Update order status (admin)
export const updateOrderStatus = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const { status, estimatedDeliveryDays } = req.body;

  if (!status) {
    return next(new AppError("Please provide order status", 400));
  }

  // Get the existing order to check previous status
  const existingOrder = await prisma.order.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
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

  if (!existingOrder) {
    return next(new AppError("Order not found", 404));
  }

  // Prepare update data
  const updateData: any = { status };
  
  // If marking as shipped, include estimatedDeliveryDays if provided
  if (status === "shipped" && estimatedDeliveryDays !== undefined) {
    updateData.estimatedDeliveryDays = parseInt(estimatedDeliveryDays);
  }

  const order = await prisma.order.update({
    where: { id: parseInt(req.params.id) },
    data: updateData,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
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

  // Send shipping email if status changed to "shipped"
  if (status === "shipped" && existingOrder.status !== "shipped") {
    try {
      if (order.user && order.user.email) {
        const email = new Email(order.user, '');
        await email.sendOrderShipped(order, order.user);
      }
    } catch (error) {
      console.error('Failed to send shipping email:', error);
      // Don't fail the request if email fails
    }
  }

  res.status(200).json({
    status: "success",
    data: { order },
  });
});

// Update order details (admin) - Only for pending orders
export const updateOrder = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const orderId = parseInt(req.params.id);
  const { items, shippingAddress, paymentMethod, totalAmount } = req.body;

  if (isNaN(orderId)) {
    return next(new AppError("Invalid order ID", 400));
  }

  // Get the existing order
  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!existingOrder) {
    return next(new AppError("Order not found", 404));
  }

  // Check if order is in pending status
  if (existingOrder.status !== "pending") {
    return next(new AppError("Only pending orders can be edited", 400));
  }

  // Use transaction to ensure data consistency
  const updatedOrder = await prisma.$transaction(async (tx: any) => {
    // If items are being updated
    if (items && Array.isArray(items)) {
      // Step 1: Fetch all products that will be involved to get current stock
      const allProductIds = new Set<number>();
      for (const item of items) {
        allProductIds.add(item.productId);
      }
      for (const currentItem of existingOrder.items) {
        allProductIds.add(currentItem.productId);
      }

      const products = await tx.product.findMany({
        where: { id: { in: Array.from(allProductIds) } },
      });

      const productMap = new Map(products.map(p => [p.id, p]));

      // Step 2: Calculate how much stock will be restored per product
      const stockToRestore = new Map<number, number>();
      for (const currentItem of existingOrder.items) {
        stockToRestore.set(
          currentItem.productId,
          (stockToRestore.get(currentItem.productId) || 0) + currentItem.quantity
        );
      }

      // Step 3: Calculate how much stock is needed for new items
      const stockNeeded = new Map<number, number>();
      for (const item of items) {
        const productId = item.productId;
        const quantity = item.quantity || 1;
        stockNeeded.set(
          productId,
          (stockNeeded.get(productId) || 0) + quantity
        );
      }

      // Step 4: Validate stock availability
      // For each product: available stock = current stock + stock to restore - stock needed
      for (const [productId, neededQuantity] of stockNeeded.entries()) {
        const product = productMap.get(productId);
        if (!product) {
          throw new AppError(`Product with ID ${productId} not found`, 404);
        }

        const willRestore = stockToRestore.get(productId) || 0;
        const availableAfterRestore = product.stock + willRestore;

        if (availableAfterRestore < neededQuantity) {
          throw new AppError(
            `Not enough stock for ${product.name}. Available: ${availableAfterRestore}, Requested: ${neededQuantity}`,
            400
          );
        }
      }

      // Step 5: Restore stock for all current order items
      for (const currentItem of existingOrder.items) {
        await tx.product.update({
          where: { id: currentItem.productId },
          data: {
            stock: {
              increment: currentItem.quantity,
            },
          },
        });
      }

      // Step 6: Delete all existing order items
      await tx.orderItem.deleteMany({
        where: { orderId },
      });

      // Step 7: Create new order items and deduct stock
      for (const item of items) {
        // Re-fetch product to get updated stock after restoration
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new AppError(`Product with ID ${item.productId} not found`, 404);
        }

        const quantityToReserve = item.quantity || 1;

        // Create new order item
        await tx.orderItem.create({
          data: {
            orderId,
            productId: item.productId,
            quantity: quantityToReserve,
            price: item.price || product.price,
          },
        });

        // Deduct stock (product.stock already includes restored stock from step 5)
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: quantityToReserve,
            },
          },
        });
      }
    }

    // Calculate total amount if items were updated
    let finalTotalAmount = totalAmount;
    if (items && Array.isArray(items)) {
      const orderItems = await tx.orderItem.findMany({
        where: { orderId },
        include: { product: true },
      });
      finalTotalAmount = orderItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
    }

    // Update order
    const updateData: any = {};
    if (shippingAddress !== undefined) updateData.shippingAddress = shippingAddress;
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (finalTotalAmount !== undefined) updateData.totalAmount = finalTotalAmount;
    if (totalAmount !== undefined && !items) updateData.totalAmount = totalAmount;

    const updated = await tx.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return updated;
  }, {
    timeout: 20000
  });

  res.status(200).json({
    status: "success",
    data: { order: updatedOrder },
  });
});

// Get all users (admin)
export const getAllUsers = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const { search, includeArchived } = req.query;
  
  const where: any = {};
  
  // Filter archived users unless includeArchived is true
  if (includeArchived !== 'true') {
    where.isArchived = false;
  }
  
  // Add search functionality
  if (search && typeof search === 'string') {
    const searchTerm = search.trim();
    where.OR = [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { email: { contains: searchTerm, mode: 'insensitive' } },
    ];
    
    // Try to search by phone number in orders if it looks like a phone number
    if (/^[\d\s\-\+\(\)]+$/.test(searchTerm)) {
      // Search in orders for phone number
      const ordersWithPhone = await prisma.order.findMany({
        where: {
          phoneNumber: { contains: searchTerm, mode: 'insensitive' },
        },
        select: {
          userId: true,
        },
        distinct: ['userId'],
      });
      
      if (ordersWithPhone.length > 0) {
        const userIds = ordersWithPhone.map(o => o.userId);
        where.OR.push({ id: { in: userIds } });
      }
    }
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isArchived: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  res.status(200).json({
    status: "success",
    results: users.length,
    data: { users },
  });
});

// Get single user details (admin)
export const getUserDetails = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return next(new AppError("Invalid user ID", 400));
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  const reviews = await prisma.review.findMany({
    where: { userId },
    include: {
      product: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const metrics = {
    totalOrders: orders.length,
    totalSpent: orders.reduce((sum, o) => sum + o.totalAmount, 0),
    activeCartItems: cart?.items.length || 0,
    totalReviews: reviews.length,
  };

  res.status(200).json({
    status: "success",
    data: {
      user,
      orders,
      cart,
      reviews,
      metrics,
    },
  });
});

// Update user (admin)
export const updateUser = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return next(new AppError("Invalid user ID", 400));
  }

  const { name, email, role } = req.body;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name && { name }),
      ...(email && { email }),
      ...(role && { role }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  res.status(200).json({
    status: "success",
    data: { user },
  });
});

// Delete user (admin)
export const deleteUser = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return next(new AppError("Invalid user ID", 400));
  }

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Delete related records first to avoid foreign key constraint violations
  // Delete reviews
  await prisma.review.deleteMany({
    where: { userId },
  });

  // Delete order items and orders
  const orders = await prisma.order.findMany({
    where: { userId },
    select: { id: true },
  });

  if (orders.length > 0) {
    const orderIds = orders.map(order => order.id);
    await prisma.orderItem.deleteMany({
      where: { orderId: { in: orderIds } },
    });
    await prisma.order.deleteMany({
      where: { userId },
    });
  }

  // Delete cart items and cart
  const cart = await prisma.cart.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (cart) {
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
    await prisma.cart.delete({
      where: { userId },
    });
  }

  // Finally, delete the user
  await prisma.user.delete({
    where: { id: userId },
  });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// Add item to user's cart (admin)
export const addCartItem = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const userId = parseInt(req.params.id);
  const { productId, quantity } = req.body;

  if (isNaN(userId)) {
    return next(new AppError("Invalid user ID", 400));
  }

  // Get or create cart for user
  let cart = await prisma.cart.findUnique({
    where: { userId },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
    });
  }

  // Add item to cart
  const cartItem = await prisma.cartItem.create({
    data: {
      cartId: cart.id,
      productId,
      quantity,
    },
    include: {
      product: true,
    },
  });

  res.status(201).json({
    status: "success",
    data: { cartItem },
  });
});

// Update cart item (admin)
export const updateCartItem = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const userId = parseInt(req.params.id);
  const itemId = parseInt(req.params.itemId);
  const { quantity } = req.body;

  if (isNaN(userId) || isNaN(itemId)) {
    return next(new AppError("Invalid user ID or item ID", 400));
  }

  const cartItem = await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity },
    include: {
      product: true,
    },
  });

  res.status(200).json({
    status: "success",
    data: { cartItem },
  });
});

// Delete cart item (admin)
export const deleteCartItem = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const itemId = parseInt(req.params.itemId);

  if (isNaN(itemId)) {
    return next(new AppError("Invalid item ID", 400));
  }

  await prisma.cartItem.delete({
    where: { id: itemId },
  });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// Delete entire cart (admin)
export const deleteCart = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return next(new AppError("Invalid user ID", 400));
  }

  // Find the cart by userId
  const cart = await prisma.cart.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!cart) {
    return next(new AppError("Cart not found", 404));
  }

  // Delete all cart items first
  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  });

  // Delete the cart
  await prisma.cart.delete({
    where: { userId },
  });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// Create order for user (admin)
export const createUserOrder = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const userId = parseInt(req.params.id);
  const { items, totalAmount, status, shippingAddress, paymentMethod } = req.body;

  if (isNaN(userId)) {
    return next(new AppError("Invalid user ID", 400));
  }

  // Get user's cart if items are not provided
  let orderItems = items;
  let calculatedTotal = totalAmount;

  if (!items || items.length === 0) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return next(new AppError("User's cart is empty. Please add items to cart first or provide items in the request.", 400));
    }

    // Calculate total from cart items
    calculatedTotal = cart.items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);

    // Prepare order items from cart
    orderItems = cart.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      price: item.product.price,
    }));
  } else {
    // If items are provided, calculate totalAmount if not provided
    if (!calculatedTotal) {
      // Fetch product prices for the provided items
      const productIds = items.map((item: any) => item.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
      });

      const productMap = new Map(products.map(p => [p.id, p]));
      calculatedTotal = items.reduce((sum: number, item: any) => {
        const product = productMap.get(item.productId);
        const price = item.price || product?.price || 0;
        return sum + (price * item.quantity);
      }, 0);

      // Ensure items have price field
      orderItems = items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price || productMap.get(item.productId)?.price || 0,
      }));
    }
  }

  if (!calculatedTotal || calculatedTotal <= 0) {
    return next(new AppError("Invalid total amount. Please provide items or ensure cart has items.", 400));
  }

  // Use transaction to ensure cart is cleared after order creation
  const order = await prisma.$transaction(async (tx) => {
    // Create the order
    const newOrder = await tx.order.create({
      data: {
        userId,
        totalAmount: calculatedTotal,
        status: status || "pending",
        shippingAddress: shippingAddress || null,
        paymentMethod: paymentMethod || null,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Clear cart items if order was created from cart
    if (!items || items.length === 0) {
      const cart = await tx.cart.findUnique({
        where: { userId },
      });

      if (cart) {
        await tx.cartItem.deleteMany({
          where: { cartId: cart.id },
        });
      }
    }

    return newOrder;
  });

  res.status(201).json({
    status: "success",
    data: { order },
  });
});

// Get all carts (admin)
export const getAllCarts = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const carts = await prisma.cart.findMany({
    where: {
      items: {
        some: {},
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              image: true,
            },
          },
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  res.status(200).json({
    status: "success",
    results: carts.length,
    data: { carts },
  });
});

// Send abandoned cart email (admin)
export const sendAbandonedCartEmail = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const userId = parseInt(req.params.userId);

  if (isNaN(userId)) {
    return next(new AppError("Invalid user ID", 400));
  }

  // Get cart with user and items
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              price: true,
              discountPercent: true,
              image: true,
            },
          },
        },
      },
    },
  });

  if (!cart) {
    return next(new AppError("Cart not found", 404));
  }

  if (!cart.user || !cart.user.email) {
    return next(new AppError("User email not found", 400));
  }

  if (cart.items.length === 0) {
    return next(new AppError("Cart is empty", 400));
  }

  // Prepare cart items for email
  const cartItems = cart.items.map(item => {
    // Calculate price with discount if applicable
    const basePrice = item.product.price;
    const discountPercent = item.product.discountPercent || 0;
    const price = basePrice * (1 - discountPercent / 100);
    const total = price * item.quantity;
    
    return {
      name: item.product.name,
      quantity: item.quantity,
      price: price,
      total: total,
      size: item.size || undefined,
      image: item.product.image,
    };
  });

  // Calculate total amount
  const totalAmount = cartItems.reduce((sum, item) => sum + item.total, 0);

  // Generate cart URL (frontend URL + cart page)
  const frontendUrl = process.env.FRONTEND_URL || process.env.API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:3000';
  const cartUrl = `${frontendUrl}/shop?cart=true`;

  try {
    // Send email
    const email = new Email(cart.user, '');
    await email.sendAbandonedCartEmail(cartItems, totalAmount, cartUrl);

    res.status(200).json({
      status: "success",
      message: "Abandoned cart email sent successfully",
    });
  } catch (error: any) {
    console.error('Error sending abandoned cart email:', {
      userId,
      userEmail: cart.user?.email,
      error: error.message,
      stack: error.stack,
    });
    
    // Provide more specific error message
    const errorMessage = error.message || "Failed to send email";
    return next(new AppError(errorMessage, 500));
  }
});

// Set discount on a product (admin)
export const setProductDiscount = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const productId = parseInt(req.params.id);
  const { discountPercent } = req.body;

  if (isNaN(productId)) {
    return next(new AppError("Invalid product ID", 400));
  }

  if (discountPercent === undefined || discountPercent === null) {
    return next(new AppError("discountPercent is required", 400));
  }

  if (discountPercent < 0 || discountPercent > 100) {
    return next(new AppError("discountPercent must be between 0 and 100", 400));
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  const updatedProduct = await prisma.product.update({
    where: { id: productId },
    data: { discountPercent },
  });

  res.status(200).json({
    status: "success",
    data: { product: updatedProduct },
  });
});

// Set discount on a category (admin)
export const setCategoryDiscount = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const categoryName = req.params.name;
  const { discountPercent } = req.body;

  if (!categoryName) {
    return next(new AppError("Category name is required", 400));
  }

  if (discountPercent === undefined || discountPercent === null) {
    return next(new AppError("discountPercent is required", 400));
  }

  if (discountPercent < 0 || discountPercent > 100) {
    return next(new AppError("discountPercent must be between 0 and 100", 400));
  }

  const category = await prisma.category.findUnique({
    where: { name: categoryName },
  });

  if (!category) {
    return next(new AppError("Category not found", 404));
  }

  const updatedCategory = await prisma.category.update({
    where: { name: categoryName },
    data: { discountPercent },
  });

  res.status(200).json({
    status: "success",
    data: { category: updatedCategory },
  });
});

// Archive user
export const archiveUser = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return next(new AppError("Invalid user ID", 400));
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isArchived: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isArchived: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      status: "success",
      data: { user: updatedUser },
    });
  }
);

// Unarchive user
export const unarchiveUser = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const userId = parseInt(req.params.id);

    if (isNaN(userId)) {
      return next(new AppError("Invalid user ID", 400));
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isArchived: false },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isArchived: true,
        createdAt: true,
      },
    });

    res.status(200).json({
      status: "success",
      data: { user: updatedUser },
    });
  }
);
