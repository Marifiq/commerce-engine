import express from "express";
import * as orderController from "../controllers/orderController.js";
import * as authController from "../controllers/authController.js";

const router = express.Router();

// All order routes are protected
router.use(authController.protect);

router.post("/checkout", orderController.checkout);
router.get("/my-orders", orderController.getMyOrders);
router.get("/:id", orderController.getOrder);

export default router;
