import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const { method, originalUrl } = req;

  return res.status(httpStatus.NOT_FOUND).json({
    success: false,
    statusCode: httpStatus.NOT_FOUND,
    message: `API Route ${method} ${originalUrl} not found`,
    error: "The route you are trying to access does not exist.",
  });
};
