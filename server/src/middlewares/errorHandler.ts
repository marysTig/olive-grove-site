import { Request, Response, NextFunction } from "express";
import { env } from "@/config/env.config";
import { ApiError } from "@/utils/ApiError";
import { logger } from "@/utils/logger";
import mongoose from "mongoose";

interface ErrorResponse {
  success: false;
  statusCode: number;
  status: string;
  message: string;
  errors?: unknown;
  stack?: string;
}

/**
 * Handles Mongoose CastError (invalid ObjectId, etc.)
 */
const handleCastError = (err: mongoose.Error.CastError): ApiError => {
  return new ApiError(400, `Invalid ${err.path}: ${err.value}`);
};

/**
 * Handles Mongoose ValidationError
 */
const handleValidationError = (err: mongoose.Error.ValidationError): ApiError => {
  const messages = Object.values(err.errors).map((e) => e.message);
  return new ApiError(400, `Validation failed: ${messages.join(". ")}`);
};

/**
 * Handles MongoDB duplicate key error (code 11000)
 */
const handleDuplicateKeyError = (err: Record<string, unknown>): ApiError => {
  const keyValue = err.keyValue as Record<string, unknown> | undefined;
  const field = keyValue ? Object.keys(keyValue).join(", ") : "field";
  return new ApiError(409, `Duplicate value for: ${field}. Please use another value.`);
};

/**
 * Handles invalid JWT errors
 */
const handleJWTError = (): ApiError => {
  return ApiError.unauthorized("Invalid token. Please log in again.");
};

/**
 * Handles expired JWT errors
 */
const handleJWTExpiredError = (): ApiError => {
  return ApiError.unauthorized("Token has expired. Please log in again.");
};

// ── Global Error Handler Middleware ────────────────────────────

export const errorHandler = (
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let error: ApiError;

  if (err instanceof ApiError) {
    error = err;
  } else if (err.name === "CastError") {
    error = handleCastError(err as unknown as mongoose.Error.CastError);
  } else if (err.name === "ValidationError") {
    error = handleValidationError(err as unknown as mongoose.Error.ValidationError);
  } else if ((err as unknown as Record<string, unknown>).code === 11000) {
    error = handleDuplicateKeyError(err as unknown as Record<string, unknown>);
  } else if (err.name === "JsonWebTokenError") {
    error = handleJWTError();
  } else if (err.name === "TokenExpiredError") {
    error = handleJWTExpiredError();
  } else {
    error = ApiError.internal(err.message || "Something went very wrong");
  }

  // Always log the full error server-side
  logger.error(`[${error.statusCode}] ${error.message}`, {
    stack: err.stack,
    isOperational: error.isOperational,
  });

  const response: ErrorResponse = {
    success: false,
    statusCode: error.statusCode,
    status: error.status,
    message: error.message,
  };

  // Include stack trace only in development
  if (env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  res.status(error.statusCode).json(response);
};
