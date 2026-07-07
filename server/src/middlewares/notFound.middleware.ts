import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@/utils/ApiError';

/**
 * Catch-all middleware for unmatched routes.
 * Must be mounted AFTER all valid route handlers.
 */
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  next(ApiError.notFound(`Cannot find ${req.method} ${req.originalUrl}`));
};
