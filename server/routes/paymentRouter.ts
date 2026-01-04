import express from "express";
import * as paymentController from "../controllers/paymentController.js";
import * as authController from "../controllers/authController.js";

const router = express.Router();

// Public route for Stripe key (must be before protect middleware)
router.get("/stripe-key", paymentController.getStripeKey);

// All other payment routes are protected
router.use(authController.protect);

router.get("/methods", paymentController.getPaymentMethods);
router.get("/methods/:id", paymentController.getPaymentMethod);
router.post("/methods", paymentController.createPaymentMethod);
router.patch("/methods/:id", paymentController.updatePaymentMethod);
router.delete("/methods/:id", paymentController.deletePaymentMethod);
router.post("/intent", paymentController.createPaymentIntent);

export default router;

