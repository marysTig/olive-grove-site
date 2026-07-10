import { Request, Response, NextFunction } from "express";
import { env } from "@server/config/env.config";
import { ApiError } from "@server/utils/ApiError";
import { logger } from "@server/utils/logger";

interface ErrorResponse {
  success: false;
  statusCode: number;
  status: string;
  message: string;
  errors?: unknown;
  stack?: string;
}

const handleJWTError = (): ApiError => {
  return ApiError.unauthorized("Invalid token. Please log in again.");
};

const handleJWTExpiredError = (): ApiError => {
  return ApiError.unauthorized("Token has expired. Please log in again.");
};

export const errorHandler = (
  err: Error | ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let error: ApiError;

  if (err instanceof ApiError) {
    error = err;
  } else if (err.name === "JsonWebTokenError") {
    error = handleJWTError();
  } else if (err.name === "TokenExpiredError") {
    error = handleJWTExpiredError();
  } else {
    error = ApiError.internal(err.message || "Something went very wrong");
  }

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

  if (env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  res.status(error.statusCode).json(response);
};
