import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../db.js";
import { promisify } from "util";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import Email from "../utils/email.js";

import { UserRequest } from "../types.js";



const signToken = (id: number) => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES as any,
  });
};


const hashPassword = async (password: string) => await bcrypt.hash(password, 12);

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

export const signup = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return next(new AppError("Please provide name, email and password", 400));
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return next(new AppError("Email already exists", 409));
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: role || "user",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(user, url).sendWelcome();

  createAndSendToken(user, 201, res);
});


export const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });
  
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  createAndSendToken(user, 200, res);
});

export const logout = (req: Request, res: Response) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
};

export const protect = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {

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

  const decoded: any = await (promisify(jwt.verify) as any)(token, process.env.JWT_SECRET!);

  const freshUser = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!freshUser) {
    return next(
      new AppError("The user belonging to this token no longer exists.", 401)
    );
  }

  req.user = freshUser;

  next();
});

export const restrictTo = (...roles: string[]) => {
  return (req: UserRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role!)) {
      return next(
        new AppError("You do not have permission to do this action", 403)
      );
    }
    next();
  };
};

export const changePassword = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });


  if (!user) return next(new AppError("User not found", 404));

  const correct = await bcrypt.compare(req.body.passwordCurrent, user.password);
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
});


export const forgotPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const user = await prisma.user.findUnique({
    where: { email: req.body.email },
  });
  if (!user) return next(new AppError("User not found", 404));

  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  const expires = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: hashedToken,
      passwordResetExpires: expires,
    },
  });

  try {
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/reset-password/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (err) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return next(new AppError('There was an error sending the email. Try again later!', 500));
  }
});


export const resetPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: { gt: new Date() },
    },
  });

  if (!user) return next(new AppError("Token invalid or expired", 400));

  const hashedPassword = await hashPassword(req.body.password);

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      changedPasswordAt: new Date(),
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });


  createAndSendToken(updatedUser, 200, res);
});
