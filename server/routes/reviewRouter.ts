import express from "express";
import * as reviewController from "../controllers/reviewController.js";
import * as authController from "../controllers/authController.js";

const router = express.Router({ mergeParams: true });

// PUBLIC ROUTES
router.get("/", reviewController.getAllReviews);
router.get("/:id", reviewController.getReview);

// PROTECTED ROUTES
router.use(authController.protect);

router.post(
  "/",
  authController.restrictTo("user"),
  reviewController.setProductUserIds,
  reviewController.createReview
);

router.patch("/:id", authController.restrictTo("user", "admin"), reviewController.updateReview);
router.delete("/:id", authController.restrictTo("user", "admin"), reviewController.deleteReview);

export default router;
