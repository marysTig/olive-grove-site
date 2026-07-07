import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';
import { ApiResponse } from '@/utils/ApiResponse';
import { AuthService } from '@/services/auth.service';
import { ApiError } from '@/utils/ApiError';
import User from '@/models/User.model';

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

  // 4. Return user (passwordHash stripped by toJSON transform)
  ApiResponse.success(res, { user: user.toJSON() }, 'Login successful');
});

/**
 * POST /api/v1/auth/logout
 * Clear the JWT cookie.
 */
export const logout = asyncHandler(async (_req: Request, res: Response) => {
  AuthService.clearTokenCookie(res);
  ApiResponse.success(res, null, 'Logged out successfully');
});

/**
 * GET /api/v1/auth/me
 * Return the currently authenticated user.
 * Requires the `protect` middleware to run first.
 */
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Not authenticated');
  }

  // Fetch fresh user data from DB (req.user.id is set by protect middleware)
  const user = await AuthService.getUserById(req.user.id);

  if (!user) {
    AuthService.clearTokenCookie(res);
    throw ApiError.unauthorized('User no longer exists or has been deactivated');
  }

  ApiResponse.success(res, { user: user.toJSON() }, 'Authenticated');
});

/**
 * POST /api/v1/auth/admin/login
 * Dedicated admin login endpoint.
 */
export const adminLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+passwordHash');

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('Your account has been deactivated. Contact an administrator.');
  }

  if (user.role !== 'admin') {
    throw ApiError.forbidden('Only administrators can access the admin panel.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  user.lastLogin = new Date();
  await user.save({ validateModifiedOnly: true });

  const token = AuthService.generateToken(user);
  AuthService.setTokenCookie(res, token);

  ApiResponse.success(res, { user: user.toJSON() }, 'Admin login successful');
});
