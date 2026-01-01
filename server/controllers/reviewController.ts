import { Response, NextFunction } from "express";
import prisma from "../db.js";
import * as factory from "./handlerFactory.js";
import catchAsync from "../utils/catchAsync.js";
import { UserRequest } from "../types.js";

// 1. Create Review
export const setProductUserIds = (req: UserRequest, res: Response, next: NextFunction) => {
  if (!req.body.product) req.body.productId = parseInt(req.params.productId);
  if (!req.body.user) req.body.userId = req.user!.id;
  next();
};

export const createReview = factory.createOne(prisma.review);

// 2. Get All Reviews
export const getAllReviews = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  let filter = {};
  if (req.params.productId) filter = { productId: parseInt(req.params.productId) };

  const reviews = await prisma.review.findMany({
    where: filter,
    include: {
      user: {
        select: {
          name: true,
          role: true,
        },
      },
      product: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.status(200).json({
    status: "success",
    results: reviews.length,
    data: {
      data: reviews,
    },
  });
});

// 3. Get Single Review
export const getReview = factory.getOne(prisma.review, { user: true, product: true });

// 4. Update Review
export const updateReview = factory.updateOne(prisma.review);

// 5. Delete Review
export const deleteReview = factory.deleteOne(prisma.review);
