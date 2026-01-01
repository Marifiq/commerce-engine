import multer from "multer";
import sharp from "sharp";
import { Request, Response, NextFunction } from "express";
import prisma from "../db.js";
import * as factory from "./handlerFactory.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";

// 1. Multer Memory Storage Configuration
const multerStorage = multer.memoryStorage();

// 2. Multer Filter (Allow only images)
const multerFilter = (req: Request, file: any, cb: any) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// Middleware for uploading a single image
export const uploadProductImage = upload.single("image");

// 3. Image Processing Middleware (Sharp)
export const resizeProductImage = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) return next();

  // Create a unique filename
  // Use timestamp or uuid, here we use a simple slug
  const filename = `product-${Date.now()}.webp`;

  // Define full path (ensure public/img/products exists)
  // sharp automatically handles the buffer from req.file.buffer
  await sharp(req.file.buffer)
    .resize(600, 600)
    .toFormat("webp")
    .webp({ quality: 90 })
    .toFile(`public/img/products/${filename}`);

  // Save filename to body so the createOne/updateOne factory can pick it up
  req.body.image = `/img/products/${filename}`;

  next();
});

// 4. Product CRUD Operations
export const getAllProducts = factory.getAll(prisma.product);
export const getProduct = factory.getOne(prisma.product, { reviews: true });
export const createProduct = factory.createOne(prisma.product);
export const updateProduct = factory.updateOne(prisma.product);
export const deleteProduct = factory.deleteOne(prisma.product);

// Additional logic (e.g., getting top products, etc.) can be added here
