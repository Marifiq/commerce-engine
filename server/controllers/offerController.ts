import { Request, Response, NextFunction } from "express";
import prisma from "../db.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import { UserRequest } from "../types.js";

// Get all offers (admin)
export const getAllOffers = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const offers = await prisma.offer.findMany({
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      status: "success",
      results: offers.length,
      data: {
        data: offers,
      },
    });
  }
);

// Get active offers for banner (public) - only one global banner
export const getActiveOffers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const now = new Date();
    // Get only the most recent active banner (only one global banner allowed)
    const offer = await prisma.offer.findFirst({
      where: {
        isActive: true,
        showBanner: true,
        AND: [
          {
            OR: [
              { startDate: null },
              { startDate: { lte: now } },
            ],
          },
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } },
            ],
          },
        ],
      },
      orderBy: {
        updatedAt: "desc", // Get the most recently updated banner
      },
    });

    res.status(200).json({
      status: "success",
      results: offer ? 1 : 0,
      data: {
        data: offer ? [offer] : [],
      },
    });
  }
);

// Get single offer (admin)
export const getOffer = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const id = parseInt(req.params.id);
    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!offer) {
      return next(new AppError("Offer not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        data: offer,
      },
    });
  }
);

// Create offer (admin)
export const createOffer = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const {
      title,
      description,
      discountPercent,
      targetType,
      targetId,
      targetName,
      productIds, // Array of product IDs for multiple products
      startDate,
      endDate,
      isActive,
      showBanner,
    } = req.body;

    if (!title || discountPercent === undefined) {
      return next(new AppError("Title and discountPercent are required", 400));
    }

    if (discountPercent < 0 || discountPercent > 100) {
      return next(
        new AppError("discountPercent must be between 0 and 100", 400)
      );
    }

    // Validate targetType
    if (targetType && !["product", "category", "all"].includes(targetType)) {
      return next(
        new AppError('targetType must be "product", "category", or "all"', 400)
      );
    }

    // If targetType is product, validate productIds or targetId
    if (targetType === "product") {
      if (productIds && Array.isArray(productIds) && productIds.length > 0) {
        // Multiple products mode
        // Validate all products exist
        const products = await prisma.product.findMany({
          where: { id: { in: productIds } },
        });
        if (products.length !== productIds.length) {
          return next(new AppError("One or more products not found", 404));
        }
      } else if (targetId) {
        // Single product mode (backward compatibility)
        const product = await prisma.product.findUnique({
          where: { id: targetId },
        });
        if (!product) {
          return next(new AppError("Product not found", 404));
        }
      } else {
        return next(
          new AppError("productIds array or targetId is required when targetType is 'product'", 400)
        );
      }
    }

    // If targetType is category, validate targetId
    if (targetType === "category" && !targetId) {
      return next(
        new AppError("targetId is required when targetType is 'category'", 400)
      );
    }

    // Validate dates
    let parsedStartDate = null;
    let parsedEndDate = null;

    if (startDate) {
      parsedStartDate = new Date(startDate);
      if (isNaN(parsedStartDate.getTime())) {
        return next(new AppError("Invalid startDate format", 400));
      }
    }

    if (endDate) {
      parsedEndDate = new Date(endDate);
      if (isNaN(parsedEndDate.getTime())) {
        return next(new AppError("Invalid endDate format", 400));
      }
    }

    if (parsedStartDate && parsedEndDate && parsedStartDate > parsedEndDate) {
      return next(new AppError("startDate must be before endDate", 400));
    }

    // If showBanner is true, set all other offers' showBanner to false (only one global banner)
    const finalShowBanner = showBanner !== undefined ? showBanner : false;
    if (finalShowBanner) {
      await prisma.offer.updateMany({
        where: {
          showBanner: true,
        },
        data: {
          showBanner: false,
        },
      });
    }

    // Determine which products to apply discount to
    const productsToUpdate: number[] = [];
    if (targetType === "product") {
      if (productIds && Array.isArray(productIds) && productIds.length > 0) {
        productsToUpdate.push(...productIds);
      } else if (targetId) {
        productsToUpdate.push(targetId);
      }
    }

    // If targetType is category, verify category exists and apply discount
    if (targetType === "category" && targetId) {
      const category = await prisma.category.findUnique({
        where: { id: targetId },
      });
      if (!category) {
        return next(new AppError("Category not found", 404));
      }
      // Apply discount to category
      await prisma.category.update({
        where: { id: targetId },
        data: { discountPercent },
      });
      // Ensure targetName is set
      if (!targetName) {
        targetName = category.name;
      }
    }

    // Create offer with products
    const offer = await prisma.offer.create({
      data: {
        title,
        description,
        discountPercent,
        targetType: targetType || "all",
        targetId: targetType === "category" ? targetId : null,
        targetName: targetType === "category" ? targetName : null,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        isActive: isActive !== undefined ? isActive : true,
        showBanner: finalShowBanner,
        products: productsToUpdate.length > 0 ? {
          create: productsToUpdate.map(productId => ({
            productId,
          })),
        } : undefined,
      },
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });

    // Apply discount to all products
    if (productsToUpdate.length > 0) {
      // Get all active offers for these products to determine max discount
      const now = new Date();
      for (const productId of productsToUpdate) {
        const allActiveOffers = await prisma.offer.findMany({
          where: {
            isActive: true,
            targetType: "product",
            products: {
              some: {
                productId,
              },
            },
            AND: [
              {
                OR: [
                  { startDate: null },
                  { startDate: { lte: now } },
                ],
              },
              {
                OR: [
                  { endDate: null },
                  { endDate: { gte: now } },
                ],
              },
            ],
          },
        });
        
        const maxDiscount = Math.max(
          ...allActiveOffers.map((o) => o.discountPercent)
        );
        await prisma.product.update({
          where: { id: productId },
          data: { discountPercent: maxDiscount },
        });
      }
    }

    res.status(201).json({
      status: "success",
      data: {
        data: offer,
      },
    });
  }
);

// Update offer (admin)
export const updateOffer = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const id = parseInt(req.params.id);
    const {
      title,
      description,
      discountPercent,
      targetType,
      targetId,
      targetName,
      productIds, // Array of product IDs for multiple products
      startDate,
      endDate,
      isActive,
      showBanner,
    } = req.body;

    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });

    if (!offer) {
      return next(new AppError("Offer not found", 404));
    }

    // Validate discountPercent if provided
    if (discountPercent !== undefined) {
      if (discountPercent < 0 || discountPercent > 100) {
        return next(
          new AppError("discountPercent must be between 0 and 100", 400)
        );
      }
    }

    // Parse dates if provided
    let parsedStartDate = offer.startDate;
    let parsedEndDate = offer.endDate;

    if (startDate !== undefined) {
      if (startDate === null) {
        parsedStartDate = null;
      } else {
        parsedStartDate = new Date(startDate);
        if (isNaN(parsedStartDate.getTime())) {
          return next(new AppError("Invalid startDate format", 400));
        }
      }
    }

    if (endDate !== undefined) {
      if (endDate === null) {
        parsedEndDate = null;
      } else {
        parsedEndDate = new Date(endDate);
        if (isNaN(parsedEndDate.getTime())) {
          return next(new AppError("Invalid endDate format", 400));
        }
      }
    }

    if (parsedStartDate && parsedEndDate && parsedStartDate > parsedEndDate) {
      return next(new AppError("startDate must be before endDate", 400));
    }

    // Update product/category discount if target changed
    const finalIsActive = isActive !== undefined ? isActive : offer.isActive;
    const finalDiscountPercent =
      discountPercent !== undefined ? discountPercent : offer.discountPercent;
    const finalTargetType = targetType || offer.targetType;
    const finalTargetId = targetId !== undefined ? targetId : offer.targetId;

    // Handle product updates - get old and new product IDs
    const oldProductIds = offer.products.map(op => op.productId);
    let newProductIds: number[] = [];
    
    if (finalTargetType === "product") {
      if (productIds && Array.isArray(productIds) && productIds.length > 0) {
        newProductIds = productIds;
        // Validate all products exist
        const products = await prisma.product.findMany({
          where: { id: { in: productIds } },
        });
        if (products.length !== productIds.length) {
          return next(new AppError("One or more products not found", 404));
        }
      } else if (finalTargetId) {
        newProductIds = [finalTargetId];
      }
    }

    // If offer is being deactivated, check for other active offers before removing discount
    if (finalTargetType === "product" && oldProductIds.length > 0) {
      const now = new Date();
      // Process all old products
      for (const productId of oldProductIds) {
        if (!finalIsActive) {
          // Check if there are other active offers for this product
          const otherActiveOffers = await prisma.offer.findMany({
            where: {
              id: { not: id },
              isActive: true,
              targetType: "product",
              products: {
                some: {
                  productId,
                },
              },
              AND: [
                {
                  OR: [
                    { startDate: null },
                    { startDate: { lte: now } },
                  ],
                },
                {
                  OR: [
                    { endDate: null },
                    { endDate: { gte: now } },
                  ],
                },
              ],
            },
          });
          
          // If no other active offers, remove discount; otherwise keep the highest
          if (otherActiveOffers.length === 0) {
            await prisma.product.update({
              where: { id: productId },
              data: { discountPercent: 0 },
            });
          } else {
            const maxDiscount = Math.max(
              ...otherActiveOffers.map((o) => o.discountPercent)
            );
            await prisma.product.update({
              where: { id: productId },
              data: { discountPercent: maxDiscount },
            });
          }
        } else {
          // Apply the discount (or keep the highest if multiple offers exist)
          const allActiveOffers = await prisma.offer.findMany({
            where: {
              isActive: true,
              targetType: "product",
              products: {
                some: {
                  productId,
                },
              },
              AND: [
                {
                  OR: [
                    { startDate: null },
                    { startDate: { lte: now } },
                  ],
                },
                {
                  OR: [
                    { endDate: null },
                    { endDate: { gte: now } },
                  ],
                },
              ],
            },
          });
          
          const maxDiscount = Math.max(
            ...allActiveOffers.map((o) => o.discountPercent)
          );
          await prisma.product.update({
            where: { id: productId },
            data: { discountPercent: maxDiscount },
          });
        }
      }
    }

    if (finalTargetType === "category" && finalTargetId) {
      if (!finalIsActive) {
        // Check if there are other active offers for this category
        const now = new Date();
        const otherActiveOffers = await prisma.offer.findMany({
          where: {
            id: { not: id },
            isActive: true,
            targetType: "category",
            targetId: finalTargetId,
            AND: [
              {
                OR: [
                  { startDate: null },
                  { startDate: { lte: now } },
                ],
              },
              {
                OR: [
                  { endDate: null },
                  { endDate: { gte: now } },
                ],
              },
            ],
          },
        });
        
        // If no other active offers, remove discount; otherwise keep the highest
        if (otherActiveOffers.length === 0) {
          await prisma.category.update({
            where: { id: finalTargetId },
            data: { discountPercent: 0 },
          });
        } else {
          const maxDiscount = Math.max(
            ...otherActiveOffers.map((o) => o.discountPercent)
          );
          await prisma.category.update({
            where: { id: finalTargetId },
            data: { discountPercent: maxDiscount },
          });
        }
      } else {
        // Apply the discount (or keep the highest if multiple offers exist)
        const now = new Date();
        const allActiveOffers = await prisma.offer.findMany({
          where: {
            isActive: true,
            targetType: "category",
            targetId: finalTargetId,
            AND: [
              {
                OR: [
                  { startDate: null },
                  { startDate: { lte: now } },
                ],
              },
              {
                OR: [
                  { endDate: null },
                  { endDate: { gte: now } },
                ],
              },
            ],
          },
        });
        
        const maxDiscount = Math.max(
          ...allActiveOffers.map((o) => o.discountPercent)
        );
        await prisma.category.update({
          where: { id: finalTargetId },
          data: { discountPercent: maxDiscount },
        });
      }
    }

    // If showBanner is being set to true, set all other offers' showBanner to false (only one global banner)
    const finalShowBanner = showBanner !== undefined ? Boolean(showBanner) : offer.showBanner;
    if (finalShowBanner && (!showBanner || showBanner !== offer.showBanner)) {
      await prisma.offer.updateMany({
        where: {
          showBanner: true,
          id: { not: id },
        },
        data: {
          showBanner: false,
        },
      });
    }

    // Build update data object - explicitly handle boolean values
    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (discountPercent !== undefined) updateData.discountPercent = discountPercent;
    if (targetType) updateData.targetType = targetType;
    if (targetId !== undefined) updateData.targetId = targetType === "category" ? targetId : null;
    if (targetName !== undefined) updateData.targetName = targetType === "category" ? targetName : null;
    if (startDate !== undefined) updateData.startDate = parsedStartDate;
    if (endDate !== undefined) updateData.endDate = parsedEndDate;
    // Explicitly handle boolean values - they can be false
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (showBanner !== undefined) updateData.showBanner = Boolean(showBanner);

    // Handle product updates
    if (finalTargetType === "product" && productIds !== undefined) {
      // Delete old product associations
      await prisma.offerProduct.deleteMany({
        where: { offerId: id },
      });
      
      // Create new product associations
      if (newProductIds.length > 0) {
        updateData.products = {
          create: newProductIds.map(productId => ({
            productId,
          })),
        };
      }
    }

    const updatedOffer = await prisma.offer.update({
      where: { id },
      data: updateData,
      include: {
        products: {
          include: {
            product: true,
          },
        },
      },
    });

    // Apply discount to new products
    if (finalTargetType === "product" && newProductIds.length > 0) {
      const now = new Date();
      for (const productId of newProductIds) {
        const allActiveOffers = await prisma.offer.findMany({
          where: {
            isActive: true,
            targetType: "product",
            products: {
              some: {
                productId,
              },
            },
            AND: [
              {
                OR: [
                  { startDate: null },
                  { startDate: { lte: now } },
                ],
              },
              {
                OR: [
                  { endDate: null },
                  { endDate: { gte: now } },
                ],
              },
            ],
          },
        });
        
        const maxDiscount = Math.max(
          ...allActiveOffers.map((o) => o.discountPercent)
        );
        await prisma.product.update({
          where: { id: productId },
          data: { discountPercent: maxDiscount },
        });
      }
    }

    res.status(200).json({
      status: "success",
      data: {
        data: updatedOffer,
      },
    });
  }
);

// Delete offer (admin)
export const deleteOffer = catchAsync(
  async (req: UserRequest, res: Response, next: NextFunction) => {
    const id = parseInt(req.params.id);

    const offer = await prisma.offer.findUnique({
      where: { id },
      include: {
        products: true,
      },
    });

    if (!offer) {
      return next(new AppError("Offer not found", 404));
    }

    // Remove discount from products if applicable
    if (offer.targetType === "product" && offer.products.length > 0) {
      const now = new Date();
      for (const offerProduct of offer.products) {
        // Check if there are other active offers for this product
        const otherActiveOffers = await prisma.offer.findMany({
          where: {
            id: { not: id },
            isActive: true,
            targetType: "product",
            products: {
              some: {
                productId: offerProduct.productId,
              },
            },
            AND: [
              {
                OR: [
                  { startDate: null },
                  { startDate: { lte: now } },
                ],
              },
              {
                OR: [
                  { endDate: null },
                  { endDate: { gte: now } },
                ],
              },
            ],
          },
        });
        
        // If no other active offers, remove discount; otherwise keep the highest
        if (otherActiveOffers.length === 0) {
          await prisma.product.update({
            where: { id: offerProduct.productId },
            data: { discountPercent: 0 },
          });
        } else {
          const maxDiscount = Math.max(
            ...otherActiveOffers.map((o) => o.discountPercent)
          );
          await prisma.product.update({
            where: { id: offerProduct.productId },
            data: { discountPercent: maxDiscount },
          });
        }
      }
    }

    // Remove discount from category if applicable
    if (offer.targetType === "category" && offer.targetId) {
      await prisma.category.update({
        where: { id: offer.targetId },
        data: { discountPercent: 0 },
      });
    }

    await prisma.offer.delete({
      where: { id },
    });

    res.status(204).json({
      status: "success",
      data: null,
    });
  }
);

