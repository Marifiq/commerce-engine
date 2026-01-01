import express from "express";
import * as offerController from "../controllers/offerController.js";
import * as authController from "../controllers/authController.js";

const router = express.Router();

// Public route - get active offers for banner
router.get("/active", offerController.getActiveOffers);

// All other routes require authentication and admin role
router.use(authController.protect);
router.use(authController.restrictTo("admin"));

// Admin routes
router.get("/", offerController.getAllOffers);
router.get("/:id", offerController.getOffer);
router.post("/", offerController.createOffer);
router.patch("/:id", offerController.updateOffer);
router.delete("/:id", offerController.deleteOffer);

export default router;

