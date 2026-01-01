import multer from "multer";
import sharp from "sharp";
import { Request, Response, NextFunction } from "express";
import prisma from "../db.js";
import * as factory from "./handlerFactory.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import { APIFeatures } from "../utils/apiFeatures.js";
import jwt from "jsonwebtoken";
import { promisify } from "util";

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
export const resizeProductImage = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
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
  }
);

// Helper to optionally get user from token (for public routes that need to check admin status)
const getOptionalUser = async (req: Request): Promise<any> => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) return null;

  try {
    const decoded: any = await (promisify(jwt.verify) as any)(
      token,
      process.env.JWT_SECRET!
    );
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true },
    });
    return user;
  } catch (error) {
    return null;
  }
};

// Helper to calculate discounted price for a product (using category discount map)
const calculateDiscountedPrice = (
  product: any,
  categoryDiscountMap: Map<string, number>
): {
  originalPrice: number;
  discountedPrice: number;
  discountPercent: number;
} => {
  let discountPercent = product.discountPercent || 0;

  // If product doesn't have discount, check category discount from map
  if (!discountPercent || discountPercent === 0) {
    const categoryDiscount = categoryDiscountMap.get(product.category);
    if (categoryDiscount && categoryDiscount > 0) {
      discountPercent = categoryDiscount;
    }
  }

  const originalPrice = product.price;
  const discountedPrice =
    discountPercent > 0
      ? Number((originalPrice * (1 - discountPercent / 100)).toFixed(2))
      : originalPrice;

  return {
    originalPrice,
    discountedPrice,
    discountPercent: discountPercent || 0,
  };
};

// 4. Product CRUD Operations
export const getAllProducts = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const features = new APIFeatures(req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // Check if user is admin (optional check for public route)
    const user = await getOptionalUser(req);
    const isAdmin = user?.role?.toLowerCase() === "admin";

    // Build the where clause - filter out products with stock <= 0 from public views
    // Admins can see all products including out-of-stock ones
    const whereClause = isAdmin
      ? features.prismaQuery.where
      : { ...features.prismaQuery.where, stock: { gt: 0 } };

    // Fetch all categories with discounts once (for efficient discount calculation)
    const categoriesWithDiscounts = await prisma.category.findMany({
      where: {
        discountPercent: { gt: 0 },
      },
      select: {
        name: true,
        discountPercent: true,
      },
    });

    const categoryDiscountMap = new Map(
      categoriesWithDiscounts.map((cat) => [cat.name, cat.discountPercent || 0])
    );

    // Enrich with review stats
    const docs = await prisma.product.findMany({
      ...features.prismaQuery,
      where: whereClause,
      include: {
        _count: {
          select: { reviews: true },
        },
        reviews: {
          select: { rating: true },
        },
      },
    });

    const enrichedDocs = docs.map((doc: any) => {
      const reviewCount = doc._count.reviews;
      const totalRating = doc.reviews.reduce(
        (acc: number, rev: any) => acc + rev.rating,
        0
      );
      const averageRating =
        reviewCount > 0 ? Number((totalRating / reviewCount).toFixed(1)) : 0;

      // Calculate discounted price using the category discount map
      const priceInfo = calculateDiscountedPrice(doc, categoryDiscountMap);

      // Remove the reviews array from final output if not requested
      const { reviews, _count, ...rest } = doc as any;
      return {
        ...rest,
        reviewCount,
        averageRating,
        originalPrice: priceInfo.originalPrice,
        discountedPrice: priceInfo.discountedPrice,
        discountPercent: priceInfo.discountPercent,
        hasDiscount: priceInfo.discountPercent > 0,
      };
    });

    res.status(200).json({
      status: "success",
      results: enrichedDocs.length,
      data: {
        data: enrichedDocs,
      },
    });
  }
);

export const getProduct = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = parseInt(req.params.id);
    const doc = await prisma.product.findUnique({
      where: { id },
      include: {
        reviews: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
        _count: {
          select: { reviews: true },
        },
      },
    });

    if (!doc) {
      return next(new AppError("No product found with this ID", 404));
    }

    // Check if user is admin (optional check for public route)
    const user = await getOptionalUser(req);
    const isAdmin = user?.role?.toLowerCase() === "admin";

    // Hide out-of-stock products from public views (admins can see them)
    if (doc.stock <= 0 && !isAdmin) {
      return next(new AppError("No product found with this ID", 404));
    }

    const reviewCount = (doc as any)._count.reviews;
    const totalRating = (doc as any).reviews.reduce(
      (acc: number, rev: any) => acc + rev.rating,
      0
    );
    const averageRating =
      reviewCount > 0 ? Number((totalRating / reviewCount).toFixed(1)) : 0;

    // Fetch category discount if needed
    const category = await prisma.category.findUnique({
      where: { name: doc.category },
      select: { discountPercent: true },
    });

    const categoryDiscountMap = new Map<string, number>();
    if (category && category.discountPercent) {
      categoryDiscountMap.set(doc.category, category.discountPercent);
    }

    // Calculate discounted price
    const priceInfo = calculateDiscountedPrice(doc, categoryDiscountMap);

    res.status(200).json({
      status: "success",
      data: {
        data: {
          ...doc,
          reviewCount,
          averageRating,
          originalPrice: priceInfo.originalPrice,
          discountedPrice: priceInfo.discountedPrice,
          discountPercent: priceInfo.discountPercent,
          hasDiscount: priceInfo.discountPercent > 0,
        },
      },
    });
  }
);

export const createProduct = factory.createOne(prisma.product);
export const updateProduct = factory.updateOne(prisma.product);
export const deleteProduct = factory.deleteOne(prisma.product);

// Additional logic
export const getCategories = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const categories = await prisma.product.findMany({
      distinct: ["category"],
      select: { category: true },
    });

    res.status(200).json({
      status: "success",
      data: {
        data: categories.map((c) => c.category),
      },
    });
  }
);

export const getBestSellers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Logic: salesCount (from OrderItem) * 2 + reviewCount * 5 + avgRating * 3
    // Only products with rating > 4 and at least one review with comment
    // Check if user is admin (optional check for public route)
    const user = await getOptionalUser(req);
    const isAdmin = user?.role?.toLowerCase() === "admin";

    // Filter out products with stock <= 0 from public views
    // Admins can see all products including out-of-stock ones
    const products = await prisma.product.findMany({
      where: isAdmin ? {} : { stock: { gt: 0 } },
      include: {
        _count: {
          select: {
            reviews: true,
            orderItems: true,
          },
        },
        reviews: {
          select: { rating: true, text: true },
        },
        orderItems: {
          select: { quantity: true },
        },
      },
    });

    const scoredProducts = products
      .map((p: any) => {
        const sCount = p.orderItems.reduce(
          (acc: number, item: any) => acc + item.quantity,
          0
        );

        // Only count reviews that have comments (text)
        const reviewsWithComments = p.reviews.filter(
          (rev: any) => rev.text && rev.text.trim().length > 0
        );
        const rCount = reviewsWithComments.length;

        // Calculate average rating only from reviews with comments
        const totalRating = reviewsWithComments.reduce(
          (acc: number, rev: any) => acc + rev.rating,
          0
        );
        const avgRating = rCount > 0 ? totalRating / rCount : 0;

        const popularityScore = sCount * 2 + rCount * 5 + avgRating * 3;

        return {
          ...p,
          salesCount: sCount,
          reviewCount: rCount,
          averageRating: Number(avgRating.toFixed(1)),
          popularityScore,
        };
      })
      // Filter: only products with rating > 4 and at least one review with comment
      .filter((p: any) => p.averageRating > 4 && p.reviewCount > 0);

    scoredProducts.sort((a, b) => b.popularityScore - a.popularityScore);

    res.status(200).json({
      status: "success",
      data: {
        data: scoredProducts.slice(0, 6),
      },
    });
  }
);

// Get all discounted products (Off section)
export const getDiscountedProducts = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Check if user is admin (optional check for public route)
    const user = await getOptionalUser(req);
    const isAdmin = user?.role?.toLowerCase() === "admin";

    const now = new Date();

    // Get all active offers
    const activeOffers = await prisma.offer.findMany({
      where: {
        isActive: true,
        AND: [
          {
            OR: [{ startDate: null }, { startDate: { lte: now } }],
          },
          {
            OR: [{ endDate: null }, { endDate: { gte: now } }],
          },
        ],
      },
    });

    // Create maps for offer discounts
    const productOfferMap = new Map<number, number>();
    const categoryOfferMap = new Map<string, number>();

    // Fetch category names for category offers if needed
    const categoryIds = activeOffers
      .filter((o) => o.targetType === "category" && o.targetId)
      .map((o) => o.targetId!);

    const categoriesForOffers =
      categoryIds.length > 0
        ? await prisma.category.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, name: true },
          })
        : [];

    const categoryIdToNameMap = new Map(
      categoriesForOffers.map((c) => [c.id, c.name])
    );

    activeOffers.forEach((offer) => {
      if (offer.targetType === "product" && offer.targetId) {
        productOfferMap.set(offer.targetId, offer.discountPercent);
      } else if (offer.targetType === "category" && offer.targetId) {
        // Get category name from offer or from database
        const categoryName =
          offer.targetName || categoryIdToNameMap.get(offer.targetId) || "";
        if (categoryName) {
          categoryOfferMap.set(categoryName, offer.discountPercent);
        }
      } else if (offer.targetType === "all") {
        // This will be applied to all products, we'll handle it separately
      }
    });

    // Get all products with stock > 0 (or all for admin)
    const products = await prisma.product.findMany({
      where: isAdmin ? {} : { stock: { gt: 0 } },
      include: {
        _count: {
          select: { reviews: true },
        },
        reviews: {
          select: { rating: true },
        },
      },
    });

    // Get all categories with discounts
    const categoriesWithDiscounts = await prisma.category.findMany({
      where: {
        discountPercent: { gt: 0 },
      },
      select: {
        name: true,
        discountPercent: true,
      },
    });

    const categoryDiscountMap = new Map(
      categoriesWithDiscounts.map((cat) => [cat.name, cat.discountPercent || 0])
    );

    // Merge category discounts with offer discounts
    categoryOfferMap.forEach((discount, categoryName) => {
      const existing = categoryDiscountMap.get(categoryName) || 0;
      categoryDiscountMap.set(categoryName, Math.max(existing, discount));
    });

    // Filter products that have discounts (product-level, category-level, or from active offers)
    const discountedProducts = products
      .map((product: any) => {
        // Check product-level discount (from product or offer)
        const productDiscount = product.discountPercent || 0;
        const productOfferDiscount = productOfferMap.get(product.id) || 0;
        const finalProductDiscount = Math.max(
          productDiscount,
          productOfferDiscount
        );

        // Check category-level discount
        const categoryDiscount = categoryDiscountMap.get(product.category) || 0;

        // Check for "all products" offers
        let allProductsDiscount = 0;
        activeOffers.forEach((offer) => {
          if (offer.targetType === "all") {
            allProductsDiscount = Math.max(
              allProductsDiscount,
              offer.discountPercent
            );
          }
        });

        // Get the highest discount from all applicable sources
        const effectiveDiscount = Math.max(
          finalProductDiscount,
          categoryDiscount,
          allProductsDiscount
        );

        if (effectiveDiscount > 0) {
          // Create a temporary product object with the effective discount for price calculation
          const tempProduct = {
            ...product,
            discountPercent: effectiveDiscount,
          };

          const priceInfo = calculateDiscountedPrice(
            tempProduct,
            categoryDiscountMap
          );
          const reviewCount = product._count.reviews;
          const totalRating = product.reviews.reduce(
            (acc: number, rev: any) => acc + rev.rating,
            0
          );
          const averageRating =
            reviewCount > 0
              ? Number((totalRating / reviewCount).toFixed(1))
              : 0;

          return {
            ...product,
            reviewCount,
            averageRating,
            originalPrice: priceInfo.originalPrice,
            discountedPrice: priceInfo.discountedPrice,
            discountPercent: effectiveDiscount,
            hasDiscount: true,
          };
        }
        return null;
      })
      .filter((p: any) => p !== null);

    // Sort by discount percentage (highest first)
    discountedProducts.sort(
      (a: any, b: any) => b.discountPercent - a.discountPercent
    );

    res.status(200).json({
      status: "success",
      results: discountedProducts.length,
      data: {
        data: discountedProducts,
      },
    });
  }
);
