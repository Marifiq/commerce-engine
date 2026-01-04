import express from "express";
import * as productController from "../controllers/productController.js";
import * as authController from "../controllers/authController.js";
import reviewRouter from "./reviewRouter.js";

const router = express.Router();

// 1. PUBLIC ROUTES
router.get("/", productController.getAllProducts);
router.get("/best-sellers", productController.getBestSellers);
router.get("/off", productController.getDiscountedProducts);
router.get("/categories", productController.getCategories);
router.use("/:productId/reviews", reviewRouter);
router.get("/:id", productController.getProduct);

// 2. PROTECTED ROUTES (Requires Login)
router.use(authController.protect);

// 3. ADMIN ONLY ROUTES (Restricted)
router.use(authController.restrictTo("admin"));

router.post(
  "/",
  productController.uploadProductMedia,
  productController.processProductMedia,
  productController.createProduct
);

router.patch(
  "/:id",
  productController.uploadProductMedia,
  productController.processProductMedia,
  productController.updateProduct
);

router.delete("/:id", productController.deleteProduct);

// Archive management routes
router.patch("/:id/archive", productController.archiveProduct);
router.patch("/:id/unarchive", productController.unarchiveProduct);
router.get("/archived", productController.getArchivedProducts);

// Size management routes
router.get("/:id/sizes", productController.getProductSizes);
router.post("/:id/sizes", productController.addProductSize);
router.delete("/:id/sizes", productController.deleteProductSize);
router.patch("/:id/size-enabled", productController.toggleSizeEnabled);

export default router;
