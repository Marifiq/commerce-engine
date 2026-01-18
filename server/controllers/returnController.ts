import { Request, Response, NextFunction } from "express";
import prisma from "../db.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import { UserRequest } from "../types.js";

// Create return request
export const createReturn = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const { orderId, orderItemIds, reason } = req.body;
  const isAdmin = req.user?.role?.toLowerCase() === "admin";

  if (!orderId) {
    return next(new AppError("Order ID is required", 400));
  }

  // Get order to validate
  const order = await prisma.order.findUnique({
    where: { id: parseInt(orderId) },
    include: {
      items: true,
      returns: true,
    },
  });

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  // If not admin, ensure the order belongs to the user
  if (!isAdmin && req.user?.id && order.userId !== req.user.id) {
    return next(new AppError("You can only return your own orders", 403));
  }

  // Validate order items if provided
  if (orderItemIds && Array.isArray(orderItemIds) && orderItemIds.length > 0) {
    const itemIds = orderItemIds.map((id: any) => parseInt(id));
    const invalidItems = itemIds.filter(id => !order.items.some(item => item.id === id));
    
    if (invalidItems.length > 0) {
      return next(new AppError(`Invalid order item IDs: ${invalidItems.join(", ")}`, 400));
    }
  }

  const returnRequest = await prisma.return.create({
    data: {
      orderId: parseInt(orderId),
      reason: reason || null,
      status: "pending",
    },
    include: {
      order: {
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
      },
    },
  });

  // Update order items if specific items are being returned
  if (orderItemIds && Array.isArray(orderItemIds) && orderItemIds.length > 0) {
    const itemIds = orderItemIds.map((id: any) => parseInt(id));
    await prisma.orderItem.updateMany({
      where: {
        id: { in: itemIds },
        orderId: parseInt(orderId),
      },
      data: {
        returnId: returnRequest.id,
      },
    });
  }

  const updatedReturn = await prisma.return.findUnique({
    where: { id: returnRequest.id },
    include: {
      order: {
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
      },
      orderItems: {
        include: {
          product: true,
        },
      },
    },
  });

  res.status(201).json({
    status: "success",
    data: { return: updatedReturn },
  });
});

// Get all returns
export const getAllReturns = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const { status, orderId, startDate, endDate } = req.query;
  const isAdmin = req.user?.role?.toLowerCase() === "admin";

  const where: any = {};

  // If not admin, only show returns for user's orders
  if (!isAdmin && req.user?.id) {
    where.order = {
      userId: req.user.id,
    };
  }

  if (status && typeof status === "string") {
    where.status = status;
  }

  if (orderId && typeof orderId === "string") {
    where.orderId = parseInt(orderId);
    // If not admin, ensure the order belongs to the user
    if (!isAdmin && req.user?.id) {
      const order = await prisma.order.findUnique({
        where: { id: parseInt(orderId) },
        select: { userId: true },
      });
      if (!order || order.userId !== req.user.id) {
        return next(new AppError("Order not found", 404));
      }
    }
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate as string);
    }
    if (endDate) {
      where.createdAt.lte = new Date(endDate as string);
    }
  }

  const returns = await prisma.return.findMany({
    where,
    include: {
      order: {
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
                  image: true,
                },
              },
            },
          },
        },
      },
      orderItems: {
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
    results: returns.length,
    data: { returns },
  });
});

// Get single return
export const getReturn = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const returnId = parseInt(req.params.id);
  const isAdmin = req.user?.role?.toLowerCase() === "admin";

  if (isNaN(returnId)) {
    return next(new AppError("Invalid return ID", 400));
  }

  const returnRequest = await prisma.return.findUnique({
    where: { id: returnId },
    include: {
      order: {
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
      },
      orderItems: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!returnRequest) {
    return next(new AppError("Return not found", 404));
  }

  // If not admin, ensure the return belongs to the user
  if (!isAdmin && req.user?.id && returnRequest.order.userId !== req.user.id) {
    return next(new AppError("You can only view your own returns", 403));
  }

  res.status(200).json({
    status: "success",
    data: { return: returnRequest },
  });
});

// Update return status
export const updateReturnStatus = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const returnId = parseInt(req.params.id);
  const { status, trackingNumber, adminNotes } = req.body;

  if (isNaN(returnId)) {
    return next(new AppError("Invalid return ID", 400));
  }

  if (!status) {
    return next(new AppError("Status is required", 400));
  }

  const validStatuses = ["pending", "approved", "rejected", "returned"];
  if (!validStatuses.includes(status)) {
    return next(new AppError(`Invalid status. Must be one of: ${validStatuses.join(", ")}`, 400));
  }

  const returnRequest = await prisma.return.findUnique({
    where: { id: returnId },
  });

  if (!returnRequest) {
    return next(new AppError("Return not found", 404));
  }

  const updateData: any = {
    status,
    ...(trackingNumber !== undefined && { trackingNumber }),
    ...(adminNotes !== undefined && { adminNotes }),
  };

  const updatedReturn = await prisma.return.update({
    where: { id: returnId },
    data: updateData,
    include: {
      order: {
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
      },
      orderItems: {
        include: {
          product: true,
        },
      },
    },
  });

  res.status(200).json({
    status: "success",
    data: { return: updatedReturn },
  });
});

// Complete return (restore stock, mark as returned)
export const completeReturn = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const returnId = parseInt(req.params.id);

  if (isNaN(returnId)) {
    return next(new AppError("Invalid return ID", 400));
  }

  const returnRequest = await prisma.return.findUnique({
    where: { id: returnId },
    include: {
      order: {
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      },
      orderItems: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!returnRequest) {
    return next(new AppError("Return not found", 404));
  }

  if (returnRequest.status === "returned") {
    return next(new AppError("Return is already completed", 400));
  }

  // Use transaction to ensure data consistency
  const completedReturn = await prisma.$transaction(async (tx) => {
    // Update return status
    const updatedReturn = await tx.return.update({
      where: { id: returnId },
      data: {
        status: "returned",
      },
    });

    // Restore stock for returned items
    if (returnRequest.orderItems.length > 0) {
      for (const orderItem of returnRequest.orderItems) {
        // Check if product uses size-based stock
        if (orderItem.product.sizeEnabled && orderItem.size) {
          // Update ProductSize stock
          const productSize = await tx.productSize.findUnique({
            where: {
              productId_size: {
                productId: orderItem.productId,
                size: orderItem.size,
              },
            },
          });

          if (productSize) {
            await tx.productSize.update({
              where: {
                productId_size: {
                  productId: orderItem.productId,
                  size: orderItem.size,
                },
              },
              data: {
                stock: {
                  increment: orderItem.quantity,
                },
              },
            });
          }
        } else {
          // Update main product stock
          await tx.product.update({
            where: { id: orderItem.productId },
            data: {
              stock: {
                increment: orderItem.quantity,
              },
            },
          });
        }

        // Mark order item as returned
        await tx.orderItem.update({
          where: { id: orderItem.id },
          data: {
            returned: true,
          },
        });
      }
    } else {
      // If no specific items, restore stock for all order items
      for (const orderItem of returnRequest.order.items) {
        if (orderItem.product.sizeEnabled && orderItem.size) {
          const productSize = await tx.productSize.findUnique({
            where: {
              productId_size: {
                productId: orderItem.productId,
                size: orderItem.size,
              },
            },
          });

          if (productSize) {
            await tx.productSize.update({
              where: {
                productId_size: {
                  productId: orderItem.productId,
                  size: orderItem.size,
                },
              },
              data: {
                stock: {
                  increment: orderItem.quantity,
                },
              },
            });
          }
        } else {
          await tx.product.update({
            where: { id: orderItem.productId },
            data: {
              stock: {
                increment: orderItem.quantity,
              },
            },
          });
        }

        await tx.orderItem.update({
          where: { id: orderItem.id },
          data: {
            returned: true,
            returnId: returnId,
          },
        });
      }
    }

    return updatedReturn;
  });

  // Fetch updated return with relations
  const updatedReturn = await prisma.return.findUnique({
    where: { id: returnId },
    include: {
      order: {
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
      },
      orderItems: {
        include: {
          product: true,
        },
      },
    },
  });

  res.status(200).json({
    status: "success",
    data: { return: updatedReturn },
  });
});

