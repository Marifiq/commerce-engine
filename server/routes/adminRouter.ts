import express from "express";
import * as adminController from "../controllers/adminController.js";
import * as authController from "../controllers/authController.js";

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authController.protect);
router.use(authController.restrictTo("admin"));

// Dashboard stats
router.get("/stats", adminController.getStats);

// Order management
router.get("/orders", adminController.getAllOrders);
router.get("/orders/:id", adminController.getOrder);
router.patch("/orders/:id", adminController.updateOrderStatus);
router.put("/orders/:id", adminController.updateOrder);

// User management
router.get("/users", adminController.getAllUsers);
router.get("/users/:id/details", adminController.getUserDetails);
router.patch("/users/:id", adminController.updateUser);
router.delete("/users/:id", adminController.deleteUser);

// User cart management
router.post("/users/:id/cart/items", adminController.addCartItem);
router.patch("/users/:id/cart/items/:itemId", adminController.updateCartItem);
router.delete("/users/:id/cart/items/:itemId", adminController.deleteCartItem);
router.delete("/users/:id/cart", adminController.deleteCart);

// User order management
router.post("/users/:id/orders", adminController.createUserOrder);

// Cart management
router.get("/carts", adminController.getAllCarts);

// Discount management
router.patch("/products/:id/discount", adminController.setProductDiscount);
router.patch("/categories/:name/discount", adminController.setCategoryDiscount);

export default router;
