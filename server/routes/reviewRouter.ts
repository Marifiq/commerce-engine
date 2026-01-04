import express from "express";
import * as reviewController from "../controllers/reviewController.js";
import * as authController from "../controllers/authController.js";
import { processReviewMedia } from "../utils/processReviewMedia.js";

const router = express.Router({ mergeParams: true });

// PUBLIC ROUTES
router.get("/", reviewController.getAllReviews);
router.get("/homepage", reviewController.getHomepageReviews);

// Get current user's reviews (protected, must come before /:id route)
router.get(
  "/my-reviews",
  authController.protect,
  reviewController.getMyReviews
);

router.get("/:id", reviewController.getReview);

// PROTECTED ROUTES
router.use(authController.protect);

router.post(
  "/",
  authController.restrictTo("user", "admin"),
  reviewController.setProductUserIds,
  reviewController.checkDuplicateReview,
  processReviewMedia,
  reviewController.createReview
);

// Admin-only route for updating review status (must come before /:id route)
router.patch(
  "/:id/status",
  authController.restrictTo("admin"),
  reviewController.updateReviewStatus
);

router.patch(
  "/:id",
  authController.restrictTo("user", "admin"),
  reviewController.checkReviewOwnership,
  processReviewMedia,
  reviewController.updateReview
);
router.delete(
  "/:id",
  authController.restrictTo("user", "admin"),
  reviewController.checkReviewOwnership,
  reviewController.deleteReview
);

export default router;
