import { Request, Response, NextFunction } from "express";
import { AsyncFunction } from "../types.js";

export default (fn: AsyncFunction) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch((err) => next(err));
  };
};

