import { Response, NextFunction } from "express";
import prisma from "../db.js";
import * as factory from "./handlerFactory.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import { UserRequest } from "../types.js";
import multer from "multer";
import sharp from "sharp";
import fs from "fs/promises";
import bcrypt from "bcryptjs";
import { uploadToSupabase } from "../utils/supabaseStorage.js";

const filterObj = (obj: any, ...allowedFields: string[]) => {
  const newObj: any = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// Multer configuration for profile images
const multerStorage = multer.memoryStorage();
const multerFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export const uploadProfileImage = upload.single("profileImage");

// Profile image processing middleware
export const processProfileImage = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    // Skip if image is already processed by multer
    if (req.file) {
      try {
        const filename = `profile-${Date.now()}-${req.user!.id}.webp`;

        // Process with Sharp and upload to products bucket (handles both Supabase and local storage)
        const processedBuffer = await sharp(req.file.buffer)
          .resize(400, 400)
          .toFormat("webp")
          .webp({ quality: 90 })
          .toBuffer();

        req.body.profileImage = await uploadToSupabase(processedBuffer, filename, "images", "products");
      } catch (error: any) {
        console.error("Error processing profile image:", error);
        return next(new AppError("Error processing image: " + error.message, 400));
      }
      return next();
    }

    // Handle base64 image strings
    if (req.body.profileImage && typeof req.body.profileImage === "string" && req.body.profileImage.startsWith("data:image")) {
      try {
        // Extract base64 data and mime type
        const matches = req.body.profileImage.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (!matches) {
          return next(new AppError("Invalid base64 image format", 400));
        }

        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, "base64");
        const filename = `profile-${Date.now()}-${req.user!.id}.webp`;

        // Process with Sharp and upload to products bucket (handles both Supabase and local storage)
        const processedBuffer = await sharp(buffer)
          .resize(400, 400)
          .toFormat("webp")
          .webp({ quality: 90 })
          .toBuffer();

        req.body.profileImage = await uploadToSupabase(processedBuffer, filename, "images", "products");
      } catch (error: any) {
        console.error("Error processing profile image:", error);
        return next(new AppError("Error processing image: " + error.message, 400));
      }
    } else if (req.body.profileImage === "" || req.body.profileImage === null) {
      // Empty string or null means remove profile image
      req.body.profileImage = null;
    }

    next();
  }
);

export const getMe = (req: UserRequest, res: Response, next: NextFunction) => {
  if (!req.user) return next(new AppError("You are not logged in", 401));
  req.params.id = req.user.id!.toString();
  next();
};



export const updateMe = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /change-my-password.",
        400
      )
    );
  }

  // 2) Don't allow email updates here - use updateEmail endpoint
  if (req.body.email) {
    return next(
      new AppError(
        "This route is not for email updates. Please use /update-email.",
        400
      )
    );
  }

  // 3) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(
    req.body,
    "name",
    "profileImage",
    "gender",
    "phoneNumber",
    "addressStreet",
    "addressCity",
    "addressState",
    "addressZip",
    "addressCountry"
  );

  // 4) Update user document
  const updatedUser = await prisma.user.update({
    where: { id: req.user!.id },
    data: filteredBody,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profileImage: true,
      gender: true,
      phoneNumber: true,
      addressStreet: true,
      addressCity: true,
      addressState: true,
      addressZip: true,
      addressCountry: true,
      createdAt: true,
    },
  });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

export const updateEmail = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
  });

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  // Verify password
  const correct = await bcrypt.compare(password, user.password);
  if (!correct) {
    return next(new AppError("Incorrect password", 401));
  }

  // Check if email is already taken
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser && existingUser.id !== req.user!.id) {
    return next(new AppError("Email already in use", 409));
  }

  // Update email
  const updatedUser = await prisma.user.update({
    where: { id: req.user!.id },
    data: { email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profileImage: true,
      gender: true,
      phoneNumber: true,
      addressStreet: true,
      addressCity: true,
      addressState: true,
      addressZip: true,
      addressCountry: true,
      createdAt: true,
    },
  });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

export const deleteMe = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  await prisma.user.delete({
    where: { id: req.user!.id },
  });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

export const getUserDetails = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return next(new AppError("Invalid user ID", 400));
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      orders: {
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' }
      },
      cart: {
        include: { items: { include: { product: true } } }
      },
      reviews: {
        include: { product: true },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  const metrics = {
    totalOrders: user.orders.length,
    totalSpent: user.orders.reduce((sum, o) => sum + o.totalAmount, 0),
    activeCartItems: user.cart?.items.length || 0,
    totalReviews: user.reviews.length
  };

  res.status(200).json({
    status: "success",
    data: {
      user,
      orders: user.orders,
      cart: user.cart,
      reviews: user.reviews,
      metrics
    }
  });
});

// Get list of other users (for regular users to see and message)
export const getOtherUsers = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const currentUserId = req.user!.id!;
  const { search, page = "1", limit = "50" } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {
    id: { not: currentUserId },
    role: "user", // Only show regular users, not admins
  };

  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: "insensitive" } },
      { email: { contains: search as string, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limitNum,
    }),
    prisma.user.count({ where }),
  ]);

  res.status(200).json({
    status: "success",
    data: {
      users,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

export const getAllUsers = factory.getAll(prisma.user);
export const getUser = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const userId = parseInt(req.params.id);
  
  if (isNaN(userId)) {
    return next(new AppError("Invalid user ID", 400));
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profileImage: true,
      gender: true,
      phoneNumber: true,
      addressStreet: true,
      addressCity: true,
      addressState: true,
      addressZip: true,
      addressCountry: true,
      createdAt: true,
    },
  });

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});
export const createUser = factory.createOne(prisma.user);
export const updateUser = factory.updateOne(prisma.user);
export const deleteUser = factory.deleteOne(prisma.user);


