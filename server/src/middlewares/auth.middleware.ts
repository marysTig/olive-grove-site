import { Request, Response, NextFunction } from "express";
import { ApiError } from "@server/utils/ApiError";
import { asyncHandler } from "@server/utils/asyncHandler";
import { AuthService } from "@server/services/auth.service";

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

export const protect = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const token = AuthService.extractTokenFromRequest(req);

    if (!token) {
      throw ApiError.unauthorized("You are not logged in. Please provide a valid token.");
    }

    const user = await AuthService.verifyAccessToken(token);

    req.user = {
      id: user.id,
      role: user.role,
      fullName: user.fullName,
      email: user.email,
    };

    next();
  },
);
