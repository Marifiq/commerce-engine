import express from "express";
import * as orderController from "../controllers/orderController.js";
import * as authController from "../controllers/authController.js";
import * as returnController from "../controllers/returnController.js";
import * as refundController from "../controllers/refundController.js";

const router = express.Router();

// Guest checkout (public route - no auth required)
router.post("/guest-checkout", orderController.guestCheckout);

// All other order routes are protected
router.use(authController.protect);

router.post("/checkout", orderController.checkout);
router.get("/my-orders", orderController.getMyOrders);
router.get("/:id", orderController.getOrder);
router.patch("/:id/archive", orderController.archiveOrder);
router.patch("/:id/unarchive", orderController.unarchiveOrder);

// User-facing return routes
router.post("/returns", returnController.createReturn);
router.get("/returns/my-returns", returnController.getAllReturns);
router.get("/returns/:id", returnController.getReturn);

// User-facing refund routes
router.post("/refunds", refundController.createRefund);
router.get("/refunds/my-refunds", refundController.getAllRefunds);
router.get("/refunds/:id", refundController.getRefund);

export default router;
