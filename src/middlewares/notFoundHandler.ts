import { Request, Response } from "express";
import { HttpStatus } from "../constants/statusCodes";

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(HttpStatus.NOT_FOUND).json({
    success: false,
    error: {
      code: "ROUTE_NOT_FOUND",
      message: `Cannot ${req.method} ${req.originalUrl}. The requested endpoint does not exist.`,
    },
  });
};
