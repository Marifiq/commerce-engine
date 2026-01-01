import multer from "multer";
import sharp from "sharp";
import { Request, Response, NextFunction } from "express";
import prisma from "../db.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import * as authController from "./authController.js";
import fs from "fs/promises";
import path from "path";

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
export const uploadCategoryImage = upload.single("image");

// 3. Image Processing Middleware (Sharp) - handles multer file uploads
export const resizeCategoryImage = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) return next();

    // Ensure directory exists
    const dir = "public/img/categories";
    await fs.mkdir(dir, { recursive: true });

    // Create a unique filename
    const filename = `category-${Date.now()}.webp`;

    // Process and save image
    await sharp(req.file.buffer)
      .resize(400, 400)
      .toFormat("webp")
      .webp({ quality: 90 })
      .toFile(`${dir}/${filename}`);

    // Save filename to body so the route handler can pick it up
    req.body.image = `/img/categories/${filename}`;

    next();
  }
);

// 4. Base64 Image Processing Middleware - handles base64 strings from JSON
export const processBase64CategoryImage = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Skip if image is already processed by multer
    if (req.file) return next();

    // Skip if no image field in body or if it's null/undefined
    if (!req.body.image || req.body.image === null || req.body.image === undefined) {
      return next();
    }

    // Check if image is a base64 data URL
    if (typeof req.body.image === "string" && req.body.image.startsWith("data:image")) {
      try {
        // Ensure directory exists
        const dir = "public/img/categories";
        await fs.mkdir(dir, { recursive: true });

        // Extract base64 data and mime type
        const matches = req.body.image.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (!matches) {
          return next(new AppError("Invalid base64 image format", 400));
        }

        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, "base64");

        // Create a unique filename
        const filename = `category-${Date.now()}.webp`;

        // Process and save image using sharp
        await sharp(buffer)
          .resize(400, 400)
          .toFormat("webp")
          .webp({ quality: 90 })
          .toFile(`${dir}/${filename}`);

        // Replace base64 string with file path
        req.body.image = `/img/categories/${filename}`;
      } catch (error: any) {
        console.error("Error processing category image:", error);
        return next(new AppError("Error processing image: " + error.message, 400));
      }
    } else if (typeof req.body.image === "string" && req.body.image.trim() === "") {
      // Empty string means no image
      req.body.image = null;
    }

    next();
  }
);

// Helper to delete old image file if it exists
const deleteImageFile = async (imagePath: string | null) => {
  if (!imagePath) return;
  
  try {
    // Only delete if it's a local file path (starts with /img/)
    if (imagePath.startsWith("/img/")) {
      const fullPath = path.join("public", imagePath);
      await fs.unlink(fullPath).catch(() => {
        // Ignore errors if file doesn't exist
      });
    }
  } catch (error) {
    // Ignore errors when deleting old images
  }
};

// GET all categories
export const getAllCategories = catchAsync(
  async (req: Request, res: Response) => {
    const categories = await prisma.category.findMany({
      select: { id: true, name: true, image: true, createdAt: true },
      orderBy: { name: "asc" },
    });

    res.status(200).json({
      status: "success",
      data: {
        data: categories,
      },
    });
  }
);

// POST new category (admin only)
export const createCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return next(new AppError("Category name is required", 400));
    }

    const trimmedName = name.trim();

    // Check if category already exists
    const existingCategory = await prisma.category.findUnique({
      where: { name: trimmedName },
    });

    if (existingCategory) {
      return next(new AppError("Category already exists", 400));
    }

    const category = await prisma.category.create({
      data: {
        name: trimmedName,
        image: req.body.image || null,
      },
    });

    res.status(201).json({
      status: "success",
      data: { data: category },
    });
  }
);

// PATCH category (admin only)
export const updateCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { oldName } = req.params;
    const { newName } = req.body;

    // Check if old category exists
    const oldCategory = await prisma.category.findUnique({
      where: { name: oldName },
    });

    if (!oldCategory) {
      return next(new AppError("Category not found", 404));
    }

    // Prepare update data
    const updateData: any = {};

    // Handle name update (only if newName is provided and different)
    if (newName && newName.trim() && newName.trim() !== oldName) {
      const trimmedNewName = newName.trim();

      // Check if new name already exists
      const existingCategory = await prisma.category.findUnique({
        where: { name: trimmedNewName },
      });

      if (existingCategory) {
        return next(new AppError("A category with this name already exists", 400));
      }

      updateData.name = trimmedNewName;
    }

    // Handle image update (only if image field is provided)
    if (req.body.image !== undefined) {
      // Delete old image if we're updating with a new one
      if (req.body.image && oldCategory.image) {
        await deleteImageFile(oldCategory.image);
      }
      // If image is being removed (null or empty string)
      if (!req.body.image || req.body.image === "" || req.body.image === null) {
        if (oldCategory.image) {
          await deleteImageFile(oldCategory.image);
        }
        updateData.image = null;
      } else {
        updateData.image = req.body.image;
      }
    }

    // If no updates, return current category
    if (Object.keys(updateData).length === 0) {
      return res.status(200).json({
        status: "success",
        data: { data: oldCategory },
      });
    }

    // Update category
    const updatedCategory = await prisma.category.update({
      where: { name: oldName },
      data: updateData,
    });

    // Update all products using this category if name changed
    if (updateData.name) {
      await prisma.product.updateMany({
        where: { category: oldName },
        data: { category: updateData.name },
      });
    }

    res.status(200).json({
      status: "success",
      data: { data: updatedCategory },
    });
  }
);

// DELETE category (admin only)
export const deleteCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.params;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { name },
    });

    if (!category) {
      return next(new AppError("Category not found", 404));
    }

    // Delete the category image file
    if (category.image) {
      await deleteImageFile(category.image);
    }

    // Delete the category
    await prisma.category.delete({
      where: { name },
    });

    // Update all products using this category to "Uncategorized"
    let uncategorized = await prisma.category.findUnique({
      where: { name: "Uncategorized" },
    });

    if (!uncategorized) {
      uncategorized = await prisma.category.create({
        data: { name: "Uncategorized" },
      });
    }

    // Update products
    await prisma.product.updateMany({
      where: { category: name },
      data: { category: "Uncategorized" },
    });

    res.status(204).json({
      status: "success",
      data: null,
    });
  }
);

