import { Request, Response, NextFunction } from "express";
import prisma from "../db.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import { UserRequest } from "../types.js";
import Email from "../utils/email.js";

// Create refund request
export const createRefund = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const { orderId, amount, reason } = req.body;

  if (!orderId || !amount) {
    return next(new AppError("Order ID and amount are required", 400));
  }

  if (amount <= 0) {
    return next(new AppError("Refund amount must be greater than 0", 400));
  }

  // Get order to validate
  const order = await prisma.order.findUnique({
    where: { id: parseInt(orderId) },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      refunds: true,
    },
  });

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  // Calculate total refunded amount
  const totalRefunded = order.refunds
    .filter(r => r.status === "processed" || r.status === "approved")
    .reduce((sum, r) => sum + r.amount, 0);

  if (totalRefunded + amount > order.totalAmount) {
    return next(new AppError("Refund amount exceeds order total", 400));
  }

  const refund = await prisma.refund.create({
    data: {
      orderId: parseInt(orderId),
      amount: parseFloat(amount),
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
        },
      },
    },
  });

  res.status(201).json({
    status: "success",
    data: { refund },
  });
});

// Get all refunds
export const getAllRefunds = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const { status, orderId, startDate, endDate } = req.query;

  const where: any = {};

  if (status && typeof status === "string") {
    where.status = status;
  }

  if (orderId && typeof orderId === "string") {
    where.orderId = parseInt(orderId);
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

  const refunds = await prisma.refund.findMany({
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
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  res.status(200).json({
    status: "success",
    results: refunds.length,
    data: { refunds },
  });
});

// Get single refund
export const getRefund = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const refundId = parseInt(req.params.id);

  if (isNaN(refundId)) {
    return next(new AppError("Invalid refund ID", 400));
  }

  const refund = await prisma.refund.findUnique({
    where: { id: refundId },
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

  if (!refund) {
    return next(new AppError("Refund not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { refund },
  });
});

// Update refund status
export const updateRefundStatus = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const refundId = parseInt(req.params.id);
  const { status, adminNotes } = req.body;

  if (isNaN(refundId)) {
    return next(new AppError("Invalid refund ID", 400));
  }

  if (!status) {
    return next(new AppError("Status is required", 400));
  }

  const validStatuses = ["pending", "approved", "rejected", "processed"];
  if (!validStatuses.includes(status)) {
    return next(new AppError(`Invalid status. Must be one of: ${validStatuses.join(", ")}`, 400));
  }

  const refund = await prisma.refund.findUnique({
    where: { id: refundId },
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
        },
      },
    },
  });

  if (!refund) {
    return next(new AppError("Refund not found", 404));
  }

  const updateData: any = {
    status,
    ...(adminNotes !== undefined && { adminNotes }),
  };

  if (status === "processed" && refund.status !== "processed") {
    updateData.processedAt = new Date();
  }

  const updatedRefund = await prisma.refund.update({
    where: { id: refundId },
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
    },
  });

  res.status(200).json({
    status: "success",
    data: { refund: updatedRefund },
  });
});

// Process refund (approve and mark as processed)
export const processRefund = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const refundId = parseInt(req.params.id);

  if (isNaN(refundId)) {
    return next(new AppError("Invalid refund ID", 400));
  }

  const refund = await prisma.refund.findUnique({
    where: { id: refundId },
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
          refunds: true,
        },
      },
    },
  });

  if (!refund) {
    return next(new AppError("Refund not found", 404));
  }

  if (refund.status !== "approved") {
    return next(new AppError("Only approved refunds can be processed", 400));
  }

  // Update refund status to processed
  const updatedRefund = await prisma.refund.update({
    where: { id: refundId },
    data: {
      status: "processed",
      processedAt: new Date(),
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
          refunds: true,
        },
      },
    },
  });

  // Calculate total refunded
  const totalRefunded = updatedRefund.order.refunds
    .filter(r => r.status === "processed")
    .reduce((sum, r) => sum + r.amount, 0);

  // Update order status if fully refunded
  let orderStatus = updatedRefund.order.status;
  if (totalRefunded >= updatedRefund.order.totalAmount) {
    orderStatus = "refunded";
  } else if (totalRefunded > 0) {
    orderStatus = "partially_refunded";
  }

  await prisma.order.update({
    where: { id: updatedRefund.orderId },
    data: { status: orderStatus },
  });

  // Send email notification if user exists
  if (updatedRefund.order.user && updatedRefund.order.user.email) {
    try {
      const email = new Email(updatedRefund.order.user, "");
      // Note: You may want to create a sendRefundProcessed method in Email class
      // For now, we'll just log it
      console.log(`Refund processed email would be sent to ${updatedRefund.order.user.email}`);
    } catch (error) {
      console.error("Failed to send refund email:", error);
    }
  }

  res.status(200).json({
    status: "success",
    data: { refund: updatedRefund },
  });
});

