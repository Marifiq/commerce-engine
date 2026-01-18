import { Request, Response, NextFunction } from "express";
import prisma from "../db.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import { UserRequest } from "../types.js";

// Get all policies (admin)
export const getAllPolicies = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const policies = await prisma.policy.findMany({
    orderBy: { type: "asc" },
  });

  res.status(200).json({
    status: "success",
    results: policies.length,
    data: { policies },
  });
});

// Get policy by type (admin)
export const getPolicyByType = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const { type } = req.params;

  const policy = await prisma.policy.findUnique({
    where: { type },
  });

  if (!policy) {
    return next(new AppError("Policy not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { policy },
  });
});

// Get all active policies (public)
export const getAllActivePolicies = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const policies = await prisma.policy.findMany({
    where: {
      isActive: true,
    },
    orderBy: { type: "asc" },
  });

  res.status(200).json({
    status: "success",
    results: policies.length,
    data: { policies },
  });
});

// Get active policy by type (public)
export const getActivePolicy = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { type } = req.params;

  const policy = await prisma.policy.findFirst({
    where: {
      type,
      isActive: true,
    },
  });

  if (!policy) {
    return next(new AppError("Policy not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { policy },
  });
});

// Create policy
export const createPolicy = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const { type, title, content, isActive } = req.body;

  if (!type || !title || !content) {
    return next(new AppError("Type, title, and content are required", 400));
  }

  const validTypes = ["refund", "return", "terms", "privacy", "shipping", "faqs", "contact", "support", "guides", "size-guide"];
  if (!validTypes.includes(type)) {
    return next(new AppError(`Invalid policy type. Must be one of: ${validTypes.join(", ")}`, 400));
  }

  // Check if policy type already exists
  const existingPolicy = await prisma.policy.findUnique({
    where: { type },
  });

  if (existingPolicy) {
    return next(new AppError("Policy with this type already exists. Use update instead.", 400));
  }

  const policy = await prisma.policy.create({
    data: {
      type,
      title,
      content,
      isActive: isActive !== undefined ? isActive : true,
    },
  });

  res.status(201).json({
    status: "success",
    data: { policy },
  });
});

// Update policy
export const updatePolicy = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const policyId = parseInt(req.params.id);
  const { title, content, isActive } = req.body;

  if (isNaN(policyId)) {
    return next(new AppError("Invalid policy ID", 400));
  }

  const policy = await prisma.policy.findUnique({
    where: { id: policyId },
  });

  if (!policy) {
    return next(new AppError("Policy not found", 404));
  }

  const updateData: any = {};
  if (title !== undefined) updateData.title = title;
  if (content !== undefined) updateData.content = content;
  if (isActive !== undefined) updateData.isActive = isActive;

  const updatedPolicy = await prisma.policy.update({
    where: { id: policyId },
    data: updateData,
  });

  res.status(200).json({
    status: "success",
    data: { policy: updatedPolicy },
  });
});

// Delete policy
export const deletePolicy = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const policyId = parseInt(req.params.id);

  if (isNaN(policyId)) {
    return next(new AppError("Invalid policy ID", 400));
  }

  const policy = await prisma.policy.findUnique({
    where: { id: policyId },
  });

  if (!policy) {
    return next(new AppError("Policy not found", 404));
  }

  await prisma.policy.delete({
    where: { id: policyId },
  });

  res.status(204).json({
    status: "success",
    data: null,
  });
});

// Toggle policy active status
export const togglePolicyStatus = catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
  const policyId = parseInt(req.params.id);

  if (isNaN(policyId)) {
    return next(new AppError("Invalid policy ID", 400));
  }

  const policy = await prisma.policy.findUnique({
    where: { id: policyId },
  });

  if (!policy) {
    return next(new AppError("Policy not found", 404));
  }

  const updatedPolicy = await prisma.policy.update({
    where: { id: policyId },
    data: {
      isActive: !policy.isActive,
    },
  });

  res.status(200).json({
    status: "success",
    data: { policy: updatedPolicy },
  });
});

