import express from "express";
import * as userController from "../controllers/userController.js";
import * as authController from "../controllers/authController.js";

const router = express.Router();

// 1) PUBLIC ROUTES
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.post("/forget-password", authController.forgotPassword);
router.patch("/reset-password/:token", authController.resetPassword);

// 2) PROTECTED ROUTES (Logged-in users)
router.use(authController.protect);

router.get("/me", userController.getMe, userController.getUser);
router.patch("/update-me", userController.updateMe);
router.delete("/delete-me", userController.deleteMe);
router.patch("/change-my-password", authController.changePassword);

// 3) RESTRICTED ROUTES (Admins only)
router.use(authController.restrictTo("admin"));

router.get("/:id/details", userController.getUserDetails);

router
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

export default router;
