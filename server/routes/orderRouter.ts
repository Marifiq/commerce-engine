import express from "express";
import * as orderController from "../controllers/orderController.js";
import * as authController from "../controllers/authController.js";

const router = express.Router();

// Guest checkout (public route - no auth required)
router.post("/guest-checkout", orderController.guestCheckout);

// All other order routes are protected
router.use(authController.protect);

router.post("/checkout", orderController.checkout);
router.get("/my-orders", orderController.getMyOrders);
router.get("/:id", orderController.getOrder);

export default router;
