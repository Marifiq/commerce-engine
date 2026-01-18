import express from "express";
import * as messageController from "../controllers/messageController.js";
import * as authController from "../controllers/authController.js";

const router = express.Router();

// Customer routes - require authentication
router.use(authController.protect);

// Customer conversation routes
router.get("/conversations", messageController.getCustomerConversations);
router.post("/conversations", messageController.createSupportConversation);
router.get("/conversations/:id", messageController.getConversation);
router.get("/conversations/:id/messages", messageController.getConversationMessages);
router.post(
  "/conversations/:id/messages",
  messageController.uploadMessageAttachments,
  messageController.processMessageAttachments,
  messageController.sendCustomerMessage
);
router.post("/conversations/:id/messages/read", messageController.markMessagesAsRead);

export default router;

