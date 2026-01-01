import express from "express";
import * as cartController from "../controllers/cartController.js";
import * as authController from "../controllers/authController.js";

const router = express.Router();

// All cart routes are protected
router.use(authController.protect);

router
  .route("/")
  .get(cartController.getMyCart)
  .post(cartController.addToCart);

router
  .route("/:cartItemId")
  .patch(cartController.updateCartItemQuantity)
  .delete(cartController.removeFromCart);

export default router;
