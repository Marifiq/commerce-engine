import { Request, Response, NextFunction } from "express";
import { User } from "@prisma/client";

export interface UserRequest extends Request {
  user?: Partial<User>;
}

export type AsyncFunction = (req: Request | UserRequest, res: Response, next: NextFunction) => Promise<any>;

export interface IAppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;
}
