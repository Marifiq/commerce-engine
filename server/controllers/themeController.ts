import { Request, Response, NextFunction } from "express";
import prisma from "../db.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import { UserRequest } from "../types.js";

// Get all themes
export const getAllThemes = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const themes = await prisma.theme.findMany({
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json({
    status: "success",
    results: themes.length,
    data: { themes },
  });
});

// Get active theme (admin)
export const getActiveTheme = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const theme = await prisma.theme.findFirst({
    where: { isActive: true },
  });

  if (!theme) {
    return res.status(200).json({
      status: "success",
      data: { theme: null },
    });
  }

  res.status(200).json({
    status: "success",
    data: { theme },
  });
});

// Get active theme (public)
export const getPublicActiveTheme = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const theme = await prisma.theme.findFirst({
    where: { isActive: true },
  });

  if (!theme) {
    return res.status(200).json({
      status: "success",
      data: { theme: null },
    });
  }

  res.status(200).json({
    status: "success",
    data: { theme },
  });
});

// Create theme
export const createTheme = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const { name, colors, fonts, layout, isActive } = req.body;

  if (!name) {
    return next(new AppError("Theme name is required", 400));
  }

  // If setting as active, deactivate all other themes
  if (isActive) {
    await prisma.theme.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });
  }

  const theme = await prisma.theme.create({
    data: {
      name,
      colors: colors || null,
      fonts: fonts || null,
      layout: layout || null,
      isActive: isActive || false,
    },
  });

  res.status(201).json({
    status: "success",
    data: { theme },
  });
});

// Update theme
export const updateTheme = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const themeId = parseInt(req.params.id);
  const { name, colors, fonts, layout, isActive } = req.body;

  if (isNaN(themeId)) {
    return next(new AppError("Invalid theme ID", 400));
  }

  const theme = await prisma.theme.findUnique({
    where: { id: themeId },
  });

  if (!theme) {
    return next(new AppError("Theme not found", 404));
  }

  // If setting as active, deactivate all other themes
  if (isActive === true) {
    await prisma.theme.updateMany({
      where: {
        isActive: true,
        id: { not: themeId },
      },
      data: { isActive: false },
    });
  }

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (colors !== undefined) updateData.colors = colors;
  if (fonts !== undefined) updateData.fonts = fonts;
  if (layout !== undefined) updateData.layout = layout;
  if (isActive !== undefined) updateData.isActive = isActive;

  const updatedTheme = await prisma.theme.update({
    where: { id: themeId },
    data: updateData,
  });

  res.status(200).json({
    status: "success",
    data: { theme: updatedTheme },
  });
});

// Activate theme
export const activateTheme = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const themeId = parseInt(req.params.id);

  if (isNaN(themeId)) {
    return next(new AppError("Invalid theme ID", 400));
  }

  const theme = await prisma.theme.findUnique({
    where: { id: themeId },
  });

  if (!theme) {
    return next(new AppError("Theme not found", 404));
  }

  // Deactivate all other themes
  await prisma.theme.updateMany({
    where: {
      isActive: true,
      id: { not: themeId },
    },
    data: { isActive: false },
  });

  // Activate this theme
  const updatedTheme = await prisma.theme.update({
    where: { id: themeId },
    data: { isActive: true },
  });

  res.status(200).json({
    status: "success",
    data: { theme: updatedTheme },
  });
});

// Delete theme
export const deleteTheme = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const themeId = parseInt(req.params.id);

  if (isNaN(themeId)) {
    return next(new AppError("Invalid theme ID", 400));
  }

  const theme = await prisma.theme.findUnique({
    where: { id: themeId },
  });

  if (!theme) {
    return next(new AppError("Theme not found", 404));
  }

  if (theme.isActive) {
    return next(new AppError("Cannot delete active theme. Activate another theme first.", 400));
  }

  await prisma.theme.delete({
    where: { id: themeId },
  });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

