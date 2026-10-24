import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { AppError } from "../errors/AppError";
import { HttpStatus } from "../constants/statusCodes";
import { env } from "../config/env";

export const errorHandler: ErrorRequestHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
  let errorCode: string = "INTERNAL_SERVER_ERROR";
  let message: string = "An unexpected internal server error occurred.";
  let details: unknown = undefined;

  // Handle custom operational AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
    details = err.details;
  } else if (err.statusCode) {
    statusCode = err.statusCode;
    errorCode = err.code || errorCode;
    message = err.message || message;
    details = err.details;
  }

  // Handle express malformed JSON body
  if (err instanceof SyntaxError && "status" in err && (err as any).status === 400 && "body" in err) {
    statusCode = HttpStatus.BAD_REQUEST;
    errorCode = "MALFORMED_JSON_PAYLOAD";
    message = "Request body contains invalid or malformed JSON syntax.";
  }

  // Handle Mongoose CastError (e.g., malformed ObjectId)
  if (err.name === "CastError") {
    statusCode = HttpStatus.BAD_REQUEST;
    errorCode = "INVALID_ID_FORMAT";
    message = `Invalid format for field '${err.path}': value '${err.value}' is not a valid identifier.`;
  }

  // Handle Mongoose ValidationError
  if (err.name === "ValidationError") {
    statusCode = HttpStatus.BAD_REQUEST;
    errorCode = "SCHEMA_VALIDATION_ERROR";
    message = "One or more document fields failed Mongoose schema validation.";
    details = Object.values(err.errors).map((e: any) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Handle MongoDB Duplicate Key (E11000)
  if (err.code === 11000) {
    statusCode = HttpStatus.CONFLICT;
    errorCode = "DUPLICATE_KEY_CONFLICT";
    const duplicateFields = Object.keys(err.keyPattern || {});
    message = `A record with this ${duplicateFields.join(", ")} already exists.`;
    details = err.keyValue;
  }

  // Log unexpected internal errors
  if (statusCode >= 500) {
    console.error("💥 [Unhandled Server Error]:", err);
  }

  // Build standard envelope response
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      ...(details !== undefined ? { details } : {}),
      ...(env.NODE_ENV === "development" && statusCode >= 500 ? { stack: err.stack } : {}),
    },
  });
};
