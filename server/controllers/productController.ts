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
import { uploadToSupabase } from "../utils/supabaseStorage.js";
import { fixOfferSequence } from "../utils/fixSequence.js";

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
      
      // Process image with Sharp and upload (handles both Supabase and local storage)
      const processedBuffer = await sharp(file.buffer)
        .resize(600, 600)
        .toFormat("webp")
        .webp({ quality: 90 })
        .toBuffer();
      
      const publicUrl = await uploadToSupabase(processedBuffer, filename, "images", "products");
      processedImages.push(publicUrl);
    }

    // Process videos
    const videoFiles = files?.videos || [];
    const processedVideos: string[] = [];

    for (const file of videoFiles) {
      const ext = file.originalname.split('.').pop() || 'mp4';
      const filename = `product-video-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      
      // Upload video (handles both Supabase and local storage)
      const publicUrl = await uploadToSupabase(file.buffer, filename, "videos", "products");
      processedVideos.push(publicUrl);
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

    const filename = `product-${Date.now()}.webp`;
    // Process image with Sharp and upload (handles both Supabase and local storage)
    const processedBuffer = await sharp(req.file.buffer)
      .resize(600, 600)
      .toFormat("webp")
      .webp({ quality: 90 })
      .toBuffer();
    
    req.body.image = await uploadToSupabase(processedBuffer, filename, "images", "products");

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
    // Also filter out archived products unless includeArchived is true (admin only)
    const includeArchived = isAdmin && req.query.includeArchived === "true";
    const whereClause = isAdmin
      ? { ...features.prismaQuery.where, ...(includeArchived ? {} : { isArchived: false }) }
      : { ...features.prismaQuery.where, stock: { gt: 0 }, isArchived: false };

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
    const includeOptions: any = {
      _count: {
        select: { reviews: true },
      },
      reviews: {
        select: { rating: true },
      },
      media: {
        orderBy: { order: 'asc' },
      },
    };
    
    // Conditionally include sizes - will be added after migration
    // For now, check if we can safely include it
    const hasSizesTable = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ProductSize'
      );
    `.then((result: any) => result[0]?.exists).catch(() => false);

    if (hasSizesTable) {
      includeOptions.sizes = {
        orderBy: { size: 'asc' },
      };
    }

    const docs = await prisma.product.findMany({
      ...features.prismaQuery,
      where: whereClause,
      include: includeOptions,
    });

    // Filter out size-enabled products where all sizes are out of stock (for non-admin users)
    const filteredDocs = !isAdmin
      ? docs.filter((doc: any) => {
          // For size-enabled products, check if any size has stock > 0
          if (doc.sizeEnabled && doc.sizes && doc.sizes.length > 0) {
            return doc.sizes.some((s: any) => s.stock > 0);
          }
          // For non-size-enabled products, stock filtering is already done in whereClause
          return true;
        })
      : docs;

    const enrichedDocs = filteredDocs.map((doc: any) => {
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
    const includeOptions: any = {
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
    };
    
    // Conditionally include sizes - will be added after migration
    const hasSizesTable = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ProductSize'
      );
    `.then((result: any) => result[0]?.exists).catch(() => false);

    if (hasSizesTable) {
      includeOptions.sizes = {
        orderBy: { size: 'asc' },
      };
    }

    const doc = await prisma.product.findUnique({
      where: { id },
      include: includeOptions,
    });

    if (!doc) {
      return next(new AppError("No product found with this ID", 404));
    }

    // Check if user is admin (optional check for public route)
    const user = await getOptionalUser(req);
    const isAdmin = user?.role?.toLowerCase() === "admin";

    // Hide out-of-stock products from public views (admins can see them)
    // For size-enabled products, check if all sizes are out of stock
    if (doc.sizeEnabled && doc.sizes && doc.sizes.length > 0) {
      const hasAvailableSize = doc.sizes.some((s: any) => s.stock > 0);
      if (!hasAvailableSize && !isAdmin) {
        return next(new AppError("No product found with this ID", 404));
      }
    } else if (doc.stock <= 0 && !isAdmin) {
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
        sizeEnabled: req.body.sizeEnabled === true || req.body.sizeEnabled === "true" || false,
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

    const updateData: any = {
      name,
      description,
      price: parseFloat(price),
      category,
      image,
      section,
      stock: parseInt(stock),
      discountPercent: discountPercent ? parseFloat(discountPercent) : 0,
    };

    // Only update sizeEnabled if provided
    if (req.body.sizeEnabled !== undefined) {
      updateData.sizeEnabled = req.body.sizeEnabled === true || req.body.sizeEnabled === "true";
      
      // If enabling sizes, recalculate stock from sizes
      if (updateData.sizeEnabled) {
        const allSizes = await prisma.productSize.findMany({
          where: { productId: id },
        });
        updateData.stock = allSizes.reduce((sum, s) => sum + s.stock, 0);
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData
    });

    // Handle media updates - merge existing and new media
    if (mediaData) {
      // Parse mediaData if it's a string
      let mediaOrder: Array<{ 
        url?: string; 
        type: string; 
        isPrimary: boolean; 
        order: number;
        isNew?: boolean;
      }> = [];
      try {
        mediaOrder = typeof mediaData === 'string' ? JSON.parse(mediaData) : mediaData;
      } catch (e) {
        // Invalid JSON, ignore
      }

      // Get new upload URLs from processedMedia
      const newImageUrls = processedMedia?.images || [];
      const newVideoUrls = processedMedia?.videos || [];
      let newImageIndex = 0;
      let newVideoIndex = 0;

      // Build final media array from mediaOrder
      const allMedia: Array<{ url: string; type: string; isPrimary: boolean; order: number }> = [];

      mediaOrder.forEach((mediaInfo: any) => {
        let url: string;
        
        if (mediaInfo.isNew) {
          // This is a new upload - get URL from processedMedia
          if (mediaInfo.type === 'image' && newImageIndex < newImageUrls.length) {
            url = newImageUrls[newImageIndex];
            newImageIndex++;
          } else if (mediaInfo.type === 'video' && newVideoIndex < newVideoUrls.length) {
            url = newVideoUrls[newVideoIndex];
            newVideoIndex++;
          } else {
            // Skip if URL not available
            return;
          }
        } else {
          // This is existing media - use provided URL
          url = mediaInfo.url;
          if (!url) {
            // Skip if no URL
            return;
          }
        }

        allMedia.push({
          url,
          type: mediaInfo.type,
          isPrimary: mediaInfo.isPrimary || false,
          order: mediaInfo.order !== undefined ? mediaInfo.order : allMedia.length,
        });
      });

      // Ensure only one primary
      const primaryCount = allMedia.filter(m => m.isPrimary).length;
      if (primaryCount === 0 && allMedia.length > 0) {
        allMedia[0].isPrimary = true;
      } else if (primaryCount > 1) {
        // Keep first primary, remove others
        let foundFirst = false;
        allMedia.forEach(m => {
          if (m.isPrimary && foundFirst) {
            m.isPrimary = false;
          } else if (m.isPrimary) {
            foundFirst = true;
          }
        });
      }

      // Sort by order
      allMedia.sort((a, b) => a.order - b.order);

      // Delete all existing media and recreate
      await prisma.productMedia.deleteMany({
        where: { productId: id },
      });

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
    } else if (processedMedia) {
      // Fallback: if mediaData not provided but processedMedia exists, use old logic
      await prisma.productMedia.deleteMany({
        where: { productId: id },
      });

      const allMedia: Array<{ url: string; type: string; isPrimary: boolean; order: number }> = [];

      (processedMedia.images || []).forEach((url: string, index: number) => {
        allMedia.push({
          url,
          type: 'image',
          isPrimary: index === 0,
          order: index,
        });
      });

      (processedMedia.videos || []).forEach((url: string, index: number) => {
        allMedia.push({
          url,
          type: 'video',
          isPrimary: false,
          order: (processedMedia.images?.length || 0) + index,
        });
      });

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
          try {
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
          } catch (error: any) {
            // Handle sequence out-of-sync error
            // P2002 is unique constraint violation, and if it's on the 'id' field,
            // it's likely a sequence issue
            const isIdConstraintError = 
              error.code === 'P2002' && 
              (error.meta?.target?.includes('id') || 
               error.message?.includes('Unique constraint failed on the fields: (`id`)'));
            
            if (isIdConstraintError) {
              console.warn('⚠️  Offer sequence out of sync, fixing...');
              await fixOfferSequence();
              // Retry the create operation
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
            } else {
              // Re-throw if it's a different error
              throw error;
            }
          }
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
export const deleteProduct = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const productId = parseInt(req.params.id);

    if (isNaN(productId)) {
      return next(new AppError("Invalid product ID", 400));
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    // Delete related records first to avoid foreign key constraint violations
    // Delete cart items that reference this product
    await prisma.cartItem.deleteMany({
      where: { productId },
    });

    // Delete order items that reference this product (but keep the orders)
    await prisma.orderItem.deleteMany({
      where: { productId },
    });

    // Delete reviews that reference this product
    await prisma.review.deleteMany({
      where: { productId },
    });

    // Note: ProductMedia, OfferProduct, and ProductSize will be deleted automatically
    // due to cascade delete constraints in the schema

    // Finally, delete the product
    await prisma.product.delete({
      where: { id: productId },
    });

    res.status(204).json({
      status: "success",
      requestedAt: (req as any).requestTime,
      data: null,
    });
  }
);

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

// Size Management Functions
// Get all sizes for a product
export const getProductSizes = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const productId = parseInt(req.params.id);
    
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    const sizes = await prisma.productSize.findMany({
      where: { productId },
      orderBy: { size: 'asc' },
    });

    res.status(200).json({
      status: "success",
      data: { sizes },
    });
  }
);

// Add or update a size for a product
export const addProductSize = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const productId = parseInt(req.params.id);
    const { size, stock } = req.body;

    if (!size || stock === undefined) {
      return next(new AppError("Please provide size and stock", 400));
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    // Upsert size (create or update if exists)
    const productSize = await prisma.productSize.upsert({
      where: {
        productId_size: {
          productId,
          size: size.trim(),
        },
      },
      update: {
        stock: parseInt(stock),
      },
      create: {
        productId,
        size: size.trim(),
        stock: parseInt(stock),
      },
    });

    // Update product total stock if sizeEnabled is true
    if (product.sizeEnabled) {
      const allSizes = await prisma.productSize.findMany({
        where: { productId },
      });
      const totalStock = allSizes.reduce((sum, s) => sum + s.stock, 0);
      
      await prisma.product.update({
        where: { id: productId },
        data: { stock: totalStock },
      });
    }

    res.status(200).json({
      status: "success",
      data: { size: productSize },
    });
  }
);

// Delete a size from a product
export const deleteProductSize = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const productId = parseInt(req.params.id);
    const { size } = req.body;

    if (!size) {
      return next(new AppError("Please provide size", 400));
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    await prisma.productSize.deleteMany({
      where: {
        productId,
        size: size.trim(),
      },
    });

    // Update product total stock if sizeEnabled is true
    if (product.sizeEnabled) {
      const allSizes = await prisma.productSize.findMany({
        where: { productId },
      });
      const totalStock = allSizes.reduce((sum, s) => sum + s.stock, 0);
      
      await prisma.product.update({
        where: { id: productId },
        data: { stock: totalStock },
      });
    }

    res.status(204).json({
      status: "success",
      data: null,
    });
  }
);

// Toggle size enabled for a product
export const toggleSizeEnabled = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const productId = parseInt(req.params.id);
    const { sizeEnabled } = req.body;

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    // If enabling sizes, calculate total stock from sizes
    let newStock = product.stock;
    if (sizeEnabled) {
      const allSizes = await prisma.productSize.findMany({
        where: { productId },
      });
      newStock = allSizes.reduce((sum, s) => sum + s.stock, 0);
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        sizeEnabled: sizeEnabled === true || sizeEnabled === "true",
        stock: newStock,
      },
      include: {
        sizes: {
          orderBy: { size: 'asc' },
        },
      },
    });

    res.status(200).json({
      status: "success",
      data: { product: updatedProduct },
    });
  }
);

// Archive product
export const archiveProduct = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const productId = parseInt(req.params.id);

    if (isNaN(productId)) {
      return next(new AppError("Invalid product ID", 400));
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { isArchived: true },
    });

    res.status(200).json({
      status: "success",
      data: { product: updatedProduct },
    });
  }
);

// Unarchive product
export const unarchiveProduct = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const productId = parseInt(req.params.id);

    if (isNaN(productId)) {
      return next(new AppError("Invalid product ID", 400));
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { isArchived: false },
    });

    res.status(200).json({
      status: "success",
      data: { product: updatedProduct },
    });
  }
);

// Get archived products (admin only)
export const getArchivedProducts = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const features = new APIFeatures(req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const whereClause = {
      ...features.prismaQuery.where,
      isArchived: true,
    };

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
          orderBy: { order: "asc" },
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

      const { reviews, _count, ...rest } = doc as any;
      return {
        ...rest,
        reviewCount,
        averageRating,
      };
    });

    res.status(200).json({
      status: "success",
      results: enrichedDocs.length,
      data: { data: enrichedDocs },
    });
  }
);
