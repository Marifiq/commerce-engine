import { Response, NextFunction } from "express";
import prisma from "../db.js";
import * as factory from "./handlerFactory.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import { UserRequest } from "../types.js";

const filterObj = (obj: any, ...allowedFields: string[]) => {
  const newObj: any = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

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

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(req.body, "name", "email");

  // 3) Update user document
  const updatedUser = await prisma.user.update({
    where: { id: req.user!.id },
    data: filteredBody,
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

export const getAllUsers = factory.getAll(prisma.user);
export const getUser = factory.getOne(prisma.user);
export const createUser = factory.createOne(prisma.user);
export const updateUser = factory.updateOne(prisma.user);
export const deleteUser = factory.deleteOne(prisma.user);


