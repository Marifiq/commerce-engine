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
import fs from "fs/promises";

// 1. Multer Memory Storage Configuration
const multerStorage = multer.memoryStorage();

// 2. Multer Filter (Allow images and videos)
const multerFilter = (req: Request, file: any, cb: any) => {
  if (file.mimetype.startsWith("image") || file.mimetype.startsWith("video")) {
    cb(null, true);
  } else {
    cb(new AppError("Please upload only images or videos.", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for videos
  },
});

// Middleware for uploading multiple files (images and videos)
export const uploadProductMedia = upload.fields([
  { name: "images", maxCount: 20 },
  { name: "videos", maxCount: 10 },
]);

// Legacy single image upload (for backward compatibility)
export const uploadProductImage = upload.single("image");

// 3. Media Processing Middleware
export const processProductMedia = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Process images
    const imageFiles = files?.images || [];
    const processedImages: string[] = [];

    for (const file of imageFiles) {
      const filename = `product-image-${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
      await sharp(file.buffer)
        .resize(600, 600)
        .toFormat("webp")
        .webp({ quality: 90 })
        .toFile(`public/img/products/${filename}`);
      processedImages.push(`/img/products/${filename}`);
    }

    // Process videos (just save them, no processing)
    const videoFiles = files?.videos || [];
    const processedVideos: string[] = [];

    // Ensure videos directory exists
    await fs.mkdir("public/img/videos", { recursive: true });

    for (const file of videoFiles) {
      const ext = file.originalname.split('.').pop() || 'mp4';
      const filename = `product-video-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      await fs.writeFile(`public/img/videos/${filename}`, file.buffer);
      processedVideos.push(`/img/videos/${filename}`);
    }

    // Store processed media in req.body for use in create/update handlers
    req.body.processedMedia = {
      images: processedImages,
      videos: processedVideos,
    };

    // For backward compatibility, set image to first image if available
    if (processedImages.length > 0) {
      req.body.image = processedImages[0];
    }

    next();
  }
);

// Legacy image processing middleware (for backward compatibility)
export const resizeProductImage = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) return next();

    // Create a unique filename
    const filename = `product-${Date.now()}.webp`;

    await sharp(req.file.buffer)
      .resize(600, 600)
      .toFormat("webp")
      .webp({ quality: 90 })
      .toFile(`public/img/products/${filename}`);

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
        media: {
          orderBy: { order: 'asc' },
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
        media: {
          orderBy: { order: 'asc' },
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

export const createProduct = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      name,
      description,
      price,
      category,
      image,
      section,
      stock,
      discountPercent,
      processedMedia,
      mediaData, // JSON string with order and isPrimary info
    } = req.body;

    // Parse mediaData if it's a string
    let mediaOrder: Array<{ url: string; type: string; isPrimary: boolean; order: number }> = [];
    if (mediaData) {
      try {
        mediaOrder = typeof mediaData === 'string' ? JSON.parse(mediaData) : mediaData;
      } catch (e) {
        // Invalid JSON, ignore
      }
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        category,
        image: image || "/images/placeholder.jpg",
        section,
        stock: parseInt(stock) || 0,
        discountPercent: discountPercent ? parseFloat(discountPercent) : 0,
      },
    });

    // Create media entries if processedMedia exists
    if (processedMedia) {
      const allMedia: Array<{ url: string; type: string; isPrimary: boolean; order: number }> = [];

      // Add images (match metadata by index)
      (processedMedia.images || []).forEach((url: string, index: number) => {
        const mediaInfo = mediaOrder[index] || {};
        allMedia.push({
          url,
          type: 'image',
          isPrimary: mediaInfo.isPrimary || (index === 0 && !mediaOrder.some((m: any) => m.isPrimary)),
          order: mediaInfo.order !== undefined ? mediaInfo.order : index,
        });
      });

      // Add videos (match metadata by index, offset by image count)
      (processedMedia.videos || []).forEach((url: string, index: number) => {
        const videoIndex = (processedMedia.images?.length || 0) + index;
        const mediaInfo = mediaOrder[videoIndex] || {};
        allMedia.push({
          url,
          type: 'video',
          isPrimary: mediaInfo.isPrimary || false,
          order: mediaInfo.order !== undefined ? mediaInfo.order : videoIndex,
        });
      });

      // Ensure only one primary
      if (allMedia.some((m) => m.isPrimary)) {
        allMedia.forEach((m) => {
          if (m.isPrimary) {
            // Keep this as primary
          }
        });
      } else if (allMedia.length > 0) {
        allMedia[0].isPrimary = true;
      }

      // Sort by order
      allMedia.sort((a, b) => a.order - b.order);

      // Create media records
      if (allMedia.length > 0) {
        await prisma.productMedia.createMany({
          data: allMedia.map((m) => ({
            productId: product.id,
            url: m.url,
            type: m.type,
            isPrimary: m.isPrimary,
            order: m.order,
          })),
        });
      }
    }

    // Fetch product with media
    const productWithMedia = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        media: {
          orderBy: { order: 'asc' },
        },
      },
    });

    res.status(201).json({
      status: "success",
      data: {
        data: productWithMedia,
      },
    });
  }
);
// Custom update product to handle reverse sync with offers
export const updateProduct = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const id = parseInt(req.params.id);
    const {
      name,
      description,
      price,
      category,
      image,
      section,
      stock,
      discountPercent,
      processedMedia,
      mediaData, // JSON string with order and isPrimary info
    } = req.body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      return next(new AppError("No product found with this ID", 404));
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price: parseFloat(price),
        category,
        image,
        section,
        stock: parseInt(stock),
        discountPercent: discountPercent ? parseFloat(discountPercent) : 0
      }
    });

    // Handle media updates if processedMedia exists
    if (processedMedia) {
      // Delete existing media
      await prisma.productMedia.deleteMany({
        where: { productId: id },
      });

      // Parse mediaData if it's a string
      let mediaOrder: Array<{ url: string; type: string; isPrimary: boolean; order: number }> = [];
      if (mediaData) {
        try {
          mediaOrder = typeof mediaData === 'string' ? JSON.parse(mediaData) : mediaData;
        } catch (e) {
          // Invalid JSON, ignore
        }
      }

      const allMedia: Array<{ url: string; type: string; isPrimary: boolean; order: number }> = [];

      // Add images (match metadata by index)
      (processedMedia.images || []).forEach((url: string, index: number) => {
        const mediaInfo = mediaOrder[index] || {};
        allMedia.push({
          url,
          type: 'image',
          isPrimary: mediaInfo.isPrimary || (index === 0 && !mediaOrder.some((m: any) => m.isPrimary)),
          order: mediaInfo.order !== undefined ? mediaInfo.order : index,
        });
      });

      // Add videos (match metadata by index, offset by image count)
      (processedMedia.videos || []).forEach((url: string, index: number) => {
        const videoIndex = (processedMedia.images?.length || 0) + index;
        const mediaInfo = mediaOrder[videoIndex] || {};
        allMedia.push({
          url,
          type: 'video',
          isPrimary: mediaInfo.isPrimary || false,
          order: mediaInfo.order !== undefined ? mediaInfo.order : videoIndex,
        });
      });

      // Ensure only one primary
      if (allMedia.some((m) => m.isPrimary)) {
        // Keep existing primary
      } else if (allMedia.length > 0) {
        allMedia[0].isPrimary = true;
      }

      // Sort by order
      allMedia.sort((a, b) => a.order - b.order);

      // Create media records
      if (allMedia.length > 0) {
        await prisma.productMedia.createMany({
          data: allMedia.map((m) => ({
            productId: id,
            url: m.url,
            type: m.type,
            isPrimary: m.isPrimary,
            order: m.order,
          })),
        });
      }
    }

    // If discountPercent was updated, sync with active offers
    if (discountPercent !== undefined) {
      const now = new Date();
      const numDiscount = parseFloat(discountPercent);

      if (numDiscount > 0) {
        // Find if there is already an active offer for this product
        const activeOffer = await prisma.offer.findFirst({
          where: {
            targetType: "product",
            targetId: id,
            isActive: true,
            AND: [
              { OR: [{ startDate: null }, { startDate: { lte: now } }] },
              { OR: [{ endDate: null }, { endDate: { gte: now } }] },
            ],
          },
        });

        if (activeOffer) {
          // Update existing active offer
          await prisma.offer.update({
            where: { id: activeOffer.id },
            data: {
              discountPercent: numDiscount,
              // Ensure name matches if we want (optional, but good for consistency)
            },
          });
        } else {
          // Create new active offer (without banner)
          await prisma.offer.create({
            data: {
              title: `Discount on ${name || existingProduct.name}`,
              description: `Automatic discount for ${name || existingProduct.name}`,
              discountPercent: numDiscount,
              targetType: "product",
              targetId: id,
              targetName: name || existingProduct.name,
              isActive: true,
              showBanner: false,
              startDate: now, // Start now
            },
          });
        }
      } else {
        // Discount is 0, deactivate any active offers for this product
        await prisma.offer.updateMany({
          where: {
            targetType: "product",
            targetId: id,
            isActive: true,
            AND: [
              { OR: [{ startDate: null }, { startDate: { lte: now } }] },
              { OR: [{ endDate: null }, { endDate: { gte: now } }] },
            ],
          },
          data: {
            isActive: false,
          },
        });
      }
    }

    res.status(200).json({
      status: "success",
      data: {
        data: updatedProduct
      }
    });
  }
);
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
