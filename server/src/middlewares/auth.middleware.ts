import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env.config';
import { ApiError } from '@/utils/ApiError';
import { asyncHandler } from '@/utils/asyncHandler';
import User from '@/models/User.model';

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
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 2. Fallback to cookie
    if (!token && req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      throw ApiError.unauthorized(
        'You are not logged in. Please provide a valid token.'
      );
    }

    // 3. Verify token
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    // 4. Verify user still exists and is active
    const user = await User.findById(decoded.id);

    if (!user) {
      throw ApiError.unauthorized(
        'The user belonging to this token no longer exists.'
      );
    }

    if (!user.isActive) {
      throw ApiError.forbidden(
        'Your account has been deactivated. Contact an administrator.'
      );
    }

    // 5. Attach user info to request
    req.user = {
      id: user._id.toString(),
      role: user.role,
      fullName: user.fullName,
      email: user.email,
    };

    next();
  }
);
