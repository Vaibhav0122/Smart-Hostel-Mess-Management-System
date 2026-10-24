import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { AppError } from "../errors/AppError";
import { HttpStatus } from "../constants/statusCodes";

export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Assign parsed & sanitized values back to request
      req.body = parsed.body ?? req.body;
      req.query = parsed.query ?? req.query;
      req.params = parsed.params ?? req.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((err) => ({
          field: err.path.join(".").replace(/^(body|query|params)\./, ""),
          message: err.message,
        }));

        next(
          new AppError(
            HttpStatus.BAD_REQUEST,
            "VALIDATION_ERROR",
            "The request payload failed input validation requirements.",
            details
          )
        );
      } else {
        next(error);
      }
    }
  };
};
