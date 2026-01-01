import { Response, NextFunction } from "express";
import prisma from "../db.js";
import * as factory from "./handlerFactory.js";
import catchAsync from "../utils/catchAsync.js";
import { UserRequest } from "../types.js";
import AppError from "../utils/appError.js";

// 1. Create Review
export const setProductUserIds = (
  req: UserRequest,
  res: Response,
  next: NextFunction
) => {
  // Set productId from params (if nested route) or body, prioritizing params
  if (!req.body.productId && req.params.productId) {
    req.body.productId = parseInt(req.params.productId);
  }
  // Ensure productId is a number if it exists
  if (req.body.productId) {
    req.body.productId = parseInt(req.body.productId);
  }
  // Set userId from authenticated user
  if (!req.body.userId && req.user) {
    req.body.userId = req.user.id;
  }
  // Set isApproved to true by default when user creates a review
  if (req.body.isApproved === undefined || req.body.isApproved === null) {
    req.body.isApproved = true;
  }
  next();
};

// Check for duplicate review (user can only review a product once)
export const checkDuplicateReview = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const productId = req.body.productId || parseInt(req.params.productId);
    const userId = req.body.userId || req.user!.id;

    if (!productId || !userId) {
      return next(new AppError("Product ID and User ID are required", 400));
    }

    const existingReview = await prisma.review.findFirst({
      where: {
        productId: parseInt(productId),
        userId: userId,
      },
    });

    if (existingReview) {
      return next(
        new AppError(
          "You have already reviewed this product. You can edit or delete your existing review instead.",
          400
        )
      );
    }

    next();
  }
);

export const createReview = factory.createOne(prisma.review);

// 2. Get All Reviews
export const getAllReviews = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    let filter: any = {};
    const hasProductId = req.params.productId;
    if (hasProductId) filter.productId = parseInt(req.params.productId);

    // If user is authenticated, optionally filter by userId via query param
    if (req.query.userId && req.user) {
      const requestedUserId = parseInt(req.query.userId as string);
      // Users can only see their own reviews unless they're admin
      if (requestedUserId === req.user.id || req.user.role === "admin") {
        filter.userId = requestedUserId;
      }
    }

    // Filter by approval status:
    // - Product pages: Show ALL reviews (approved and unapproved) - don't filter
    // - Carousel/General: Only show approved reviews
    // - Admin panel: Show ALL reviews when includePending=true or includeUnapproved=true
    const includeUnapproved =
      req.query.includeUnapproved === "true" ||
      req.query.includePending === "true";

    // FORCE filter by isApproved AND rating > 4 for carousel/stories (public display)
    // Only show approved reviews with rating > 4 unless:
    // 1. Fetching for a specific product (show all on product page)
    // 2. Admin panel explicitly requests all reviews with includePending flag
    if (!hasProductId && !includeUnapproved) {
      // This is carousel/stories - MUST only show approved reviews with rating > 4
      filter.isApproved = true;
      filter.rating = { gt: 4 }; // Rating greater than 4 (so only 5-star reviews)
    }
    // If hasProductId OR includeUnapproved is true, we don't set isApproved/rating filter (show all)

    const reviews = await prisma.review.findMany({
      where: filter,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      status: "success",
      results: reviews.length,
      data: {
        data: reviews,
      },
    });
  }
);

// 2.5. Get My Reviews (current user's reviews)
export const getMyReviews = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const reviews = await prisma.review.findMany({
      where: { userId: req.user!.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      status: "success",
      results: reviews.length,
      data: {
        data: reviews,
      },
    });
  }
);

// 2.6. Get Homepage Reviews (approved reviews with rating > 4, limited to 5)
// Real-world approach: Dedicated endpoint for homepage that filters and limits on the backend
export const getHomepageReviews = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const reviews = await prisma.review.findMany({
      where: {
        isApproved: true,
        rating: {
          gt: 4, // Rating greater than 4 (so only 5-star reviews)
        },
        // Ensure text is not empty (has meaningful content)
        text: {
          not: "",
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { rating: "desc" }, // Highest ratings first (all should be 5, but for consistency)
        { createdAt: "desc" }, // Then most recent reviews
      ],
      take: 5, // Limit to maximum 5 reviews for homepage
    });

    res.status(200).json({
      status: "success",
      results: reviews.length,
      data: {
        data: reviews,
      },
    });
  }
);

// 3. Get Single Review
export const getReview = factory.getOne(prisma.review, {
  user: true,
  product: true,
});

// 4. Check Review Ownership (users can only edit/delete their own reviews, admins can edit/delete any)
export const checkReviewOwnership = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const reviewId = parseInt(req.params.id);
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return next(new AppError("Review not found", 404));
    }

    // Admins can edit/delete any review
    if (userRole === "admin") {
      return next();
    }

    // Users can only edit/delete their own reviews
    if (review.userId !== userId) {
      return next(
        new AppError("You do not have permission to modify this review", 403)
      );
    }

    next();
  }
);

// 5. Update Review (prevent changing productId or userId)
export const updateReview = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return next(new AppError("Invalid ID format", 400));
    }

    // Remove productId and userId from body to prevent changing them
    const { productId, userId, ...updateData } = req.body;

    // Parse numeric fields
    if (updateData.rating) updateData.rating = parseInt(updateData.rating);

    const doc = await prisma.review.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(200).json({
      status: "success",
      requestedAt: (req as any).requestTime,
      data: {
        data: doc,
      },
    });
  }
);

// 6. Delete Review
export const deleteReview = factory.deleteOne(prisma.review);

// 6. Update Review Status (Admin only)
export const updateReviewStatus = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { isApproved } = req.body;

    // Validate ID
    const reviewId = parseInt(id);
    if (isNaN(reviewId)) {
      return next(new AppError("Invalid review ID format", 400));
    }

    // Validate isApproved is provided
    if (isApproved === undefined || isApproved === null) {
      return next(new AppError("isApproved field is required", 400));
    }

    // Ensure isApproved is a boolean (handle string "true"/"false" or "1"/"0")
    let approvedStatus: boolean;
    if (typeof isApproved === "string") {
      approvedStatus =
        isApproved.toLowerCase() === "true" || isApproved === "1";
    } else if (typeof isApproved === "number") {
      approvedStatus = isApproved === 1;
    } else {
      approvedStatus = Boolean(isApproved);
    }

    // Check if review exists
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      return next(new AppError("Review not found", 404));
    }

    // Update the review
    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { isApproved: approvedStatus },
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
    });

    res.status(200).json({
      status: "success",
      data: {
        data: review,
      },
    });
  }
);
