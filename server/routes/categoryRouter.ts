import express from "express";
import * as authController from "../controllers/authController.js";
import * as categoryController from "../controllers/categoryController.js";

const router = express.Router();

// GET all categories
router.get("/", categoryController.getAllCategories);

// POST new category (admin only) - supports both multer file upload and base64
router.post(
  "/",
  authController.protect,
  authController.restrictTo("admin"),
  categoryController.uploadCategoryImage,
  categoryController.resizeCategoryImage,
  categoryController.processBase64CategoryImage,
  categoryController.createCategory
);

// PATCH category (admin only) - supports both multer file upload and base64
router.patch(
  "/:oldName",
  authController.protect,
  authController.restrictTo("admin"),
  categoryController.uploadCategoryImage,
  categoryController.resizeCategoryImage,
  categoryController.processBase64CategoryImage,
  categoryController.updateCategory
);

// DELETE category (admin only)
router.delete(
  "/:name",
  authController.protect,
  authController.restrictTo("admin"),
  categoryController.deleteCategory
);

export default router;
