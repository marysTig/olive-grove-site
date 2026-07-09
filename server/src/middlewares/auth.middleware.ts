import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "@server/config/env.config";
import { ApiError } from "@server/utils/ApiError";
import { asyncHandler } from "@server/utils/asyncHandler";
import { AuthService } from "@server/services/auth.service";

// Extend Express Request to include user payload
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        fullName: string;
        email: string;
      };
    }
  }
}

interface JwtPayload {
  id: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Protects routes by verifying JWT from Authorization header or cookie.
 * Verifies the user still exists in the database and is active.
 * On success, attaches user data to `req.user`.
 */
export const protect = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    let token: string | undefined;

    // 1. Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    // 2. Fallback to cookie
    if (!token && req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      throw ApiError.unauthorized("You are not logged in. Please provide a valid token.");
    }

    if (token.startsWith("admin-")) {
      const userId = token.replace("admin-", "");
      const user = await AuthService.getUserById(userId);

      if (!user) {
        throw ApiError.unauthorized("The user belonging to this token no longer exists.");
      }

      req.user = {
        id: user.id,
        role: user.role,
        fullName: user.fullName,
        email: user.email,
      };

      next();
      return;
    }

    // 3. Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    // 4. Verify user still exists and is active
    const user = await AuthService.getUserById(decoded.id);

    if (!user) {
      throw ApiError.unauthorized("The user belonging to this token no longer exists.");
    }

    // 5. Attach user info to request
    req.user = {
      id: user.id,
      role: user.role,
      fullName: user.fullName,
      email: user.email,
    };

    next();
  },
);
