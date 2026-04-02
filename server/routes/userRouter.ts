import express, { NextFunction, Request, Response } from "express";
import * as userController from "../controllers/userController.js";
import * as authController from "../controllers/authController.js";
import passport, { isGoogleAuthConfigured } from "../utils/passport.js";

const router = express.Router();

const requireGoogleAuthConfigured = (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!isGoogleAuthConfigured) {
    return res.status(503).json({
      status: "fail",
      message:
        "Google OAuth is not configured on this server. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable it.",
    });
  }

  next();
};

// 1) PUBLIC ROUTES
router.post("/signup", authController.signup);
router.post("/verify-email", authController.verifyEmail);
router.post("/resend-verification-code", authController.resendVerificationCode);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.post("/forget-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// Google OAuth routes
router.get(
  "/auth/google",
  requireGoogleAuthConfigured,
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/auth/google/callback",
  requireGoogleAuthConfigured,
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  authController.googleCallback
);

// 2) PROTECTED ROUTES (Logged-in users)
router.use(authController.protect);

router.get("/me", userController.getMe, userController.getUser);
router.get("/list", userController.getOtherUsers);
router.patch(
  "/update-me",
  userController.uploadProfileImage,
  userController.processProfileImage,
  userController.updateMe
);
router.patch("/update-email", userController.updateEmail);
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
