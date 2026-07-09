import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiResponse } from "@/utils/ApiResponse";
import { AuthService } from "@/services/auth.service";
import { ApiError } from "@/utils/ApiError";

/**
 * POST /api/v1/auth/login
 * Authenticate admin/employee with email and password.
 * Sets JWT in HttpOnly cookie.
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // 1. Authenticate user
  const user = await AuthService.login(email, password);

  // 2. Generate JWT
  const token = AuthService.generateToken(user);

  // 3. Set cookie
  AuthService.setTokenCookie(res, token);

  // 4. Return user
  ApiResponse.success(res, { user }, "Login successful");
});

/**
 * POST /api/v1/auth/logout
 * Clear the JWT cookie.
 */
export const logout = asyncHandler(async (_req: Request, res: Response) => {
  AuthService.clearTokenCookie(res);
  ApiResponse.success(res, null, "Logged out successfully");
});

/**
 * GET /api/v1/auth/me
 * Return the currently authenticated user.
 * Requires the `protect` middleware to run first.
 */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized("Not authenticated");
  }

  // Fetch fresh user data from DB
  const user = await AuthService.getUserById(req.user.id);

  if (!user) {
    AuthService.clearTokenCookie(res);
    throw ApiError.unauthorized("User no longer exists or has been deactivated");
  }

  ApiResponse.success(res, { user }, "Authenticated");
});

/**
 * POST /api/v1/auth/admin/login
 * Dedicated admin login endpoint.
 */
export const adminLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await AuthService.login(email, password);

  if (user.role !== "admin") {
    throw ApiError.forbidden("Only administrators can access the admin panel.");
  }

  const token = AuthService.generateToken(user);
  AuthService.setTokenCookie(res, token);

  ApiResponse.success(res, { user }, "Admin login successful");
});

