import { Response, NextFunction } from "express";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import { UserRequest } from "../types.js";
import { APIFeatures } from "../utils/apiFeatures.js";


export const deleteOne = (model: any) =>
  catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return next(new AppError("Invalid ID format", 400));
    }

    try {
      await model.delete({
        where: { id },
      });
    } catch (err: any) {
      if (err.code === 'P2025') {
        return next(new AppError("No document found with this ID", 404));
      }
      return next(err);
    }

    res.status(204).json({
      status: "success",
      requestedAt: (req as any).requestTime,
      data: null,
    });
  });

export const updateOne = (model: any) =>
  catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return next(new AppError("Invalid ID format", 400));
    }

    if (req.body.price) req.body.price = parseFloat(req.body.price);
    if (req.body.stock) req.body.stock = parseInt(req.body.stock);
    if (req.body.rating) req.body.rating = parseInt(req.body.rating);

    const doc = await model.update({
      where: { id },
      data: req.body,
    });


    if (!doc) {
      return next(new AppError("No document found with this ID", 404));
    }

    res.status(200).json({
      status: "success",
      requestedAt: (req as any).requestTime,
      data: {
        data: doc,
      },
    });
  });

export const createOne = (model: any) =>
  catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
    // Convert numeric fields if they exist
    if (req.body.price) req.body.price = parseFloat(req.body.price);
    if (req.body.stock) req.body.stock = parseInt(req.body.stock);
    if (req.body.rating) req.body.rating = parseInt(req.body.rating);

    const doc = await model.create({
      data: req.body,
    });


    res.status(201).json({
      status: "success",
      requestedAt: (req as any).requestTime,
      data: {
        data: doc,
      },
    });
  });

export const getOne = (model: any, includeOptions?: any) =>
  catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return next(new AppError("Invalid ID format", 400));
    }

    const queryOptions: any = { where: { id } };
    if (includeOptions) queryOptions.include = includeOptions;

    const doc = await model.findUnique(queryOptions);

    if (!doc) {
      return next(new AppError("No document found with this ID", 404));
    }

    res.status(200).json({
      status: "success",
      requestedAt: (req as any).requestTime,
      data: {
        data: doc,
      },
    });
  });

export const getAll = (model: any) =>
  catchAsync(async (req: UserRequest, res: Response, next: NextFunction) => {
    const features = new APIFeatures(req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const docs = await model.findMany(features.prismaQuery);

    res.status(200).json({
      status: "success",
      results: docs.length,
      requestedAt: (req as any).requestTime,
      data: {
        data: docs,
      },
    });
  });

