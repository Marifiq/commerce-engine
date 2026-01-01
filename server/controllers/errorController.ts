import { Request, Response, NextFunction } from "express";
import { IAppError } from "../types.js";
import AppError from "../utils/appError.js";

const handleDuplicateFieldsDB = (err: any) => {
  const field = err.meta?.target?.[0] || 'field';
  const message = `Duplicate field value for ${field}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err: any) => {
  const message = `Invalid input data: ${err.message}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError("Invalid token. Please log in again!", 401);

const handleJWTExpiredError = () =>
  new AppError("Your token has expired! Please log in again.", 401);

const handleRecordNotFoundDB = () =>
  new AppError("No record found with that ID.", 404);

const sendErrorDev = (err: IAppError, res: Response) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err: IAppError, res: Response) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
  // Programming or other unknown error: don't leak error details
  else {
    // 1) Log error
    console.error("ERROR 💥", err);

    // 2) Send generic message
    res.status(500).json({
      status: "error",
      message: "Something went very wrong!",
    });
  }
};

export default (err: any, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };
    error.message = err.message;

    // Prisma specific errors
    if (err.code === "P2002") error = handleDuplicateFieldsDB(error);
    if (err.code === "P2025") error = handleRecordNotFoundDB();
    if (err.name === "PrismaClientValidationError") error = handleValidationErrorDB(error);

    // JWT errors
    if (err.name === "JsonWebTokenError") error = handleJWTError();
    if (err.name === "TokenExpiredError") error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};
