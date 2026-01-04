import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../db.js";
import { promisify } from "util";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import Email from "../utils/email.js";
import { linkGuestOrdersToUser } from "../utils/orderUtils.js";

import { UserRequest } from "../types.js";

const signToken = (id: number) => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES as any,
  });
};

const hashPassword = async (password: string) =>
  await bcrypt.hash(password, 12);

const createAndSendToken = (user: any, statusCode: number, res: Response) => {
  const token = signToken(user.id);
  const cookieOptions: any = {
    expires: new Date(
      Date.now() + Number(process.env.JWT_COOKIE_EXPIRES) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  delete user.password;

  res.cookie("jwt", token, cookieOptions);
  res.status(statusCode).json({
    status: "success",
    token,
    data: { user },
  });
};

export const signup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password, role } = req.body;

    if (!name || !email) {
      return next(new AppError("Please provide name and email", 400));
    }

    // Password is optional (for Google OAuth users)
    if (!password) {
      return next(
        new AppError("Please provide password for email/password signup", 400)
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return next(new AppError("Email already exists", 409));
    }

    const hashedPassword = await hashPassword(password);

    // Generate 6-digit verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "user",
        emailVerificationCode: verificationCode,
        emailVerificationExpires: verificationExpires,
        isEmailVerified: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Auto-subscribe user to newsletter
    try {
      await prisma.newsletterSubscriber.upsert({
        where: { email: user.email },
        update: { name: user.name, isActive: true },
        create: { email: user.email, name: user.name, isActive: true },
      });
    } catch (newsletterError) {
      // Don't fail registration if newsletter subscription fails
      console.error("Failed to subscribe user to newsletter:", newsletterError);
    }

    try {
      const url = `${req.protocol}://${req.get("host")}`;
      await new Email(user, url).sendVerificationCode(verificationCode);

      res.status(201).json({
        status: "success",
        message:
          "Verification code sent to your email. Please verify your email to complete registration.",
        data: {
          email: user.email,
        },
      });
    } catch (err) {
      // If email sending fails, delete the user
      await prisma.user.delete({
        where: { id: user.id },
      });
      return next(
        new AppError(
          "There was an error sending the verification email. Try again later!",
          500
        )
      );
    }
  }
);

export const verifyEmail = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, code } = req.body;

    if (!email || !code) {
      return next(
        new AppError("Please provide email and verification code", 400)
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    if (user.isEmailVerified) {
      return next(new AppError("Email is already verified", 400));
    }

    if (!user.emailVerificationCode || !user.emailVerificationExpires) {
      return next(
        new AppError(
          "No verification code found. Please request a new one.",
          400
        )
      );
    }

    if (new Date() > user.emailVerificationExpires) {
      return next(
        new AppError(
          "Verification code has expired. Please request a new one.",
          400
        )
      );
    }

    if (user.emailVerificationCode !== code) {
      return next(new AppError("Invalid verification code", 400));
    }

    // Verify the email
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpires: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Send welcome email
    const url = `${req.protocol}://${req.get("host")}/me`;
    await new Email(updatedUser, url).sendWelcome();

    // Link any guest orders to this user account
    await linkGuestOrdersToUser(updatedUser.id, updatedUser.email);

    // Log user in
    createAndSendToken(updatedUser, 200, res);
  }
);

export const resendVerificationCode = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    if (!email) {
      return next(new AppError("Please provide email", 400));
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    if (user.isEmailVerified) {
      return next(new AppError("Email is already verified", 400));
    }

    // Generate new 6-digit verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationCode: verificationCode,
        emailVerificationExpires: verificationExpires,
      },
    });

    try {
      const url = `${req.protocol}://${req.get("host")}`;
      await new Email(user, url).sendVerificationCode(verificationCode);

      res.status(200).json({
        status: "success",
        message: "Verification code sent to your email.",
      });
    } catch (err) {
      return next(
        new AppError(
          "There was an error sending the verification email. Try again later!",
          500
        )
      );
    }
  }
);

export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError("Please provide email and password", 400));
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return next(new AppError("Incorrect email or password", 401));
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return next(
        new AppError(
          "Please verify your email before logging in. Check your inbox for the verification code.",
          401
        )
      );
    }

    // Check if user has a password (not Google-only account)
    if (!user.password) {
      return next(
        new AppError(
          "This account uses Google sign-in. Please sign in with Google.",
          401
        )
      );
    }

    if (!(await bcrypt.compare(password, user.password))) {
      return next(new AppError("Incorrect email or password", 401));
    }

    // Link any guest orders to this user account
    await linkGuestOrdersToUser(user.id, user.email);

    createAndSendToken(user, 200, res);
  }
);

export const logout = (req: Request, res: Response) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
};

export const protect = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new AppError("You are not logged in! Please log in to get access.", 401)
      );
    }

    const decoded: any = await (promisify(jwt.verify) as any)(
      token,
      process.env.JWT_SECRET!
    );

    const freshUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!freshUser) {
      return next(
        new AppError("The user belonging to this token no longer exists.", 401)
      );
    }

    // Debug logging in development
    if (process.env.NODE_ENV === "development") {
      console.log("[protect] User found:", {
        id: freshUser.id,
        email: freshUser.email,
        role: freshUser.role,
        roleType: typeof freshUser.role,
      });
    }

    req.user = freshUser;

    next();
  }
);

export const restrictTo = (...roles: string[]) => {
  return (req: UserRequest, res: Response, next: NextFunction) => {
    // Debug logging in development
    if (process.env.NODE_ENV === "development") {
      console.log("[restrictTo] Allowed roles:", roles);
      console.log(
        "[restrictTo] User:",
        req.user
          ? { id: req.user.id, email: req.user.email, role: req.user.role }
          : "null"
      );
    }

    // Check if user exists
    if (!req.user) {
      return next(
        new AppError("You are not logged in! Please log in to get access.", 401)
      );
    }

    // Check if user has a role
    const userRole = req.user.role;
    if (!userRole) {
      if (process.env.NODE_ENV === "development") {
        console.log("[restrictTo] ERROR: User role is missing/null/undefined");
      }
      return next(
        new AppError(
          "You do not have permission to do this action. User role is missing.",
          403
        )
      );
    }

    // Check if user's role is in the allowed roles (case-insensitive comparison)
    const normalizedUserRole = userRole.toLowerCase().trim();
    const normalizedAllowedRoles = roles.map((role) =>
      role.toLowerCase().trim()
    );

    if (process.env.NODE_ENV === "development") {
      console.log("[restrictTo] Normalized user role:", normalizedUserRole);
      console.log(
        "[restrictTo] Normalized allowed roles:",
        normalizedAllowedRoles
      );
      console.log(
        "[restrictTo] Match:",
        normalizedAllowedRoles.includes(normalizedUserRole)
      );
    }

    if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
      return next(
        new AppError("You do not have permission to do this action", 403)
      );
    }

    next();
  };
};

export const changePassword = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });

    if (!user) return next(new AppError("User not found", 404));

    // Check if user has a password (not Google-only account)
    if (!user.password) {
      return next(
        new AppError(
          "Google accounts cannot change password. Please set a password first.",
          400
        )
      );
    }

    const correct = await bcrypt.compare(
      req.body.passwordCurrent,
      user.password
    );
    if (!correct) return next(new AppError("Incorrect current password", 400));

    const hashedPassword = await hashPassword(req.body.password);

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        password: hashedPassword,
        changedPasswordAt: new Date(),
      },
    });

    createAndSendToken(updatedUser, 200, res);
  }
);

export const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await prisma.user.findUnique({
      where: { email: req.body.email },
    });
    if (!user) return next(new AppError("User not found", 404));

    // Generate 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetCode: resetCode,
        passwordResetCodeExpires: expires,
      },
    });

    try {
      const url = `${req.protocol}://${req.get("host")}`;
      await new Email(user, url).sendPasswordResetCode(resetCode);

      res.status(200).json({
        status: "success",
        message: "Password reset code sent to your email!",
      });
    } catch (err) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetCode: null,
          passwordResetCodeExpires: null,
        },
      });

      return next(
        new AppError(
          "There was an error sending the email. Try again later!",
          500
        )
      );
    }
  }
);

export const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, code, password } = req.body;

    if (!email || !code || !password) {
      return next(
        new AppError("Please provide email, reset code, and new password", 400)
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    if (!user.passwordResetCode || !user.passwordResetCodeExpires) {
      return next(
        new AppError("No reset code found. Please request a new one.", 400)
      );
    }

    if (new Date() > user.passwordResetCodeExpires) {
      return next(
        new AppError("Reset code has expired. Please request a new one.", 400)
      );
    }

    if (user.passwordResetCode !== code) {
      return next(new AppError("Invalid reset code", 400));
    }

    const hashedPassword = await hashPassword(password);

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        changedPasswordAt: new Date(),
        passwordResetCode: null,
        passwordResetCodeExpires: null,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Link any guest orders to this user account
    await linkGuestOrdersToUser(updatedUser.id, updatedUser.email);

    createAndSendToken(updatedUser, 200, res);
  }
);

// Google OAuth handlers
export const googleAuth = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // This will be handled by Passport middleware
    // The route will use passport.authenticate('google')
  }
);

export const googleCallback = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // After Passport authentication, user is attached to req.user
    const user = (req as any).user;

    if (!user) {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      return res.redirect(
        `${frontendUrl}/login?error=${encodeURIComponent(
          "authentication_failed"
        )}`
      );
    }

    // Link any guest orders to this user account
    await linkGuestOrdersToUser(user.id, user.email);

    const token = signToken(user.id);
    const cookieOptions: any = {
      expires: new Date(
        Date.now() +
          Number(process.env.JWT_COOKIE_EXPIRES || 90) * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
    };
    if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

    res.cookie("jwt", token, cookieOptions);

    // Redirect to frontend with token in query param
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  }
);
