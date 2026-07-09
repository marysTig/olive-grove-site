import { Request, Response, NextFunction } from "express";
import { ApiError } from "@server/utils/ApiError";

/**
 * Role-based access control middleware factory.
 * Must be used AFTER the `protect` middleware.
 *
 * @param roles - Allowed roles (e.g., 'admin', 'manager')
 *
 * @example
 *   router.delete('/product/:id', protect, restrictTo('admin'), deleteProduct);
 */
export const restrictTo = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required before authorization."));
    }

    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden("You do not have permission to perform this action."));
    }

    next();
  };
};
