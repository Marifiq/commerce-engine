import express from "express";
import * as adminController from "../controllers/adminController.js";
import * as authController from "../controllers/authController.js";
import * as settingsController from "../controllers/settingsController.js";
import * as customChartController from "../controllers/customChartController.js";
import * as refundController from "../controllers/refundController.js";
import * as returnController from "../controllers/returnController.js";
import * as policyController from "../controllers/policyController.js";
import * as emailTemplateController from "../controllers/emailTemplateController.js";
import * as themeController from "../controllers/themeController.js";

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
router.post("/carts/:userId/send-email", adminController.sendAbandonedCartEmail);

// Discount management
router.patch("/products/:id/discount", adminController.setProductDiscount);
router.patch("/categories/:name/discount", adminController.setCategoryDiscount);

// Settings management
router.get("/settings", settingsController.getSettings);
router.get("/settings/:key", settingsController.getSetting);
router.post("/settings", settingsController.upsertSetting);
router.put("/settings", settingsController.uploadLogo, settingsController.processLogoImage, settingsController.processBase64Logo, settingsController.processBase64Icon, settingsController.updateSettings);
router.delete("/settings/:key", settingsController.deleteSetting);

// Newsletter management
router.get("/newsletter/subscribers", settingsController.getNewsletterSubscribers);
router.post("/newsletter/subscribers", settingsController.addNewsletterSubscriber);
router.delete("/newsletter/subscribers/:id", settingsController.removeNewsletterSubscriber);
router.post("/newsletter/send", settingsController.sendNewsletter);

// Banner management
router.get("/banners", settingsController.getBanners);
router.get("/banners/:id", settingsController.getBanner);
router.post("/banners", settingsController.createBanner);
router.put("/banners/:id", settingsController.updateBanner);
router.delete("/banners/:id", settingsController.deleteBanner);

// Social media management
router.get("/social-media", settingsController.getSocialMediaLinks);
router.get("/social-media/:id", settingsController.getSocialMediaLink);
router.post("/social-media", settingsController.createSocialMediaLink);
router.put("/social-media/:id", settingsController.updateSocialMediaLink);
router.delete("/social-media/:id", settingsController.deleteSocialMediaLink);

// Custom charts management
router.get("/custom-charts", customChartController.getCustomCharts);
router.post("/custom-charts", customChartController.createCustomChart);
router.post("/custom-charts/preview", customChartController.previewChartData);
router.put("/custom-charts/:id", customChartController.updateCustomChart);
router.delete("/custom-charts/:id", customChartController.deleteCustomChart);
router.get("/custom-charts/:id/data", customChartController.getChartData);

// Refund management
router.post("/refunds", refundController.createRefund);
router.get("/refunds", refundController.getAllRefunds);
router.get("/refunds/:id", refundController.getRefund);
router.patch("/refunds/:id", refundController.updateRefundStatus);
router.post("/refunds/:id/process", refundController.processRefund);

// Return management
router.post("/returns", returnController.createReturn);
router.get("/returns", returnController.getAllReturns);
router.get("/returns/:id", returnController.getReturn);
router.patch("/returns/:id", returnController.updateReturnStatus);
router.post("/returns/:id/complete", returnController.completeReturn);

// Policy management
router.get("/policies", policyController.getAllPolicies);
router.get("/policies/:type", policyController.getPolicyByType);
router.post("/policies", policyController.createPolicy);
router.put("/policies/:id", policyController.updatePolicy);
router.delete("/policies/:id", policyController.deletePolicy);
router.patch("/policies/:id/toggle", policyController.togglePolicyStatus);

// Email template management
router.get("/email-templates", emailTemplateController.getAllEmailTemplates);
router.get("/email-templates/:name", emailTemplateController.getEmailTemplate);
router.put("/email-templates/:name", emailTemplateController.updateEmailTemplate);
router.post("/email-templates/:name/preview", emailTemplateController.previewEmailTemplate);
router.post("/email-templates/:name/reset", emailTemplateController.resetEmailTemplate);

// Theme management
router.get("/themes", themeController.getAllThemes);
router.get("/themes/active", themeController.getActiveTheme);
router.post("/themes", themeController.createTheme);
router.put("/themes/:id", themeController.updateTheme);
router.patch("/themes/:id/activate", themeController.activateTheme);
router.delete("/themes/:id", themeController.deleteTheme);

export default router;
